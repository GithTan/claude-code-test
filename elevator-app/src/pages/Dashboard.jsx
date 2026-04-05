import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getAllMaintenanceSchedules, getExpiringAmcContracts, getJobs,
  getOpenBreakdowns, getOverdueMaintenance, getUnpaidInvoices,
  getPipelines, PIPELINE_STEPS, getOpsProjects, getUnpaidMilestones, getAlerts,
} from '../lib/api'

const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function StatCard({ label, value, sublabel, highlight, to }) {
  const content = (
    <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37' }}
      className="shadow-sm p-6 hover:shadow-md transition-shadow">
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
  const { role } = useAuth()
  const isAdmin = role === 'admin'

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
  const [alerts, setAlerts] = useState({ production: [], deletions: [], overdueUpdates: [], actionsDue: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [
      getOverdueMaintenance().then(({ data }) => setOverdue(data || [])),
      getJobs().then(({ data }) => setJobs(data || [])),
      getAllMaintenanceSchedules().then(({ data }) => setSchedules(data || [])),
      getOpenBreakdowns().then(({ data }) => setOpenBreakdowns(data || [])),
      getExpiringAmcContracts().then(({ data }) => setExpiringContracts(data || [])),
      getPipelines().then(({ data }) => setPipelines((data || []).filter(p => p.status !== 'completed'))),
      getOpsProjects().then(({ data }) => setOpsProjects(data || [])),
      getAlerts().then(a => setAlerts(a)),
    ]
    if (isAdmin) {
      fetches.push(getUnpaidInvoices().then(({ data }) => setUnpaidInvoices(data || [])))
      fetches.push(getUnpaidMilestones().then(({ data }) => setUnpaidMilestones(data || [])))
    }
    Promise.all(fetches).then(() => setLoading(false))
  }, [isAdmin])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const today = new Date().toISOString().split('T')[0]
  const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const todayJobs = jobs.filter(j => j.scheduled_date === today && j.status !== 'completed')
  const inProgressToday = jobs.filter(j => j.status === 'in_progress').length
  const upcomingThisWeek = schedules.filter(s => s.next_due_date && s.next_due_date >= today && s.next_due_date <= oneWeek).length

  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const dueThisMonth = unpaidInvoices.filter(inv => inv.due_date && inv.due_date.slice(0, 7) === today.slice(0, 7)).length

  const todayDate = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      {/* Today's Schedule */}
      <div style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 24, marginBottom: 24 }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 16 }}>Today's Schedule</p>
            <p style={{ color: '#888888', fontSize: 12, marginTop: 2 }}>{todayDate}</p>
          </div>
          <Link to="/jobs/new" style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '7px 14px', fontSize: 13, fontWeight: 600 }}>
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-3">
        {/* Pipeline Overview */}
        <button onClick={() => setShowPipelines(v => !v)}
          className="text-left shadow-sm p-6 hover:shadow-md transition-shadow"
          style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37' }}>
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
          <div className="flex justify-between items-center mb-4">
            <p style={{ fontWeight: 700, fontSize: 15, color: '#2C2C2C' }}>Active Projects</p>
            <Link to="/pipeline" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>Manage in Pipeline →</Link>
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
                const dotColor = days >= 7 ? '#8B0000' : days >= 3 ? '#D4AF37' : '#4CAF50'

                return (
                  <Link key={p.id} to={`/pipeline/${p.id}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #E8E0C8', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>
                          {p.installation_projects?.project_name || '—'}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Active Projects', value: active.length, to: '/operations', color: '#2C2C2C' },
                { label: 'Actions Due', value: needsAction.length, to: '/operations', color: needsAction.length > 0 ? '#8B4500' : '#2C2C2C' },
                { label: 'No Update 7d+', value: noUpdate.length, to: '/operations', color: noUpdate.length > 0 ? '#8B0000' : '#2C2C2C' },
                { label: 'Blocked / Overdue', value: blocked.length, to: '/operations', color: blocked.length > 0 ? '#8B0000' : '#2C2C2C' },
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
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{p.project_name}</p>
                      <p style={{ fontSize: 12, color: '#8B4500' }}>→ {p.next_action}</p>
                    </div>
                    {p.assigned_to && <span style={{ fontSize: 11, color: '#888888' }}>{p.assigned_to}</span>}
                  </Link>
                ))}
                {needsAction.length > 5 && <Link to="/operations" style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>+{needsAction.length - 5} more →</Link>}
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
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{m.ops_projects?.project_name}</p>
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
