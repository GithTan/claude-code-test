import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  getOpsProject, updateOpsProject,
  getProjectActivity, logProjectActivity,
  getProjectComments, addProjectComment, deleteProjectComment,
  getBillingMilestones, upsertBillingMilestone,
} from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { OPS_STATUSES, statusDef } from './OperationsList'

const HEALTH = {
  on_track:        { label: 'On Track',        bg: '#2C2C2C', color: '#D4AF37' },
  needs_attention: { label: 'Needs Attention', bg: '#5C4A00', color: '#F5D87A' },
  blocked:         { label: 'Blocked',          bg: '#8B4500', color: '#FFD0A0' },
  overdue:         { label: 'Overdue',          bg: '#8B0000', color: '#FFAAAA' },
}

const BILLING_TYPES = [
  { value: 'downpayment',      label: 'Downpayment' },
  { value: 'pre_shipment',     label: 'Pre-Shipment' },
  { value: 'delivery',         label: 'Delivery' },
  { value: 'installation',     label: 'Installation' },
  { value: 'final_collection', label: 'Final Collection' },
]

const BILLING_STATUS = {
  pending:  { label: 'Pending',  bg: '#E8E0C8', color: '#2C2C2C' },
  invoiced: { label: 'Invoiced', bg: '#5C4A00', color: '#F5D87A' },
  paid:     { label: 'Paid',     bg: '#2C2C2C', color: '#D4AF37' },
  overdue:  { label: 'Overdue',  bg: '#8B0000', color: '#FFAAAA' },
}

const sectionStyle = { backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 20, marginBottom: 16 }
const sectionTitle = { fontSize: 12, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }
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
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OpsProjectDetail() {
  const { id } = useParams()
  const { user, role } = useAuth()
  const navigate = useNavigate()
  const author = user?.email || 'staff'

  const [project, setProject] = useState(null)
  const [activity, setActivity] = useState([])
  const [comments, setComments] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  // Next action edit
  const [editingNextAction, setEditingNextAction] = useState(false)
  const [nextAction, setNextAction] = useState('')
  const [nextActionDate, setNextActionDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  // Status/health edit
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newHealth, setNewHealth] = useState('on_track')

  // Comments
  const [commentText, setCommentText] = useState('')
  const [postingComment, setPostingComment] = useState(false)

  // Billing
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
      setNewStatus(p.status || 'awaiting_shaft_readiness')
      setNewHealth(p.health || 'on_track')
    }
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [id])

  async function saveNextAction() {
    await updateOpsProject(id, {
      next_action: nextAction,
      next_action_date: nextActionDate || null,
      assigned_to: assignedTo,
      last_updated_at: new Date().toISOString(),
    })
    await logProjectActivity(id, 'next_action_updated', `Next action: ${nextAction}${assignedTo ? ` (assigned to ${assignedTo})` : ''}`, author)
    setEditingNextAction(false)
    await load()
  }

  async function saveStatus() {
    const prev = project.status
    await updateOpsProject(id, {
      status: newStatus,
      health: newHealth,
      last_updated_at: new Date().toISOString(),
    })
    await logProjectActivity(id, 'status_updated', `Status changed from ${prev} to ${newStatus} · Health: ${newHealth}`, author)
    setEditingStatus(false)
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

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>
  if (!project) return <p style={{ color: '#8B0000' }}>Project not found.</p>

  const status = statusDef(project.status)
  const health = HEALTH[project.health] || HEALTH.on_track

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Header */}
      <Link to="/operations" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Project Status</Link>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', margin: '12px 0 20px' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2C2C2C', marginBottom: 6 }}>{project.project_name}</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ backgroundColor: status.bg, color: status.color, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{status.label}</span>
            <span style={{ backgroundColor: health.bg, color: health.color, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{health.label}</span>
            {project.pic && <span style={{ fontSize: 12, color: '#888888' }}>PIC: <strong>{project.pic}</strong></span>}
            {project.assigned_to && <span style={{ fontSize: 12, color: '#888888' }}>Assigned: <strong>{project.assigned_to}</strong></span>}
          </div>
        </div>
        <Link to={`/operations/${id}/edit`}
          style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          Edit Project
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* LEFT COLUMN */}
        <div>

          {/* Next Action */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Next Action</p>
            {!editingNextAction ? (
              <div>
                {project.next_action ? (
                  <>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }}>{project.next_action}</p>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#888888' }}>
                      {project.next_action_date && <span>Due: <strong style={{ color: '#8B4500' }}>{formatDate(project.next_action_date)}</strong></span>}
                      {project.assigned_to && <span>→ {project.assigned_to}</span>}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: '#CCCCCC', fontStyle: 'italic' }}>No next action set</p>
                )}
                <button onClick={() => setEditingNextAction(true)}
                  style={{ marginTop: 10, fontSize: 12, color: '#D4AF37', background: 'none', border: '1px solid #D4AF37', padding: '4px 10px', cursor: 'pointer' }}>
                  {project.next_action ? 'Update' : 'Set Next Action'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={nextAction} onChange={e => setNextAction(e.target.value)}
                  placeholder="What needs to happen next?" style={inputStyle} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input type="date" value={nextActionDate} onChange={e => setNextActionDate(e.target.value)} style={inputStyle} />
                  <input value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                    placeholder="Assigned to (name/dept)" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveNextAction}
                    style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setEditingNextAction(false)}
                    style={{ background: 'none', border: '1px solid #CCCCCC', color: '#888888', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status + Health */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Status & Health</p>
            {!editingStatus ? (
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <span style={{ backgroundColor: status.bg, color: status.color, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{status.label}</span>
                  <span style={{ backgroundColor: health.bg, color: health.color, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{health.label}</span>
                </div>
                <button onClick={() => setEditingStatus(true)}
                  style={{ fontSize: 12, color: '#D4AF37', background: 'none', border: '1px solid #D4AF37', padding: '4px 10px', cursor: 'pointer' }}>
                  Update Status
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={inputStyle}>
                  {OPS_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={newHealth} onChange={e => setNewHealth(e.target.value)} style={inputStyle}>
                  {Object.entries(HEALTH).map(([v, h]) => <option key={v} value={v}>{h.label}</option>)}
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={saveStatus}
                    style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setEditingStatus(false)}
                    style={{ background: 'none', border: '1px solid #CCCCCC', color: '#888888', padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Project Info</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              {project.address && <div><span style={{ color: '#888888' }}>Address: </span>{project.address}</div>}
              {project.specs && <div><span style={{ color: '#888888' }}>Specs: </span>{project.specs}</div>}
              {project.unit_label && <div><span style={{ color: '#888888' }}>Unit: </span>{project.unit_label}</div>}
              {project.s_o_f && <div><span style={{ color: '#888888' }}>S/O/F: </span>{project.s_o_f}</div>}
              {project.subcon && <div><span style={{ color: '#888888' }}>Subcon: </span>{project.subcon}</div>}
              {project.contact_person && <div><span style={{ color: '#888888' }}>Contact: </span>{project.contact_person} {project.contact_number && `· ${project.contact_number}`}</div>}
              {project.concerns && (
                <div style={{ marginTop: 6, backgroundColor: '#FFFBF0', border: '1px solid #E8E0C8', padding: 10 }}>
                  <p style={{ fontSize: 11, color: '#888888', marginBottom: 4 }}>CONCERNS / NOTES</p>
                  <p style={{ fontSize: 13, color: '#2C2C2C' }}>{project.concerns}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>

          {/* Billing Milestones — admin only */}
          {role === 'admin' && <div style={sectionStyle}>
            <p style={sectionTitle}>Billing Milestones</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {BILLING_TYPES.map(bt => {
                const m = milestones.find(x => x.milestone_type === bt.value)
                const bs = m ? (BILLING_STATUS[m.status] || BILLING_STATUS.pending) : null
                return (
                  <div key={bt.value}>
                    {editingBilling === bt.value ? (
                      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D4AF37', padding: 12 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', marginBottom: 8 }}>{bt.label}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <input placeholder="Amount (₱)" type="number" value={billingForm.amount || ''}
                            onChange={e => setBillingForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <div>
                              <p style={{ fontSize: 11, color: '#888888', marginBottom: 2 }}>Due Date</p>
                              <input type="date" value={billingForm.due_date || ''}
                                onChange={e => setBillingForm(f => ({ ...f, due_date: e.target.value }))} style={inputStyle} />
                            </div>
                            <div>
                              <p style={{ fontSize: 11, color: '#888888', marginBottom: 2 }}>Paid Date</p>
                              <input type="date" value={billingForm.paid_date || ''}
                                onChange={e => setBillingForm(f => ({ ...f, paid_date: e.target.value }))} style={inputStyle} />
                            </div>
                          </div>
                          <select value={billingForm.status || 'pending'}
                            onChange={e => setBillingForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                            {Object.entries(BILLING_STATUS).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                          </select>
                          <input placeholder="Notes" value={billingForm.notes || ''}
                            onChange={e => setBillingForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => saveBilling(bt.value)}
                              style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Save
                            </button>
                            <button onClick={() => { setEditingBilling(null); setBillingForm({}) }}
                              style={{ background: 'none', border: '1px solid #CCCCCC', color: '#888888', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setEditingBilling(bt.value); setBillingForm(m ? { amount: m.amount, due_date: m.due_date, paid_date: m.paid_date, status: m.status, notes: m.notes } : { status: 'pending' }) }}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#D4AF37'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#E8E0C8'}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{bt.label}</p>
                          {m?.amount && <p style={{ fontSize: 11, color: '#888888' }}>₱{Number(m.amount).toLocaleString('en-PH')}</p>}
                          {m?.due_date && <p style={{ fontSize: 11, color: '#888888' }}>Due: {formatDate(m.due_date)}</p>}
                        </div>
                        {bs ? (
                          <span style={{ backgroundColor: bs.bg, color: bs.color, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{bs.label}</span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#CCCCCC' }}>Not set</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>}

          {/* Comments */}
          <div style={sectionStyle}>
            <p style={sectionTitle}>Comments</p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()}
                placeholder="Add a comment… (Enter to post)"
                style={{ ...inputStyle, flex: 1 }} />
              <button onClick={postComment} disabled={postingComment || !commentText.trim()}
                style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !commentText.trim() ? 0.5 : 1 }}>
                Post
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {comments.length === 0 && <p style={{ fontSize: 12, color: '#CCCCCC', fontStyle: 'italic' }}>No comments yet.</p>}
              {comments.map(c => (
                <div key={c.id} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37' }}>{c.author}</span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: '#CCCCCC' }}>{timeSince(c.created_at)}</span>
                      {(role === 'admin' || c.author === author) && (
                        <button onClick={() => removeComment(c.id)}
                          style={{ fontSize: 10, color: '#CCCCCC', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: '#2C2C2C' }}>{c.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log - full width */}
      <div style={{ ...sectionStyle, marginTop: 0 }}>
        <p style={sectionTitle}>Activity Log</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 300, overflowY: 'auto' }}>
          {activity.length === 0 && <p style={{ fontSize: 12, color: '#CCCCCC', fontStyle: 'italic' }}>No activity yet.</p>}
          {activity.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < activity.length - 1 ? '1px solid #E8E0C8' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D4AF37', marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#2C2C2C' }}>{a.action?.replace(/_/g, ' ')}</span>
                  {a.performed_by && <span style={{ fontSize: 11, color: '#D4AF37' }}>{a.performed_by}</span>}
                  <span style={{ fontSize: 11, color: '#CCCCCC', marginLeft: 'auto' }}>{timeSince(a.performed_at)}</span>
                </div>
                {a.details && <p style={{ fontSize: 12, color: '#666666' }}>{a.details}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
