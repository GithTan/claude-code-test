// elevator-app/src/pages/finance/FinanceDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPipelines, getAmcContracts, getJobs, getInvoices, createInvoice, PIPELINE_STEPS } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h2 className="text-base font-semibold" style={{ color: '#2C2C2C' }}>{title}</h2>
      {count > 0 && (
        <span className="text-xs font-bold px-2 py-0.5" style={{ backgroundColor: '#D4AF37', color: '#2C2C2C' }}>
          {count}
        </span>
      )}
    </div>
  )
}

function EmptyRow({ message }) {
  return (
    <p className="text-sm py-3" style={{ color: '#888888' }}>{message}</p>
  )
}

export default function FinanceDashboard() {
  const [pipelines, setPipelines] = useState([])
  const [contracts, setContracts] = useState([])
  const [jobs, setJobs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [creatingInvoice, setCreatingInvoice] = useState(null)

  async function load() {
    const [p, c, j, inv] = await Promise.all([
      getPipelines(),
      getAmcContracts(),
      getJobs(),
      getInvoices(),
    ])
    setPipelines(p.data || [])
    setContracts(c.data || [])
    setJobs(j.data || [])
    setInvoices(inv.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const today = new Date()
  const thisMonth = today.toISOString().slice(0, 7)

  // 1. Pipelines at Step 12 (Turnover) — final payment due
  const atTurnover = pipelines.filter(p =>
    p.current_step === PIPELINE_STEPS.length &&
    p.pipeline_steps?.find(s => s.step_number === PIPELINE_STEPS.length && s.status === 'unlocked')
  )

  // 2. Completed pipelines — check if fully invoiced
  const completedPipelines = pipelines.filter(p => p.status === 'completed')

  // 3. AMC contracts due for billing this month
  const amcDueThisMonth = contracts.filter(c => {
    if (c.status !== 'active') return false
    if (!c.last_billed_date) return true // never billed
    const lastBilled = new Date(c.last_billed_date)
    const freq = c.billing_frequency || 'monthly'
    if (freq === 'monthly') {
      return lastBilled.toISOString().slice(0, 7) < thisMonth
    }
    if (freq === 'quarterly') {
      const monthsDiff = (today.getFullYear() - lastBilled.getFullYear()) * 12 + (today.getMonth() - lastBilled.getMonth())
      return monthsDiff >= 3
    }
    if (freq === 'twice_monthly') {
      const daysDiff = daysSince(c.last_billed_date)
      return daysDiff >= 15
    }
    return false // by_call — manual
  })

  // 4. Completed jobs not yet invoiced
  const completedUnbilledJobs = jobs.filter(j =>
    j.status === 'completed' && !j.invoice_id
  )

  // 5. Overdue invoices
  const overdueInvoices = invoices.filter(inv =>
    ['unpaid', 'partially_paid'].includes(inv.status) &&
    inv.due_date && inv.due_date < today.toISOString().split('T')[0]
  )

  // 6. Invoices due this month not yet paid
  const dueThisMonth = invoices.filter(inv =>
    ['unpaid', 'partially_paid'].includes(inv.status) &&
    inv.due_date?.slice(0, 7) === thisMonth
  )

  const totalOverdue = overdueInvoices.reduce((s, i) => s + Number(i.total_amount || 0), 0)
  const totalDueThisMonth = dueThisMonth.reduce((s, i) => s + Number(i.total_amount || 0), 0)

  async function quickCreateInvoice(customerId, description, amount) {
    setCreatingInvoice(description)
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 30)
    const { data } = await createInvoice({
      customer_id: customerId,
      issue_date: today.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      status: 'unpaid',
      notes: description,
      total_amount: amount || 0,
    })
    setCreatingInvoice(null)
    if (data?.id) window.location.href = `/invoices/${data.id}`
  }

  const cardStyle = { backgroundColor: '#F5F5DC', border: '1px solid #D4AF37' }
  const tableHeaderStyle = { color: '#888888', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }
  const dividerStyle = { borderColor: '#E8E0C8' }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Finance Dashboard</h1>
        <Link to="/invoices" className="text-sm font-medium" style={{ color: '#D4AF37' }}>
          All Invoices →
        </Link>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-5 shadow-sm" style={cardStyle}>
          <p className="text-2xl font-bold" style={{ color: totalOverdue > 0 ? '#D4AF37' : '#2C2C2C' }}>
            {fmt(totalOverdue)}
          </p>
          <p className="text-sm mt-1" style={{ color: '#2C2C2C' }}>Overdue</p>
          <p className="text-xs mt-0.5" style={{ color: '#888888' }}>{overdueInvoices.length} invoice{overdueInvoices.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-5 shadow-sm" style={cardStyle}>
          <p className="text-2xl font-bold" style={{ color: totalDueThisMonth > 0 ? '#D4AF37' : '#2C2C2C' }}>
            {fmt(totalDueThisMonth)}
          </p>
          <p className="text-sm mt-1" style={{ color: '#2C2C2C' }}>Due This Month</p>
          <p className="text-xs mt-0.5" style={{ color: '#888888' }}>{dueThisMonth.length} invoice{dueThisMonth.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-5 shadow-sm" style={cardStyle}>
          <p className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>
            {amcDueThisMonth.length}
          </p>
          <p className="text-sm mt-1" style={{ color: '#2C2C2C' }}>Maintenance Billing Due</p>
          <p className="text-xs mt-0.5" style={{ color: '#888888' }}>Contracts to bill</p>
        </div>
      </div>

      {/* Section 1: Projects at Turnover — Final Payment */}
      <div className="p-5 shadow-sm mb-6" style={cardStyle}>
        <SectionHeader title="Projects at Turnover — Final Payment Due" count={atTurnover.length} />
        {atTurnover.length === 0 ? (
          <EmptyRow message="No projects at turnover stage." />
        ) : (
          <div className="divide-y" style={dividerStyle}>
            {atTurnover.map(p => {
              const proj = p.installation_projects
              return (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{proj?.project_name || '—'}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                      {p.elevator_type?.replace(/_/g, ' ')} · {p.unit_count} unit{p.unit_count !== 1 ? 's' : ''}
                      {proj?.contract_amount ? ` · ${fmt(proj.contract_amount)}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to={`/pipeline/${p.id}`} className="text-xs" style={{ color: '#D4AF37' }}>
                      View Pipeline →
                    </Link>
                    <button
                      onClick={() => quickCreateInvoice(proj?.customers?.id, `Final payment — ${proj?.project_name}`, proj?.contract_amount)}
                      disabled={creatingInvoice !== null}
                      className="text-xs px-3 py-1.5 font-medium disabled:opacity-50"
                      style={{ backgroundColor: '#D4AF37', color: '#2C2C2C' }}>
                      {creatingInvoice === `Final payment — ${proj?.project_name}` ? 'Creating…' : 'Create Invoice'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 2: Maintenance Billing Due This Month */}
      <div className="p-5 shadow-sm mb-6" style={cardStyle}>
        <SectionHeader title="Maintenance Contracts — Bill This Month" count={amcDueThisMonth.length} />
        {amcDueThisMonth.length === 0 ? (
          <EmptyRow message="All maintenance contracts billed for this month." />
        ) : (
          <div className="divide-y" style={dividerStyle}>
            {amcDueThisMonth.map(c => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>{c.customers?.name || '—'}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                    {c.billing_frequency?.replace(/_/g, ' ') || 'Monthly'} ·
                    {c.last_billed_date ? ` Last billed ${c.last_billed_date}` : ' Never billed'}
                    {c.monthly_rate ? ` · ${fmt(c.monthly_rate)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/contracts/${c.id}`} className="text-xs" style={{ color: '#D4AF37' }}>
                    View Contract →
                  </Link>
                  <button
                    onClick={() => quickCreateInvoice(c.customer_id, `Maintenance fee — ${c.customers?.name}`, c.monthly_rate)}
                    disabled={creatingInvoice !== null}
                    className="text-xs px-3 py-1.5 font-medium disabled:opacity-50"
                    style={{ backgroundColor: '#D4AF37', color: '#2C2C2C' }}>
                    {creatingInvoice === `Maintenance fee — ${c.customers?.name}` ? 'Creating…' : 'Create Invoice'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Completed Jobs Not Yet Invoiced */}
      <div className="p-5 shadow-sm mb-6" style={cardStyle}>
        <SectionHeader title="Completed Jobs — Not Yet Invoiced" count={completedUnbilledJobs.length} />
        {completedUnbilledJobs.length === 0 ? (
          <EmptyRow message="All completed jobs have been invoiced." />
        ) : (
          <div className="divide-y" style={dividerStyle}>
            {completedUnbilledJobs.slice(0, 10).map(j => (
              <div key={j.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>
                    {j.elevators?.buildings?.customers?.name || '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                    Elevator {j.elevators?.unit_number} ·
                    Completed {j.completed_date || '—'} ·
                    {j.maintenance_schedules?.visit_type || j.job_type || 'Service'}
                  </p>
                </div>
                <Link to="/invoices/new" className="text-xs px-3 py-1.5 font-medium"
                  style={{ backgroundColor: '#D4AF37', color: '#2C2C2C' }}>
                  Create Invoice
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Overdue Invoices */}
      <div className="p-5 shadow-sm mb-6" style={cardStyle}>
        <SectionHeader title="Overdue Invoices — Follow Up Now" count={overdueInvoices.length} />
        {overdueInvoices.length === 0 ? (
          <EmptyRow message="No overdue invoices." />
        ) : (
          <div className="divide-y" style={dividerStyle}>
            {overdueInvoices.map(inv => {
              const overdueDays = daysSince(inv.due_date)
              return (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#2C2C2C' }}>
                      {inv.customers?.name || '—'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                      {inv.invoice_number} · Due {inv.due_date}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#D4AF37' }}>{fmt(inv.total_amount)}</p>
                      <p className="text-xs font-semibold" style={{ color: overdueDays > 30 ? '#8B0000' : '#2C2C2C' }}>
                        {overdueDays}d overdue
                      </p>
                    </div>
                    <Link to={`/invoices/${inv.id}`} className="text-xs px-3 py-1.5 font-medium"
                      style={{ backgroundColor: '#2C2C2C', color: '#D4AF37' }}>
                      View →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
