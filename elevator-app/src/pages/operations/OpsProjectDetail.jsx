import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getBillingMilestones,
  getOpsProject,
  getProjectActivity,
  getProjectComments,
  addProjectComment,
  deleteProjectComment,
  logProjectActivity,
  updateOpsProject,
  upsertBillingMilestone,
} from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { OPS_STATUSES, statusDef } from './OperationsList'
import useIsMobile from '../../hooks/useIsMobile'
import {
  TEAM_MEMBERS,
  OWNER_ROLES,
  REQUIRED_DOCUMENTS,
  canViewFinancials,
  formatMissingList,
  getMissingOwnershipFields,
  getMissingRequiredDocuments,
  isMovingForward,
  shouldRequireApprovalDocuments,
  shouldRequireWorkflowOwnership,
} from './workflow'
import { shouldHideContactNumbers } from '../../lib/trialMode'
import { maskProjectName } from '../../lib/trialMode'

const HEALTH = {
  on_track: { label: 'On Track', bg: '#2C2C2C', color: '#D4AF37' },
  needs_attention: { label: 'Needs Attention', bg: '#5C4A00', color: '#F5D87A' },
  blocked: { label: 'Blocked', bg: '#8B4500', color: '#FFD0A0' },
  overdue: { label: 'Overdue', bg: '#8B0000', color: '#FFAAAA' },
}

const BILLING_TYPES = [
  { value: 'downpayment', label: 'Downpayment' },
  { value: 'pre_shipment', label: 'Pre-Shipment' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'installation', label: 'Installation' },
  { value: 'final_collection', label: 'Final Collection' },
]

const BILLING_STATUS = {
  pending: { label: 'Pending', bg: '#E8E0C8', color: '#2C2C2C' },
  invoiced: { label: 'Invoiced', bg: '#5C4A00', color: '#F5D87A' },
  paid: { label: 'Paid', bg: '#2C2C2C', color: '#D4AF37' },
  overdue: { label: 'Overdue', bg: '#8B0000', color: '#FFAAAA' },
}

const sectionStyle = { backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 20, marginBottom: 16 }
const sectionTitle = { fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 14 }
const inputStyle = { border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '7px 10px', fontSize: 13, outline: 'none', width: '100%' }

function timeSince(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function roleLabel(role) {
  return OWNER_ROLES.find(item => item.value === role)?.label || 'Not set'
}

export default function OpsProjectDetail() {
  const { id } = useParams()
  const { user, role } = useAuth()
  const author = user?.email || 'staff'
  const isMobile = useIsMobile(900)
  const hideContactNumbers = shouldHideContactNumbers()

  const [project, setProject] = useState(null)
  const [activity, setActivity] = useState([])
  const [comments, setComments] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [workflowError, setWorkflowError] = useState('')

  const [editingNextAction, setEditingNextAction] = useState(false)
  const [nextAction, setNextAction] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [ownerRole, setOwnerRole] = useState('operations')

  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newHealth, setNewHealth] = useState('on_track')

  const [savingDocs, setSavingDocs] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const [commentText, setCommentText] = useState('')

  const [editingBilling, setEditingBilling] = useState(null)
  const [billingForm, setBillingForm] = useState({})

  async function load() {
    const [{ data: p }, { data: a }, { data: c }, { data: m }] = await Promise.all([
      getOpsProject(id),
      getProjectActivity(id),
      getProjectComments(id),
      getBillingMilestones(id),
    ])
    setProject(p)
    setActivity(a || [])
    setComments(c || [])
    setMilestones(m || [])
    if (p) {
      setNextAction(p.next_action || '')
      setNextActionDate(p.next_action_date || '')
      setAssignedTo(p.assigned_to || '')
      setOwnerRole(p.owner_role || 'operations')
      setNewStatus(p.status || 'awaiting_shaft_readiness')
      setNewHealth(p.health || 'on_track')
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  const missingOwnership = useMemo(() => getMissingOwnershipFields(project), [project])
  const missingDocuments = useMemo(() => getMissingRequiredDocuments(project), [project])
  const hasEscalated = useMemo(() => {
    if (!project?.next_action_date) return false
    return Date.now() - new Date(project.next_action_date).getTime() > 3 * 86400000
  }, [project])

  async function saveNextAction() {
    const trimmedAction = nextAction.trim()
    if (!trimmedAction || !nextActionDate || !assignedTo || !ownerRole) {
      setWorkflowError('Set the owner role, assigned person, next action, and next action date before saving.')
      return
    }
    setWorkflowError('')
    await updateOpsProject(id, {
      owner_role: ownerRole,
      next_action: trimmedAction,
      next_action_date: nextActionDate,
      assigned_to: assignedTo,
      escalation_notified_at: null,
      last_updated_at: new Date().toISOString(),
      last_updated_by: author,
    })
    await logProjectActivity(id, 'next_action_updated', `${ownerRole} owns "${trimmedAction}" and it is assigned to ${assignedTo}`, author)
    setEditingNextAction(false)
    await load()
  }

  async function saveStatus() {
    const movingForward = isMovingForward(OPS_STATUSES, project.status, newStatus)
    if (movingForward && shouldRequireWorkflowOwnership(newStatus)) {
      const ownershipMissing = getMissingOwnershipFields({
        ...project,
        owner_role: ownerRole || project.owner_role,
        next_action: nextAction || project.next_action,
        next_action_date: nextActionDate || project.next_action_date,
        assigned_to: assignedTo || project.assigned_to,
      })
      if (ownershipMissing.length) {
        setWorkflowError(`Set the ${formatMissingList(ownershipMissing)} before moving this project forward.`)
        return
      }
    }
    if (movingForward && shouldRequireApprovalDocuments(OPS_STATUSES, newStatus)) {
      const docsMissing = getMissingRequiredDocuments(project)
      if (docsMissing.length) {
        setWorkflowError(`Complete ${formatMissingList(docsMissing.map(doc => doc.label.toLowerCase()))} before moving this project forward.`)
        return
      }
    }

    setWorkflowError('')
    const prev = project.status
    await updateOpsProject(id, {
      status: newStatus,
      health: newHealth,
      last_updated_at: new Date().toISOString(),
      last_updated_by: author,
    })
    await logProjectActivity(id, 'status_updated', `Status changed from ${prev} to ${newStatus}. Health: ${newHealth}`, author)
    setEditingStatus(false)
    await load()
  }

  async function toggleDocument(docKey, checked) {
    setSavingDocs(true)
    setWorkflowError('')
    await updateOpsProject(id, {
      [docKey]: checked,
      last_updated_at: new Date().toISOString(),
      last_updated_by: author,
    })
    const doc = REQUIRED_DOCUMENTS.find(item => item.key === docKey)
    await logProjectActivity(id, 'document_updated', `${doc?.label || docKey} marked ${checked ? 'complete' : 'incomplete'}`, author)
    setSavingDocs(false)
    await load()
  }

  async function postComment() {
    if (!commentText.trim()) return
    setPostingComment(true)
    await addProjectComment(id, commentText.trim(), author)
    await logProjectActivity(id, 'comment_added', commentText.trim(), author)
    setCommentText('')
    setPostingComment(false)
    await load()
  }

  async function removeComment(commentId) {
    await deleteProjectComment(commentId)
    await load()
  }

  async function saveBilling(type) {
    await upsertBillingMilestone(id, type, {
      amount: billingForm.amount ? parseFloat(billingForm.amount) : null,
      due_date: billingForm.due_date || null,
      paid_date: billingForm.paid_date || null,
      status: billingForm.status || 'pending',
      notes: billingForm.notes || null,
    })
    await logProjectActivity(id, 'billing_updated', `Billing: ${type} marked as ${billingForm.status}`, author)
    setEditingBilling(null)
    setBillingForm({})
    await load()
  }

  if (loading) return <p style={{ color: '#888888' }}>Loading...</p>
  if (!project) return <p style={{ color: '#8B0000' }}>Project not found.</p>

  const status = statusDef(project.status)
  const health = HEALTH[project.health] || HEALTH.on_track

  return (
    <div style={{ maxWidth: 920 }}>
      <Link to="/operations" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Project Status</Link>
      <div className="mobile-stack" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', justifyContent: 'space-between', margin: '12px 0 20px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2C2C2C', marginBottom: 6 }}>{maskProjectName(project.project_name)}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ backgroundColor: status.bg, color: status.color, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{status.label}</span>
            <span style={{ backgroundColor: health.bg, color: health.color, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{health.label}</span>
            {project.pic && <span style={{ fontSize: 12, color: '#888888' }}>PIC: <strong>{project.pic}</strong></span>}
            {project.assigned_to && <span style={{ fontSize: 12, color: '#888888' }}>Assigned: <strong>{project.assigned_to}</strong></span>}
            <span style={{ fontSize: 12, color: '#888888' }}>Owner: <strong>{roleLabel(project.owner_role)}</strong></span>
            {project.pipeline_id && (
              <Link to={`/pipeline/${project.pipeline_id}`} style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>
                View pipeline →
              </Link>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto' }}>
          <Link to={`/operations/${id}/edit`} style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', width: isMobile ? '100%' : 'auto', textAlign: 'center' }}>
            Edit Project
          </Link>
        </div>
      </div>

      <div style={{ ...sectionStyle, marginBottom: 16, padding: 14 }}>
        <p style={{ ...sectionTitle, marginBottom: 10 }}>Quick actions</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="#ownership" style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '7px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Owner & next step</a>
          <a href="#documents" style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '7px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Approvals</a>
          <a href="#status-health" style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '7px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Update status</a>
          <a href="#comments" style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '7px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Notes</a>
          <a href="#activity-log" style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '7px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Activity</a>
        </div>
      </div>

      {workflowError && (
        <div style={{ backgroundColor: '#FFF4F0', border: '1px solid #8B0000', padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#8B0000', marginBottom: 2 }}>Workflow blocked</p>
          <p style={{ fontSize: 12, color: '#8B0000' }}>{workflowError}</p>
        </div>
      )}

      {project.status !== 'handed_over' && missingOwnership.length > 0 && (
        <div style={{ backgroundColor: '#FFF8E8', border: '1px solid #D4AF37', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C' }}>This project needs one clear owner</p>
            <p style={{ fontSize: 12, color: '#8B4500' }}>Still missing: {formatMissingList(missingOwnership)}.</p>
          </div>
          <button onClick={() => setEditingNextAction(true)} style={{ marginLeft: 'auto', backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Fix now →
          </button>
        </div>
      )}

      {shouldRequireApprovalDocuments(OPS_STATUSES, project.status) && missingDocuments.length > 0 && (
        <div style={{ backgroundColor: '#FFF8E8', border: '1px solid #D4AF37', padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 4 }}>Required approvals are still incomplete</p>
          <p style={{ fontSize: 12, color: '#8B4500' }}>
            Missing: {formatMissingList(missingDocuments.map(doc => doc.label.toLowerCase()))}. Forward status movement is blocked until these are complete.
          </p>
        </div>
      )}

      {hasEscalated && project.status !== 'handed_over' && (
        <div style={{ backgroundColor: '#FFF4F0', border: '1px solid #8B0000', padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#8B0000', marginBottom: 2 }}>Escalated after 3 days</p>
          <p style={{ fontSize: 12, color: '#8B0000' }}>
            The next action date passed more than 3 days ago. This project should already be visible to admin and owner follow-up.
          </p>
        </div>
      )}

      <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
        <div>
          <div id="ownership" style={sectionStyle}>
            <p style={sectionTitle}>Owner & next step</p>
            {!editingNextAction ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D4AF37', padding: 10 }}>
                    <p style={{ fontSize: 11, color: '#888888', marginBottom: 4 }}>Owner role</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{roleLabel(project.owner_role)}</p>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D4AF37', padding: 10 }}>
                    <p style={{ fontSize: 11, color: '#888888', marginBottom: 4 }}>Assigned to</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{project.assigned_to || 'Not set'}</p>
                  </div>
                </div>
                {project.next_action ? (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }}>{project.next_action}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888888', flexWrap: 'wrap' }}>
                      <span>Due: <strong style={{ color: '#8B4500' }}>{formatDate(project.next_action_date)}</strong></span>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: '#CCCCCC', fontStyle: 'italic' }}>No next action set</p>
                )}
                <button onClick={() => setEditingNextAction(true)} style={{ marginTop: 10, fontSize: 12, color: '#D4AF37', background: 'none', border: '1px solid #D4AF37', padding: '4px 10px', cursor: 'pointer' }}>
                  {project.next_action ? 'Update' : 'Set next action'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select value={ownerRole} onChange={e => setOwnerRole(e.target.value)} style={inputStyle}>
                  {OWNER_ROLES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <input value={nextAction} onChange={e => setNextAction(e.target.value)} placeholder="What needs to happen next?" style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                  <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} style={inputStyle} />
                  <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={inputStyle}>
                    <option value="">Assign to...</option>
                    {TEAM_MEMBERS.map(member => <option key={member} value={member}>{member}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveNextAction} style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setEditingNextAction(false)} style={{ background: 'none', border: '1px solid #D4AF37', color: '#888888', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div id="status-health" style={sectionStyle}>
            <p style={sectionTitle}>Status & health</p>
            {!editingStatus ? (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{status.label}</span>
                  <span style={{ backgroundColor: health.bg, color: health.color, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{health.label}</span>
                </div>
                <button onClick={() => setEditingStatus(true)} style={{ fontSize: 12, color: '#D4AF37', background: 'none', border: '1px solid #D4AF37', padding: '4px 10px', cursor: 'pointer' }}>
                  Update status
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={inputStyle}>
                  {OPS_STATUSES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
                <select value={newHealth} onChange={e => setNewHealth(e.target.value)} style={inputStyle}>
                  {Object.entries(HEALTH).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveStatus} style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setEditingStatus(false)} style={{ background: 'none', border: '1px solid #D4AF37', color: '#888888', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <p style={sectionTitle}>Project info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              {project.address && <div><span style={{ color: '#888888' }}>Address: </span>{project.address}</div>}
              {project.specs && <div><span style={{ color: '#888888' }}>Specs: </span>{project.specs}</div>}
              {project.unit_label && <div><span style={{ color: '#888888' }}>Unit: </span>{project.unit_label}</div>}
              {project.s_o_f && <div><span style={{ color: '#888888' }}>S/O/F: </span>{project.s_o_f}</div>}
              {project.subcon && <div><span style={{ color: '#888888' }}>Subcon: </span>{project.subcon}</div>}
              {project.contact_person && (
                <div>
                  <span style={{ color: '#888888' }}>Contact: </span>
                  {project.contact_person}
                  {!hideContactNumbers && role === 'admin' && project.contact_number ? ` · ${project.contact_number}` : ''}
                  {hideContactNumbers && project.contact_number ? ' · Hidden during trial' : ''}
                </div>
              )}
              {project.concerns && (
                <div style={{ marginTop: 6, backgroundColor: '#FFFBF0', border: '1px solid #D4AF37', padding: 10 }}>
                  <p style={{ fontSize: 11, color: '#888888', marginBottom: 4 }}>Concerns / notes</p>
                  <p style={{ fontSize: 13, color: '#2C2C2C' }}>{project.concerns}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div id="documents" style={sectionStyle}>
            <p style={sectionTitle}>Required approvals</p>
            <p style={{ fontSize: 12, color: '#888888', marginBottom: 12 }}>
              These are the blocking approvals that should be complete before the project moves deeper into execution.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REQUIRED_DOCUMENTS.map(doc => {
                const checked = Boolean(project[doc.key])
                return (
                  <div key={doc.key} style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', padding: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{doc.label}</p>
                        <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>{doc.help}</p>
                      </div>
                      <button
                        disabled={savingDocs}
                        onClick={() => toggleDocument(doc.key, !checked)}
                        style={{
                          border: '1px solid #D4AF37',
                          backgroundColor: checked ? '#D4AF37' : '#FFFFFF',
                          color: checked ? '#2C2C2C' : '#888888',
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: savingDocs ? 'default' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {checked ? 'Approved' : 'Mark complete'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {canViewFinancials(role) && (
            <div style={sectionStyle}>
              <p style={sectionTitle}>Billing milestones</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {BILLING_TYPES.map(bt => {
                  const milestone = milestones.find(item => item.milestone_type === bt.value)
                  const badge = milestone ? (BILLING_STATUS[milestone.status] || BILLING_STATUS.pending) : null
                  return (
                    <div key={bt.value}>
                      {editingBilling === bt.value ? (
                        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D4AF37', padding: 12 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', marginBottom: 8 }}>{bt.label}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <input placeholder="Amount (PHP)" type="number" value={billingForm.amount || ''} onChange={e => setBillingForm(form => ({ ...form, amount: e.target.value }))} style={inputStyle} />
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 6 }}>
                              <div>
                                <p style={{ fontSize: 11, color: '#888888', marginBottom: 2 }}>Due date</p>
                                <input type="date" value={billingForm.due_date || ''} onChange={e => setBillingForm(form => ({ ...form, due_date: e.target.value }))} style={inputStyle} />
                              </div>
                              <div>
                                <p style={{ fontSize: 11, color: '#888888', marginBottom: 2 }}>Paid date</p>
                                <input type="date" value={billingForm.paid_date || ''} onChange={e => setBillingForm(form => ({ ...form, paid_date: e.target.value }))} style={inputStyle} />
                              </div>
                            </div>
                            <select value={billingForm.status || 'pending'} onChange={e => setBillingForm(form => ({ ...form, status: e.target.value }))} style={inputStyle}>
                              {Object.entries(BILLING_STATUS).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
                            </select>
                            <input placeholder="Notes" value={billingForm.notes || ''} onChange={e => setBillingForm(form => ({ ...form, notes: e.target.value }))} style={inputStyle} />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => saveBilling(bt.value)} style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                Save
                              </button>
                              <button onClick={() => { setEditingBilling(null); setBillingForm({}) }} style={{ background: 'none', border: '1px solid #D4AF37', color: '#888888', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingBilling(bt.value)
                            setBillingForm(milestone ? { amount: milestone.amount, due_date: milestone.due_date, paid_date: milestone.paid_date, status: milestone.status, notes: milestone.notes } : { status: 'pending' })
                          }}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#FFFFFF', border: '1px solid #D4AF37', cursor: 'pointer' }}
                        >
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{bt.label}</p>
                            {milestone?.amount && <p style={{ fontSize: 11, color: '#888888' }}>PHP {Number(milestone.amount).toLocaleString('en-PH')}</p>}
                            {milestone?.due_date && <p style={{ fontSize: 11, color: '#888888' }}>Due: {formatDate(milestone.due_date)}</p>}
                          </div>
                          {badge ? (
                            <span style={{ backgroundColor: badge.bg, color: badge.color, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{badge.label}</span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#CCCCCC' }}>Not set</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div id="comments" style={sectionStyle}>
            <p style={sectionTitle}>Comments</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                placeholder="Add a comment... (Enter to post)"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={postComment} disabled={postingComment || !commentText.trim()} style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !commentText.trim() ? 0.5 : 1 }}>
                Post
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {comments.length === 0 && <p style={{ fontSize: 12, color: '#CCCCCC', fontStyle: 'italic' }}>No comments yet.</p>}
              {comments.map(comment => (
                <div key={comment.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #D4AF37', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>{comment.author}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#CCCCCC' }}>{timeSince(comment.created_at)}</span>
                      {(role === 'admin' || comment.author === author) && (
                        <button onClick={() => removeComment(comment.id)} style={{ fontSize: 10, color: '#CCCCCC', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#2C2C2C' }}>{comment.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(project.status === 'for_handover' || project.status === 'handed_over') && (
        <div style={{ ...sectionStyle, backgroundColor: '#2C2C2C' }}>
          <p style={{ ...sectionTitle, color: '#D4AF37' }}>Handover documents</p>
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 12 }}>
            Generate and download the official handover certificates for this project.
          </p>
          <Link to={`/operations/${id}/handover`} style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '10px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            Open handover documents →
          </Link>
        </div>
      )}

      <div id="activity-log" style={{ ...sectionStyle, marginTop: 0 }}>
        <p style={sectionTitle}>Activity log</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 300, overflowY: 'auto' }}>
          {activity.length === 0 && <p style={{ fontSize: 12, color: '#CCCCCC', fontStyle: 'italic' }}>No activity yet.</p>}
          {activity.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: index < activity.length - 1 ? '1px solid #D4AF37' : 'none' }}>
              <div style={{ width: 8, height: 8, backgroundColor: '#D4AF37', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2C2C2C' }}>{item.action?.replace(/_/g, ' ')}</span>
                  {item.performed_by && <span style={{ fontSize: 11, color: '#D4AF37' }}>{item.performed_by}</span>}
                  <span style={{ fontSize: 11, color: '#CCCCCC', marginLeft: 'auto' }}>{timeSince(item.performed_at)}</span>
                </div>
                {item.details && <p style={{ fontSize: 12, color: '#666666' }}>{item.details}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
