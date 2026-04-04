import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getAllMaintenanceSchedules, getExpiringAmcContracts, getJobs,
  getOpenBreakdowns, getOverdueMaintenance, getUnpaidInvoices,
  getPipelines, PIPELINE_STEPS,
} from '../lib/api'

const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function StatCard({ label, value, sublabel, color, to }) {
  const content = (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [
      getOverdueMaintenance().then(({ data }) => setOverdue(data || [])),
      getJobs().then(({ data }) => setJobs(data || [])),
      getAllMaintenanceSchedules().then(({ data }) => setSchedules(data || [])),
      getOpenBreakdowns().then(({ data }) => setOpenBreakdowns(data || [])),
      getExpiringAmcContracts().then(({ data }) => setExpiringContracts(data || [])),
      getPipelines().then(({ data }) => setPipelines((data || []).filter(p => p.status !== 'completed'))),
    ]
    if (isAdmin) {
      fetches.push(getUnpaidInvoices().then(({ data }) => setUnpaidInvoices(data || [])))
    }
    Promise.all(fetches).then(() => setLoading(false))
  }, [isAdmin])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const today = new Date().toISOString().split('T')[0]
  const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const inProgressToday = jobs.filter(j => j.status === 'in_progress').length
  const upcomingThisWeek = schedules.filter(s => s.next_due_date && s.next_due_date >= today && s.next_due_date <= oneWeek).length

  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const dueThisMonth = unpaidInvoices.filter(inv => inv.due_date && inv.due_date.slice(0, 7) === today.slice(0, 7)).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-4 lg:grid-cols-3">
        {/* Pipeline Overview — clickable, expands inline */}
        <button onClick={() => setShowPipelines(v => !v)}
          className="text-left bg-white rounded-lg shadow p-6 border-l-4 border-blue-700 hover:shadow-md transition-shadow">
          <p className="text-3xl font-bold text-gray-800">{pipelines.length}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Pipeline Overview</p>
          <p className="text-xs text-blue-600 mt-1">{showPipelines ? 'Hide projects ▲' : 'View all projects ▼'}</p>
        </button>

        <StatCard
          label="Overdue Maintenance"
          value={overdue.length}
          color="border-red-500"
          sublabel={overdue.length > 0 ? 'Needs attention' : 'All up to date'}
          to="/maintenance"
        />
        <StatCard
          label="Upcoming This Week"
          value={upcomingThisWeek}
          color="border-blue-500"
          sublabel="Scheduled visits"
          to="/maintenance"
        />
        <StatCard
          label="Jobs In Progress"
          value={inProgressToday}
          color="border-yellow-500"
          sublabel="Currently active"
          to="/jobs"
        />
        <StatCard
          label="Open Breakdowns"
          value={openBreakdowns.length}
          color="border-red-600"
          sublabel={openBreakdowns.length > 0 ? 'Needs response' : 'None open'}
          to="/breakdowns"
        />
        <StatCard
          label="Contracts Expiring"
          value={expiringContracts.length}
          color="border-orange-400"
          sublabel="Within 60 days"
          to="/contracts"
        />
        {isAdmin && (
          <StatCard
            label="Unpaid Invoices"
            value={fmt(unpaidTotal)}
            color="border-orange-500"
            sublabel={`${unpaidInvoices.length} invoice${unpaidInvoices.length !== 1 ? 's' : ''}`}
            to="/invoices"
          />
        )}
      </div>

      {/* Pipeline Overview Panel */}
      {showPipelines && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-gray-800">Active Projects</h2>
            <Link to="/pipeline" className="text-xs text-blue-600 hover:underline">Manage in Pipeline →</Link>
          </div>
          {pipelines.length === 0 ? (
            <p className="text-sm text-gray-400">No active projects.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {pipelines.map(p => {
                const currentStep = p.pipeline_steps?.find(s => s.step_number === p.current_step)
                const days = currentStep?.unlocked_at
                  ? Math.floor((Date.now() - new Date(currentStep.unlocked_at)) / 86400000)
                  : 0
                const isOverdue = days >= 7
                const isWaiting = days >= 3

                return (
                  <Link key={p.id} to={`/pipeline/${p.id}`}
                    className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 -mx-2 rounded transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {p.installation_projects?.project_name || '—'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">
                        {[
                          p.elevator_type?.replace(/_/g, ' '),
                          p.unit_count > 1 ? `${p.unit_count} units` : null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-gray-700">
                        Step {p.current_step} of {PIPELINE_STEPS.length}
                      </p>
                      <p className="text-xs text-gray-500">{STEP_LABELS[p.current_step] || 'Complete'}</p>
                      {days >= 3 && (
                        <p className={`text-xs font-semibold mt-0.5 ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>
                          {days}d waiting
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                        isOverdue ? 'bg-red-500' : isWaiting ? 'bg-yellow-400' : 'bg-green-400'
                      }`} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {isAdmin && dueThisMonth > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-800 font-medium text-sm">
            {dueThisMonth} invoice{dueThisMonth !== 1 ? 's' : ''} due this month
          </p>
        </div>
      )}

      {openBreakdowns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-red-600 mb-3">Breakdown Calls</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {openBreakdowns.slice(0, 5).map(b => (
                <tr key={b.id} className="text-sm">
                  <td className="py-2 text-gray-900">{b.reported_date}</td>
                  <td className="py-2 text-gray-600">{b.elevators?.buildings?.customers?.name}</td>
                  <td className="py-2 font-medium text-gray-900">{b.elevators?.unit_number}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.priority === 'high' ? 'bg-red-100 text-red-800' : b.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                      {b.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/breakdowns" className="text-blue-600 hover:underline text-sm mt-2 block">
            View all breakdowns →
          </Link>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-red-600 mb-3">Overdue Maintenance</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overdue.slice(0, 5).map(s => (
                <tr key={s.id} className="text-sm">
                  <td className="py-2 text-gray-900">{s.elevators?.buildings?.customers?.name}</td>
                  <td className="py-2 font-medium text-gray-900">{s.elevators?.unit_number}</td>
                  <td className="py-2 text-red-600 font-medium">{s.next_due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/maintenance" className="text-blue-600 hover:underline text-sm mt-2 block">
            View all overdue →
          </Link>
        </div>
      )}
    </div>
  )
}
