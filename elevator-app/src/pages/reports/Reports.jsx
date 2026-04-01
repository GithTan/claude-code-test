import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getElevatorStatusOverview, getJobsThisMonth, getMonthlyRevenue,
  getOverdueMaintenance, getPaymentHistory, getTechnicianSummary, getUnpaidInvoices,
} from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function EmptyState() {
  return <p className="text-gray-500 text-sm">No data.</p>
}

export default function Reports() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [overdue, setOverdue] = useState([])
  const [jobsMonth, setJobsMonth] = useState([])
  const [techSummary, setTechSummary] = useState([])
  const [elevatorStatus, setElevatorStatus] = useState([])
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [monthlyRevenue, setMonthlyRevenue] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [
      getOverdueMaintenance().then(({ data }) => setOverdue(data || [])),
      getJobsThisMonth().then(({ data }) => setJobsMonth(data || [])),
      getTechnicianSummary().then(({ data }) => setTechSummary(data || [])),
      getElevatorStatusOverview().then(({ data }) => setElevatorStatus(data || [])),
    ]
    if (isAdmin) {
      fetches.push(
        getUnpaidInvoices().then(({ data }) => setUnpaidInvoices(data || [])),
        getPaymentHistory().then(({ data }) => setPaymentHistory(data || [])),
        getMonthlyRevenue().then(({ data }) => setMonthlyRevenue(data || [])),
      )
    }
    Promise.all(fetches).then(() => setLoading(false))
  }, [isAdmin])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const techMap = {}
  techSummary.forEach(j => {
    const name = j.technician_name || 'Unassigned'
    if (!techMap[name]) techMap[name] = { scheduled: 0, in_progress: 0, completed: 0 }
    techMap[name][j.status] = (techMap[name][j.status] || 0) + 1
  })

  const revenueMap = {}
  monthlyRevenue.forEach(p => {
    const month = p.payment_date?.slice(0, 7)
    if (month) revenueMap[month] = (revenueMap[month] || 0) + Number(p.amount)
  })
  const revenueMonths = Object.entries(revenueMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6)

  const statusMap = {}
  elevatorStatus.forEach(e => {
    statusMap[e.status] = (statusMap[e.status] || 0) + 1
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <button onClick={() => window.print()}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-sm">
          Print / Export PDF
        </button>
      </div>

      <Section title="Overdue Maintenance Visits">
        {overdue.length === 0 ? <EmptyState /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overdue.map(s => (
                <tr key={s.id} className="text-sm">
                  <td className="py-2 text-gray-900">{s.elevators?.buildings?.customers?.name}</td>
                  <td className="py-2 text-gray-600">{s.elevators?.buildings?.name}</td>
                  <td className="py-2 font-medium text-gray-900">{s.elevators?.unit_number}</td>
                  <td className="py-2 text-gray-600 capitalize">{s.visit_type}</td>
                  <td className="py-2 text-red-600 font-medium">{s.next_due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Jobs Completed This Month">
        {jobsMonth.length === 0 ? <EmptyState /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobsMonth.map(j => (
                <tr key={j.id} className="text-sm">
                  <td className="py-2 text-gray-900">{j.completed_date}</td>
                  <td className="py-2 text-gray-600">{j.elevators?.buildings?.customers?.name}</td>
                  <td className="py-2 font-medium text-gray-900">{j.elevators?.unit_number}</td>
                  <td className="py-2 text-gray-600 capitalize">{j.maintenance_schedules?.visit_type}</td>
                  <td className="py-2 text-gray-600">{j.technician_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Technician Activity (This Month)">
        {Object.keys(techMap).length === 0 ? <EmptyState /> : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">In Progress</th>
                <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(techMap).map(([name, counts]) => (
                <tr key={name} className="text-sm">
                  <td className="py-2 font-medium text-gray-900">{name}</td>
                  <td className="py-2 text-right text-gray-600">{counts.scheduled || 0}</td>
                  <td className="py-2 text-right text-gray-600">{counts.in_progress || 0}</td>
                  <td className="py-2 text-right text-gray-600">{counts.completed || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Elevator Status Overview">
        {Object.keys(statusMap).length === 0 ? <EmptyState /> : (
          <div className="flex gap-6">
            {Object.entries(statusMap).map(([status, count]) => (
              <div key={status} className="text-center">
                <p className="text-3xl font-bold text-gray-800">{count}</p>
                <p className="text-sm text-gray-500 capitalize mt-1">{status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {isAdmin && (
        <>
          <Section title="Unpaid Invoices / Outstanding Balances">
            {unpaidInvoices.length === 0 ? <EmptyState /> : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {unpaidInvoices.map(inv => (
                    <tr key={inv.id} className="text-sm">
                      <td className="py-2 font-medium text-gray-900">{inv.invoice_number}</td>
                      <td className="py-2 text-gray-600">{inv.customers?.name}</td>
                      <td className="py-2 text-gray-600">{inv.due_date || '—'}</td>
                      <td className="py-2 text-right font-medium text-gray-900">{fmt(inv.total_amount)}</td>
                      <td className="py-2 text-gray-600 capitalize">{inv.status?.replace(/_/g, ' ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="Payment History">
            {paymentHistory.length === 0 ? <EmptyState /> : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentHistory.map(p => (
                    <tr key={p.id} className="text-sm">
                      <td className="py-2 text-gray-900">{p.payment_date}</td>
                      <td className="py-2 text-gray-600">{p.invoices?.invoice_number}</td>
                      <td className="py-2 text-gray-600">{p.invoices?.customers?.name}</td>
                      <td className="py-2 text-gray-600 capitalize">{p.payment_method?.replace(/_/g, ' ')}</td>
                      <td className="py-2 text-right font-medium text-gray-900">{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title="Monthly Revenue Summary">
            {revenueMonths.length === 0 ? <EmptyState /> : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {revenueMonths.map(([month, total]) => (
                    <tr key={month} className="text-sm">
                      <td className="py-2 font-medium text-gray-900">{month}</td>
                      <td className="py-2 text-right text-gray-900 font-medium">{fmt(total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
