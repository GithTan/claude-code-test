import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getElevatorStatusOverview, getJobsThisMonth, getMonthlyRevenue,
  getOverdueMaintenance, getPaymentHistory, getTechnicianSummary, getUnpaidInvoices,
  getBreakdownPatterns,
} from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }
const thRight = { ...{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }, textAlign: 'right' }
const tdStyle = { padding: '10px 16px', fontSize: 13, color: '#2C2C2C', borderBottom: '1px solid #E8E0C8' }

function Section({ title, children }) {
  return (
    <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: '#2C2C2C', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
      {children}
    </div>
  )
}

function EmptyState() {
  return <p style={{ color: '#888888', fontSize: 13 }}>No data.</p>
}

function DataTable({ columns, rows }) {
  return (
    <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} style={c.right ? thRight : thStyle}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ backgroundColor: '#FFFFFF' }}>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key} style={{ ...tdStyle, ...(c.right ? { textAlign: 'right' } : {}), ...(c.bold ? { fontWeight: 600 } : {}), ...(c.red ? { color: '#8B0000', fontWeight: 700 } : {}) }}>
                  {row[c.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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
  const [breakdownPatterns, setBreakdownPatterns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [
      getOverdueMaintenance().then(({ data }) => setOverdue(data || [])),
      getBreakdownPatterns().then(({ data }) => setBreakdownPatterns(data || [])),
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

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

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
  elevatorStatus.forEach(e => { statusMap[e.status] = (statusMap[e.status] || 0) + 1 })

  // Breakdown patterns: group by elevator, sort by count desc
  const bdMap = {}
  breakdownPatterns.forEach(b => {
    const elevId = b.elevators?.id
    if (!elevId) return
    if (!bdMap[elevId]) {
      bdMap[elevId] = {
        elevator: b.elevators?.unit_number,
        building: b.elevators?.buildings?.name,
        customer: b.elevators?.buildings?.customers?.name,
        count: 0,
        lastDate: null,
        lastDesc: null,
        openCount: 0,
      }
    }
    bdMap[elevId].count++
    if (!bdMap[elevId].lastDate || b.reported_date > bdMap[elevId].lastDate) {
      bdMap[elevId].lastDate = b.reported_date
      bdMap[elevId].lastDesc = b.description
    }
    if (b.status === 'open' || b.status === 'in_progress') bdMap[elevId].openCount++
  })
  const bdRows = Object.values(bdMap).sort((a, b) => b.count - a.count)

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Reports</h1>
        <button onClick={() => window.print()}
          style={{ border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Print / Export PDF
        </button>
      </div>
      <p className="text-sm mb-6" style={{ color: '#888888' }}>
        Operational summary — overdue visits, technician activity, and elevator status at a glance.
      </p>

      <Section title="Overdue Maintenance Visits">
        {overdue.length === 0 ? <EmptyState /> : (
          <DataTable
            columns={[
              { key: 'customer', label: 'Customer', bold: true },
              { key: 'building', label: 'Building' },
              { key: 'elevator', label: 'Elevator', bold: true },
              { key: 'type', label: 'Visit Type' },
              { key: 'due', label: 'Due Date', red: true },
            ]}
            rows={overdue.map(s => ({
              customer: s.elevators?.buildings?.customers?.name,
              building: s.elevators?.buildings?.name,
              elevator: s.elevators?.unit_number,
              type: s.visit_type,
              due: s.next_due_date,
            }))}
          />
        )}
      </Section>

      <Section title="Service Visits Completed This Month">
        {jobsMonth.length === 0 ? <EmptyState /> : (
          <DataTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'customer', label: 'Customer' },
              { key: 'elevator', label: 'Elevator', bold: true },
              { key: 'type', label: 'Type' },
              { key: 'tech', label: 'Technician' },
            ]}
            rows={jobsMonth.map(j => ({
              date: j.completed_date,
              customer: j.elevators?.buildings?.customers?.name,
              elevator: j.elevators?.unit_number,
              type: j.maintenance_schedules?.visit_type,
              tech: j.technician_name,
            }))}
          />
        )}
      </Section>

      <Section title="Technician Activity (This Month)">
        {Object.keys(techMap).length === 0 ? <EmptyState /> : (
          <DataTable
            columns={[
              { key: 'name', label: 'Technician', bold: true },
              { key: 'scheduled', label: 'Scheduled', right: true },
              { key: 'in_progress', label: 'In Progress', right: true },
              { key: 'completed', label: 'Completed', right: true },
            ]}
            rows={Object.entries(techMap).map(([name, counts]) => ({
              name,
              scheduled: String(counts.scheduled || 0),
              in_progress: String(counts.in_progress || 0),
              completed: String(counts.completed || 0),
            }))}
          />
        )}
      </Section>

      <Section title="Elevator Status Overview">
        {Object.keys(statusMap).length === 0 ? <EmptyState /> : (
          <div style={{ display: 'flex', gap: 24 }}>
            {Object.entries(statusMap).map(([status, count]) => (
              <div key={status} style={{ textAlign: 'center', backgroundColor: '#FFFFFF', border: '1px solid #D4AF37', padding: '16px 24px' }}>
                <p style={{ fontSize: 28, fontWeight: 700, color: '#2C2C2C' }}>{count}</p>
                <p style={{ fontSize: 12, color: '#888888', textTransform: 'capitalize', marginTop: 4 }}>{status.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Breakdown Patterns — Repeat Offenders">
        {bdRows.length === 0 ? <EmptyState /> : (
          <>
            <p style={{ fontSize: 12, color: '#888888', marginBottom: 12 }}>
              Elevators ranked by total breakdown reports. Units with 3+ breakdowns may need scheduled part replacement.
            </p>
            <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Building</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Elevator</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Total Reports</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Open Now</th>
                    <th style={thStyle}>Last Report</th>
                    <th style={thStyle}>Last Issue</th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#FFFFFF' }}>
                  {bdRows.map((r, i) => (
                    <tr key={i} style={{ backgroundColor: r.count >= 3 ? '#FFF8E8' : '#FFFFFF' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{r.building || '—'}</td>
                      <td style={tdStyle}>{r.customer || '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{r.elevator || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <span style={{
                          fontWeight: 700,
                          color: r.count >= 5 ? '#8B0000' : r.count >= 3 ? '#8B4500' : '#2C2C2C',
                          backgroundColor: r.count >= 5 ? '#FFE8E8' : r.count >= 3 ? '#FFF0D8' : 'transparent',
                          padding: r.count >= 3 ? '2px 8px' : undefined,
                        }}>
                          {r.count}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: r.openCount > 0 ? '#8B0000' : '#888888', fontWeight: r.openCount > 0 ? 700 : 400 }}>
                        {r.openCount || '—'}
                      </td>
                      <td style={{ ...tdStyle, color: '#888888' }}>{r.lastDate || '—'}</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: '#666666', maxWidth: 200 }}>{r.lastDesc || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      {isAdmin && (
        <>
          <Section title="Unpaid Invoices / Outstanding Balances">
            {unpaidInvoices.length === 0 ? <EmptyState /> : (
              <DataTable
                columns={[
                  { key: 'invoice', label: 'Invoice #', bold: true },
                  { key: 'customer', label: 'Customer' },
                  { key: 'due', label: 'Due Date' },
                  { key: 'amount', label: 'Amount', right: true, bold: true },
                  { key: 'status', label: 'Status' },
                ]}
                rows={unpaidInvoices.map(inv => ({
                  invoice: inv.invoice_number,
                  customer: inv.customers?.name,
                  due: inv.due_date,
                  amount: fmt(inv.total_amount),
                  status: inv.status?.replace(/_/g, ' '),
                }))}
              />
            )}
          </Section>

          <Section title="Payment History">
            {paymentHistory.length === 0 ? <EmptyState /> : (
              <DataTable
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'invoice', label: 'Invoice' },
                  { key: 'customer', label: 'Customer' },
                  { key: 'method', label: 'Method' },
                  { key: 'amount', label: 'Amount', right: true, bold: true },
                ]}
                rows={paymentHistory.map(p => ({
                  date: p.payment_date,
                  invoice: p.invoices?.invoice_number,
                  customer: p.invoices?.customers?.name,
                  method: p.payment_method?.replace(/_/g, ' '),
                  amount: fmt(p.amount),
                }))}
              />
            )}
          </Section>

          <Section title="Monthly Revenue Summary">
            {revenueMonths.length === 0 ? <EmptyState /> : (
              <DataTable
                columns={[
                  { key: 'month', label: 'Month', bold: true },
                  { key: 'total', label: 'Total Collected', right: true, bold: true },
                ]}
                rows={revenueMonths.map(([month, total]) => ({ month, total: fmt(total) }))}
              />
            )}
          </Section>
        </>
      )}
    </div>
  )
}
