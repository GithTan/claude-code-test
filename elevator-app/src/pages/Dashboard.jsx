import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useIsMobile from '../hooks/useIsMobile'
import {
  getMissingOwnershipFields,
  isEscalated,
  isNextActionOverdue,
  projectNeedsApprovals,
} from './operations/workflow'
import {
  getAllMaintenanceSchedules, getExpiringAmcContracts, getJobs,
  getOpenBreakdowns, getOverdueMaintenance, getUnpaidInvoices,
  getPipelines, PIPELINE_STEPS, getOpsProjects, getUnpaidMilestones, getAlerts,
  getActionItems, createActionItem, checkOffActionItem, getRecentlyConfirmedItems,
} from '../lib/api'
import { maskProjectName } from '../lib/trialMode'

const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function StatCard({ label, value, sublabel, highlight, to }) {
  const content = (
    <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
      <p className="text-3xl font-bold" style={{ color: highlight ? '#D4AF37' : '#2C2C2C' }}>{value}</p>
      <p className="text-sm font-medium mt-1" style={{ color: '#2C2C2C' }}>{label}</p>
      {sublabel && <p className="text-xs mt-1" style={{ color: '#2C2C2C' }}>{sublabel}</p>}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function jobStatusDot(status) {
  if (status === 'completed') return '#D4AF37'
  if (status === 'in_progress') return '#2C2C2C'
  return '#888888'
}

export default function Dashboard() {
  const { role, user } = useAuth()
  const isAdmin = role === 'admin'
  const isMobile = useIsMobile(900)

  const [overdue, setOverdue] = useState([])
  const [jobs, setJobs] = useState([])
  const [schedules, setSchedules] = useState([])
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [openBreakdowns, setOpenBreakdowns] = useState([])
  const [expiringContracts, setExpiringContracts] = useState([])
  const [pipelines, setPipelines] = useState([])
  const [showPipelines, setShowPipelines] = useState(false)
  const [opsProjects, setOpsProjects] = useState([])
  const [unpaidMilestones, setUnpaidMilestones] = useState([])
  const [alerts, setAlerts] = useState({ production: [], deletions: [], overdueUpdates: [], actionsDue: [], escalated: [], total: 0 })
  const [actionItems, setActionItems] = useState([])
  const [confirmedItems, setConfirmedItems] = useState([])
  const [newActionText, setNewActionText] = useState('')
  const [addingAction, setAddingAction] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [
      getOverdueMaintenance().then(({ data }) => setOverdue(data || [])),
      getJobs().then(({ data }) => setJobs(data || [])),
      getAllMaintenanceSchedules().then(({ data }) => setSchedules(data || [])),
      getOpenBreakdowns().then(({ data }) => setOpenBreakdowns(data || [])),
      getExpiringAmcContracts().then(({ data }) => setExpiringContracts(data || [])),
      getPipelines().then(({ data }) => setPipelines((data || []).filter(p => p.status !== 'completed'))),
      getOpsProjects().then(({ data }) => setOpsProjects((data || []).filter(p => p.status !== 'handed_over'))),
      getAlerts().then(a => setAlerts(a)),
      getActionItems().then(({ data }) => setActionItems(data || [])),
      getRecentlyConfirmedItems().then(({ data }) => setConfirmedItems(data || [])),
    ]
    if (isAdmin) {
      fetches.push(getUnpaidInvoices().then(({ data }) => setUnpaidInvoices(data || [])))
      fetches.push(getUnpaidMilestones().then(({ data }) => setUnpaidMilestones(data || [])))
    }
    Promise.all(fetches).then(() => setLoading(false))
  }, [isAdmin])

  async function handleAddAction(e) {
    e.preventDefault()
    if (!newActionText.trim()) return
    setAddingAction(true)
    const name = role === 'admin' ? 'Admin' : 'Staff'
    await createActionItem(newActionText.trim(), name)
    const { data } = await getActionItems()
    setActionItems(data || [])
    setNewActionText('')
    setAddingAction(false)
  }

  async function handleCheckOff(id) {
    const name = role === 'admin' ? 'Admin' : 'Staff'
    await checkOffActionItem(id, name)
    // Show "confirmed by" briefly before removing
    setActionItems(items => items.map(i => i.id === id ? { ...i, _confirmedBy: name } : i))
    setTimeout(() => {
      setActionItems(items => items.filter(i => i.id !== id))
      getRecentlyConfirmedItems().then(({ data }) => setConfirmedItems(data || []))
    }, 1800)
  }

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const today = new Date().toISOString().split('T')[0]
  const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const todayJobs = jobs.filter(j => j.scheduled_date === today && j.status !== 'completed')
  const inProgressToday = jobs.filter(j => j.status === 'in_progress').length
  const upcomingThisWeek = schedules.filter(s => s.next_due_date && s.next_due_date >= today && s.next_due_date <= oneWeek).length

  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const dueThisMonth = unpaidInvoices.filter(inv => inv.due_date && inv.due_date.slice(0, 7) === today.slice(0, 7)).length

  const todayDate = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const activeProjects = opsProjects.filter(p => p.status !== 'handed_over')
  const todayKey = new Date().toISOString().split('T')[0]
  const currentOwnerRole = isAdmin ? 'admin' : role || 'operations'
  const myQueue = activeProjects.filter(p => p.owner_role === currentOwnerRole)
  const myTasksToday = myQueue.filter(isNextActionOverdue)
  const waitingForMe = myQueue.filter(p => !isNextActionOverdue(p) && (projectNeedsApprovals(p) || getMissingOwnershipFields(p).length > 0))
  const missingApprovals = activeProjects.filter(projectNeedsApprovals)
  const movedThisWeek = activeProjects.filter(p => p.last_updated_at && (Date.now() - new Date(p.last_updated_at)) <= 7 * 86400000)
  const escalatedProjects = activeProjects.filter(isEscalated)
  const queueLabel = isAdmin ? 'Admin / owner' : currentOwnerRole === 'finance' ? 'Finance' : 'Operations / PIC / Engineer'

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'My tasks today', value: myTasksToday.length, tone: myTasksToday.length > 0 ? '#8B0000' : '#2C2C2C', sublabel: queueLabel, to: '/operations' },
          { label: 'Waiting for me', value: waitingForMe.length, tone: waitingForMe.length > 0 ? '#8B4500' : '#2C2C2C', sublabel: 'Missing approvals or owner setup', to: '/operations' },
          { label: 'Escalated projects', value: escalatedProjects.length, tone: escalatedProjects.length > 0 ? '#8B0000' : '#2C2C2C', sublabel: '3 days past due', to: '/operations' },
          { label: 'Projects moved this week', value: movedThisWeek.length, tone: '#2C2C2C', sublabel: user?.email || 'Live activity', to: '/operations' },
        ].map(card => (
          <Link key={card.label} to={card.to} style={{ textDecoration: 'none' }}>
            <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 18 }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: card.tone }}>{card.value}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginTop: 4 }}>{card.label}</p>
              <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>{card.sublabel}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's Schedule */}
      <div style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          <div>
            <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 16 }}>Today's Schedule</p>
            <p style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>{todayDate}</p>
          </div>
          <Link to="/jobs/new" style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '7px 14px', fontSize: 13, fontWeight: 600, textAlign: 'center', width: isMobile ? '100%' : 'auto' }}>
            + Log Visit
          </Link>
        </div>

        {todayJobs.length === 0 && openBreakdowns.length === 0 ? (
          <p style={{ color: '#888888', fontSize: 13 }}>No visits or breakdowns scheduled for today.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Open breakdowns first — highest priority */}
            {openBreakdowns.map(b => (
              <Link key={b.id} to={`/breakdowns/${b.id}/edit`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#3D3D3D', padding: '10px 14px', border: `1px solid ${b.priority === 'high' ? '#8B0000' : '#D4AF37'}`, textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: b.priority === 'high' ? '#8B0000' : '#D4AF37', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5DC' }}>
                      {b.elevators?.buildings?.customers?.name || '—'} — {b.elevators?.unit_number || '—'}
                    </p>
                    <p style={{ fontSize: 12, color: '#888888' }}>
                      Breakdown · {b.technician_name || 'Unassigned'} · {b.description?.slice(0, 50) || '—'}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: b.priority === 'high' ? '#FF6B6B' : '#D4AF37', whiteSpace: 'nowrap' }}>
                  {b.priority?.toUpperCase()} →
                </span>
              </Link>
            ))}

            {/* Today's scheduled service visits */}
            {todayJobs.map(j => (
              <Link key={j.id} to={`/jobs/${j.id}/edit`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#3D3D3D', padding: '10px 14px', border: '1px solid #4D4D4D', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#D4AF37'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#4D4D4D'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: jobStatusDot(j.status), flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5DC' }}>
                      {j.elevators?.buildings?.customers?.name || '—'} — {j.elevators?.unit_number || '—'}
                    </p>
                    <p style={{ fontSize: 12, color: '#888888' }}>
                      Service Visit · {j.technician_name || 'Unassigned'} · {j.maintenance_schedules?.visit_type || j.job_type || '—'}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>View →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Needs to be Addressed */}
      <div style={{ backgroundColor: '#F5F5DC', border: '2px solid #D4AF37', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <p style={{ color: '#2C2C2C', fontWeight: 700, fontSize: 15 }}>Needs to be Addressed</p>
          </div>
          {actionItems.length > 0 && (
            <span style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', fontWeight: 700, fontSize: 12, padding: '3px 9px' }}>
              {actionItems.length} open
            </span>
          )}
        </div>

        {actionItems.length === 0 && (
          <p style={{ color: '#888888', fontSize: 13, marginBottom: 12 }}>No open items. Add something below.</p>
        )}

        {actionItems.map(item => {
          const daysLeft = item.expires_at
            ? Math.ceil((new Date(item.expires_at) - Date.now()) / 86400000)
            : null
          const confirmed = !!item._confirmedBy
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #E8E0C8', opacity: confirmed ? 0.5 : 1, transition: 'opacity 0.3s' }}>
              <button onClick={() => !confirmed && handleCheckOff(item.id)}
                style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1, cursor: confirmed ? 'default' : 'pointer', backgroundColor: confirmed ? '#D4AF37' : '#FFFFFF', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Mark as addressed">
                <span style={{ fontSize: 12, color: confirmed ? '#2C2C2C' : '#D4AF37', fontWeight: 700 }}>✓</span>
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 500, textDecoration: confirmed ? 'line-through' : 'none' }}>{item.text}</p>
                <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
                  {confirmed
                    ? <span style={{ color: '#D4AF37', fontWeight: 600 }}>Confirmed by {item._confirmedBy}</span>
                    : <>
                        Added by {item.created_by_name || 'Staff'}
                        {daysLeft !== null && (
                          <span style={{ color: daysLeft <= 1 ? '#8B0000' : '#888888', marginLeft: 8, fontWeight: daysLeft <= 1 ? 700 : 400 }}>
                            · {daysLeft <= 0 ? 'Expiring now' : `${daysLeft}d left`}
                          </span>
                        )}
                      </>
                  }
                </p>
              </div>
            </div>
          )
        })}

        {/* Add new item */}
        <form onSubmit={handleAddAction} style={{ display: 'flex', gap: 8, marginTop: 14, flexDirection: isMobile ? 'column' : 'row' }}>
          <input
            value={newActionText}
            onChange={e => setNewActionText(e.target.value)}
            placeholder="Type something that needs to be addressed…"
            style={{ flex: 1, border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 12px', fontSize: 13, outline: 'none' }}
          />
          <button type="submit" disabled={addingAction || !newActionText.trim()}
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: (!newActionText.trim() || addingAction) ? 0.5 : 1 }}>
            Add
          </button>
        </form>

        {/* Recently confirmed */}
        {confirmedItems.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid #D4AF37', paddingTop: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recently Confirmed</p>
            {confirmedItems.map(item => {
              const when = item.checked_at
                ? new Date(item.checked_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : ''
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: '1px solid #E8E0C8' }}>
                  <span style={{ fontSize: 13, color: '#D4AF37', marginTop: 1 }}>✓</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: '#888888', textDecoration: 'line-through' }}>{item.text}</p>
                    <p style={{ fontSize: 11, color: '#AAAAAA', marginTop: 1 }}>
                      Confirmed by {item.checked_by_name || 'Staff'} · {when}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Pipeline Overview */}
        <button onClick={() => setShowPipelines(v => !v)}
          style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', textAlign: 'left', padding: 24 }}>
          <p className="text-3xl font-bold" style={{ color: '#F5F5DC' }}>{pipelines.length}</p>
          <p className="text-sm font-medium mt-1" style={{ color: '#F5F5DC' }}>Pipeline Overview</p>
          <p className="text-xs mt-1">
            <span style={{ color: '#D4AF37' }}>{showPipelines ? 'Hide projects ↑' : 'View all projects →'}</span>
          </p>
        </button>

        <StatCard label="Overdue Maintenance" value={overdue.length}
          sublabel={overdue.length > 0 ? 'Needs attention' : 'All up to date'} to="/reports" />
        <StatCard label="Upcoming This Week" value={upcomingThisWeek}
          sublabel="Scheduled visits" to="/jobs" />
        <StatCard label="Jobs In Progress" value={inProgressToday}
          sublabel="Currently active" to="/jobs" />
        <StatCard label="Open Breakdowns" value={openBreakdowns.length}
          sublabel={openBreakdowns.length > 0 ? 'Needs response' : 'None open'} to="/breakdowns" />
        <StatCard label="Contracts Expiring" value={expiringContracts.length}
          sublabel="Within 60 days" to="/contracts" />
        {isAdmin && (
          <StatCard label="Unpaid Invoices" value={fmt(unpaidTotal)} highlight={unpaidTotal > 0}
            sublabel={`${unpaidInvoices.length} invoice${unpaidInvoices.length !== 1 ? 's' : ''}`}
            to="/invoices" />
        )}
      </div>

      {/* Pipeline Overview Panel */}
      {showPipelines && (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#2C2C2C' }}>Active Projects</p>
            <Link to="/pipeline" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600, width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'left', border: isMobile ? '1px solid #D4AF37' : 'none', padding: isMobile ? '8px 12px' : 0 }}>Manage in Pipeline →</Link>
          </div>
          {pipelines.length === 0 ? (
            <p style={{ color: '#888888', fontSize: 13 }}>No active projects.</p>
          ) : (
            <div>
              {pipelines.map(p => {
                const currentStep = p.pipeline_steps?.find(s => s.step_number === p.current_step)
                const days = currentStep?.unlocked_at
                  ? Math.floor((Date.now() - new Date(currentStep.unlocked_at)) / 86400000)
                  : 0
                const dotColor = days >= 7 ? '#8B0000' : days >= 3 ? '#D4AF37' : '#2C2C2C'

                return (
                  <Link key={p.id} to={`/pipeline/${p.id}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>
                          {maskProjectName(p.installation_projects?.project_name, 'Project')}
                        </p>
                        <p style={{ fontSize: 12, color: '#888888', textTransform: 'capitalize' }}>
                          {[p.elevator_type?.replace(/_/g, ' '), p.unit_count > 1 ? `${p.unit_count} units` : null].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C' }}>Step {p.current_step} of {PIPELINE_STEPS.length}</p>
                      <p style={{ fontSize: 12, color: '#888888' }}>{STEP_LABELS[p.current_step] || 'Complete'}</p>
                      {days >= 3 && (
                        <p style={{ fontSize: 12, fontWeight: 700, color: dotColor }}>{days}d waiting</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {isAdmin && dueThisMonth > 0 && (
        <div style={{ padding: 16, marginBottom: 16, backgroundColor: '#F5F5DC', border: '1px solid #D4AF37' }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: '#2C2C2C' }}>
            {dueThisMonth} invoice{dueThisMonth !== 1 ? 's' : ''} due this month —{' '}
            <Link to="/finance" style={{ color: '#D4AF37' }}>Review in Finance →</Link>
          </p>
        </div>
      )}

      {overdue.length > 0 && (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#2C2C2C', marginBottom: 12 }}>Overdue Maintenance</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {overdue.slice(0, 5).map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #E8E0C8' }}>
                  <td style={{ padding: '8px 0', fontSize: 13, color: '#2C2C2C' }}>{s.elevators?.buildings?.customers?.name}</td>
                  <td style={{ padding: '8px 0', fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{s.elevators?.unit_number}</td>
                  <td style={{ padding: '8px 0', fontSize: 13, fontWeight: 700, color: '#8B0000', textAlign: 'right' }}>{s.next_due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/reports" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600, marginTop: 8, display: 'block' }}>
            View all overdue →
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>My tasks today</p>
            <span style={{ fontSize: 11, color: '#888888' }}>{queueLabel}</span>
          </div>
          {myTasksToday.length === 0 ? (
            <p style={{ fontSize: 13, color: '#888888' }}>Nothing due in your queue right now.</p>
          ) : (
            myTasksToday.slice(0, 5).map(p => (
              <Link key={p.id} to={`/operations/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{maskProjectName(p.project_name)}</p>
                  <p style={{ fontSize: 11, color: '#8B4500' }}>{p.next_action || 'Next action needed'}</p>
                </div>
                <span style={{ fontSize: 11, color: '#8B0000', whiteSpace: 'nowrap' }}>
                  {p.next_action_date === todayKey ? 'Due today' : `${Math.max(1, Math.floor((Date.now() - new Date(p.next_action_date)) / 86400000))}d late`}
                </span>
              </Link>
            ))
          )}
        </div>

        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waiting for me</p>
            <Link to="/operations" style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>Open queue →</Link>
          </div>
          {waitingForMe.length === 0 ? (
            <p style={{ fontSize: 13, color: '#888888' }}>No blocked items in your queue right now.</p>
          ) : (
            waitingForMe.slice(0, 5).map(p => (
              <Link key={p.id} to={`/operations/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{maskProjectName(p.project_name)}</p>
                  <p style={{ fontSize: 11, color: '#8B4500' }}>
                    {projectNeedsApprovals(p)
                      ? 'Required approvals still missing'
                      : `Complete ${getMissingOwnershipFields(p).join(', ')}`}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: '#888888', whiteSpace: 'nowrap' }}>{p.assigned_to || 'Unassigned'}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing approvals</p>
            <span style={{ fontSize: 11, color: '#888888' }}>{missingApprovals.length} project{missingApprovals.length !== 1 ? 's' : ''}</span>
          </div>
          {missingApprovals.length === 0 ? (
            <p style={{ fontSize: 13, color: '#888888' }}>Approval-ready projects are complete for now.</p>
          ) : (
            missingApprovals.slice(0, 5).map(p => (
              <Link key={p.id} to={`/operations/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{maskProjectName(p.project_name)}</p>
                  <p style={{ fontSize: 11, color: '#8B4500' }}>
                    {p.next_action || 'Approval items needed'} · {p.assigned_to || role || 'Operations'}
                  </p>
                </div>
                <span style={{ fontSize: 11, color: '#888888', whiteSpace: 'nowrap' }}>{p.status?.replace(/_/g, ' ')}</span>
              </Link>
            ))
          )}
        </div>

        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects moved this week</p>
            <span style={{ fontSize: 11, color: '#888888' }}>Recent motion</span>
          </div>
          {movedThisWeek.length === 0 ? (
            <p style={{ fontSize: 13, color: '#888888' }}>No project updates recorded this week yet.</p>
          ) : (
            movedThisWeek
              .sort((a, b) => new Date(b.last_updated_at) - new Date(a.last_updated_at))
              .slice(0, 5)
              .map(p => (
                <Link key={p.id} to={`/operations/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{maskProjectName(p.project_name)}</p>
                    <p style={{ fontSize: 11, color: '#888888' }}>{p.next_action || 'Status updated'}{p.last_updated_by ? ` · ${p.last_updated_by}` : ''}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#2C2C2C', whiteSpace: 'nowrap' }}>
                    {Math.max(0, Math.floor((Date.now() - new Date(p.last_updated_at)) / 86400000))}d ago
                  </span>
                </Link>
              ))
          )}
        </div>
      </div>

      {/* ── Role-based Project Status Summary ── */}
      {(() => {
        const active = opsProjects.filter(p => p.status !== 'handed_over')
        const needsAction = active.filter(p => p.next_action_date && p.next_action_date <= today)
        const noUpdate = active.filter(p => p.last_updated_at && (Date.now() - new Date(p.last_updated_at)) > 7 * 86400000)
        const inProd = active.filter(p => p.status === 'on_going_production')
        const blocked = active.filter(p => p.health === 'blocked' || p.health === 'overdue')
        return (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project Status Overview</p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Active Projects', value: active.length, to: '/operations', color: '#2C2C2C' },
                { label: 'Actions Due', value: needsAction.length, to: '/operations', color: needsAction.length > 0 ? '#8B4500' : '#2C2C2C' },
                { label: 'No Update 7d+', value: noUpdate.length, to: '/operations', color: noUpdate.length > 0 ? '#8B0000' : '#2C2C2C' },
                { label: 'Escalated 3d+', value: alerts.escalated.length, to: '/operations', color: alerts.escalated.length > 0 ? '#8B0000' : '#2C2C2C' },
              ].map(s => (
                <Link key={s.label} to={s.to} style={{ textDecoration: 'none' }}>
                  <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: '14px 16px', textAlign: 'center' }}>
                    <p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>{s.label}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Actions due list */}
            {needsAction.length > 0 && (
              <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16, marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#8B4500', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions Due Today</p>
                {needsAction.slice(0, 5).map(p => (
                  <Link key={p.id} to={`/operations/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{maskProjectName(p.project_name)}</p>
                      <p style={{ fontSize: 12, color: '#8B4500' }}>→ {p.next_action}</p>
                    </div>
                    {p.assigned_to && <span style={{ fontSize: 11, color: '#888888' }}>{p.assigned_to}</span>}
                  </Link>
                ))}
                {needsAction.length > 5 && <Link to="/operations" style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>+{needsAction.length - 5} more →</Link>}
              </div>
            )}

            {isAdmin && alerts.escalated.length > 0 && (
              <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16, marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#8B0000', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Escalated after 3 days
                </p>
                {alerts.escalated.slice(0, 5).map(p => (
                  <Link key={p.id} to={`/operations/${p.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{maskProjectName(p.project_name)}</p>
                      <p style={{ fontSize: 11, color: '#8B0000' }}>→ {p.next_action || 'No next action'}{p.assigned_to ? ` · ${p.assigned_to}` : ''}</p>
                    </div>
                    <span style={{ fontSize: 11, color: '#888888' }}>{p.owner_role || 'operations'}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Finance: unpaid milestones */}
            {isAdmin && unpaidMilestones.length > 0 && (
              <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#8B0000', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Overdue Billing Milestones ({unpaidMilestones.length})
                </p>
                {unpaidMilestones.slice(0, 4).map(m => (
                  <Link key={m.id} to={`/operations/${m.ops_project_id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{maskProjectName(m.ops_projects?.project_name)}</p>
                      <p style={{ fontSize: 11, color: '#888888' }}>{m.milestone_type?.replace(/_/g, ' ')}</p>
                    </div>
                    {m.amount && <span style={{ fontSize: 13, fontWeight: 700, color: '#8B0000' }}>₱{Number(m.amount).toLocaleString('en-PH')}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
