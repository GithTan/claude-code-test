import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAllMaintenanceSchedules, getJobs, getOverdueMaintenance, getUnpaidInvoices } from '../lib/api'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [
      getOverdueMaintenance().then(({ data }) => setOverdue(data || [])),
      getJobs().then(({ data }) => setJobs(data || [])),
      getAllMaintenanceSchedules().then(({ data }) => setSchedules(data || [])),
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

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
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

      {isAdmin && dueThisMonth > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-800 font-medium text-sm">
            {dueThisMonth} invoice{dueThisMonth !== 1 ? 's' : ''} due this month
          </p>
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
          {overdue.length > 5 && (
            <Link to="/maintenance" className="text-blue-600 hover:underline text-sm mt-2 block">
              View all {overdue.length} overdue →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
