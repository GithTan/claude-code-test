// elevator-app/src/pages/StartHere.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomers, getAmcContracts, getPipelines, getJobs } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function Step({ number, title, description, action, to, done, adminOnly, role }) {
  if (adminOnly && role !== 'admin') return null
  return (
    <div style={{
      display: 'flex', gap: 16, padding: '20px 0',
      borderBottom: '1px solid #E8E0C8', opacity: done ? 0.6 : 1,
    }}>
      {/* Number / check */}
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        backgroundColor: done ? '#D4AF37' : '#2C2C2C',
        color: done ? '#2C2C2C' : '#D4AF37',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 16,
      }}>
        {done ? '✓' : number}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: '#2C2C2C', marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13, color: '#666666', marginBottom: done ? 0 : 12, lineHeight: 1.5 }}>{description}</p>
        {!done && (
          <Link to={to} style={{
            display: 'inline-block', backgroundColor: '#D4AF37', color: '#2C2C2C',
            padding: '7px 16px', fontSize: 13, fontWeight: 600,
          }}>
            {action} →
          </Link>
        )}
        {done && <p style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>Done</p>}
      </div>
    </div>
  )
}

function FlowCard({ title, subtitle, steps }) {
  return (
    <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2C2C2C', marginBottom: 4 }}>{title}</h2>
      <p style={{ fontSize: 13, color: '#888888', marginBottom: 8 }}>{subtitle}</p>
      {steps}
    </div>
  )
}

export default function StartHere() {
  const { role } = useAuth()
  const [counts, setCounts] = useState({ customers: 0, contracts: 0, pipelines: 0, jobs: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getCustomers(),
      getAmcContracts(),
      getPipelines(),
      getJobs(),
    ]).then(([c, a, p, j]) => {
      setCounts({
        customers: c.data?.length || 0,
        contracts: a.data?.length || 0,
        pipelines: p.data?.length || 0,
        jobs: j.data?.length || 0,
      })
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const hasCustomers = counts.customers > 0
  const hasContracts = counts.contracts > 0
  const hasPipelines = counts.pipelines > 0
  const hasJobs = counts.jobs > 0

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#2C2C2C', marginBottom: 4 }}>
        Where to Start
      </h1>
      <p style={{ fontSize: 14, color: '#888888', marginBottom: 32 }}>
        Follow these steps to get FIEC Elevator fully set up and running.
      </p>

      {/* Flow 1: New Installation */}
      <FlowCard
        title="New Installation Project"
        subtitle="Someone awarded you a new elevator project — start here."
        steps={
          <>
            <Step number={1} role={role}
              title="Add the customer"
              description="Before creating a pipeline, the customer needs to be in the system. Go to Customers and add their company name and contact details."
              action="Add Customer" to="/customers/new"
              done={hasCustomers}
            />
            <Step number={2} role={role}
              title="Start a new pipeline"
              description={role === 'admin'
                ? 'Go to Pipeline and click New Pipeline. Enter the project name, elevator type, number of units, and contract amount. The app will guide you through all 12 steps from drawings to turnover.'
                : 'Go to Pipeline and click New Pipeline. Enter the project name, elevator type, and number of units. The app will guide you through all 12 steps from drawings to turnover.'}
              action="New Pipeline" to="/pipeline/new"
              done={hasPipelines}
            />
            <Step number={3} role={role} adminOnly
              title="Track payment milestones in Finance"
              description="When the project reaches Step 12 (Turnover), it appears in your Finance dashboard as a final payment due. Go to Finance to create the invoice."
              action="Go to Finance" to="/finance"
              done={false}
            />
          </>
        }
      />

      {/* Flow 2: Maintenance */}
      <FlowCard
        title="Setting Up Maintenance (Do Once Per Customer)"
        subtitle="For customers you maintain elevators for — set this up once and the system tracks everything."
        steps={
          <>
            <Step number={1} role={role}
              title="Add the customer"
              description="Go to Customers and add the building or company name, their address, and contact person."
              action="Add Customer" to="/customers/new"
              done={hasCustomers}
            />
            <Step number={2} role={role}
              title="Create their maintenance contract"
              description={role === 'admin'
                ? 'Go to Maintenance Contracts and create a contract for this customer. Set the monthly fee, billing frequency, and contract dates.'
                : 'Go to Maintenance Contracts and create a contract for this customer. Set the billing frequency and contract dates.'}
              action="New Contract" to="/contracts/new"
              done={hasContracts}
            />
            <Step number={3} role={role}
              title="Add their elevator(s)"
              description="Go to Customers, open the customer, then add their building and elevator units. This lets you track which elevator was serviced."
              action="Go to Customers" to="/customers"
              done={hasCustomers}
            />
          </>
        }
      />

      {/* Flow 3: Day to day */}
      <FlowCard
        title="Day-to-Day Operations"
        subtitle="What your team uses every day."
        steps={
          <>
            <Step number={1} role={role}
              title="Customer calls with a breakdown"
              description="Go to Breakdowns → New Breakdown. Log the customer, describe the problem, assign a technician. The supervisor will be notified."
              action="Log Breakdown" to="/breakdowns/new"
              done={false}
            />
            <Step number={2} role={role}
              title="Technician goes out for a scheduled visit"
              description="Go to Jobs → New Job. Select the elevator, assign the technician, set the date. After the visit, upload the maintenance report to close the job."
              action="New Job" to="/jobs/new"
              done={hasJobs}
            />
            <Step number={3} role={role} adminOnly
              title="Bill customers at end of month"
              description="Go to Finance. It shows you exactly which AMC customers are due for billing, which jobs are unbilled, and which invoices are overdue — all in one screen."
              action="Go to Finance" to="/finance"
              done={false}
            />
          </>
        }
      />

      {/* Quick links */}
      <div style={{ backgroundColor: '#2C2C2C', padding: 24, border: '1px solid #D4AF37' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#D4AF37', marginBottom: 16 }}>Quick Links</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'New Pipeline', to: '/pipeline/new' },
            { label: 'New Breakdown', to: '/breakdowns/new' },
            { label: 'New Contract', to: '/contracts/new' },
            { label: 'New Job', to: '/jobs/new' },
            { label: 'Add Customer', to: '/customers/new' },
            ...(role === 'admin' ? [{ label: 'Finance Dashboard', to: '/finance' }] : []),
          ].map(link => (
            <Link key={link.to} to={link.to} style={{
              backgroundColor: '#3D3D3D', color: '#F5F5DC', padding: '10px 14px',
              fontSize: 13, fontWeight: 500, display: 'block',
              border: '1px solid #4D4D4D',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#D4AF37'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#4D4D4D'}>
              {link.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
