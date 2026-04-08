import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAmcBillingTrackerMonth, markAmcBillingStatus } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { maskProjectName } from '../../lib/trialMode'

function fmt(amount) {
  return `PHP ${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7)
}

function monthStart(monthValue) {
  return `${monthValue}-01`
}

const STATUS_STYLES = {
  pending: { bg: '#F5F5DC', color: '#8B4500', label: 'Pending' },
  billed: { bg: '#2C2C2C', color: '#D4AF37', label: 'Billed' },
  paid: { bg: '#D4AF37', color: '#2C2C2C', label: 'Paid' },
}

export default function AmcBillingTracker() {
  const { role, user } = useAuth()
  const [month, setMonth] = useState(currentMonthValue())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [acting, setActing] = useState('')

  async function load(selectedMonth = month) {
    setLoading(true)
    setError('')
    const { data, error: loadError } = await getAmcBillingTrackerMonth(monthStart(selectedMonth))
    if (loadError) {
      setRows([])
      setError(loadError.message || 'Unable to load AMC billing records.')
      setLoading(false)
      return
    }
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load(month)
  }, [month])

  async function updateStatus(row, nextStatus) {
    const key = `${row.contract.id}-${nextStatus}`
    setActing(key)
    const { error: saveError } = await markAmcBillingStatus(row.contract, monthStart(month), nextStatus, user?.email || 'admin')
    setActing('')
    if (saveError) {
      setError(saveError.message || 'Unable to update billing status.')
      return
    }
    await load(month)
  }

  const totals = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc.expected += row.amount
      if (['billed', 'paid'].includes(row.status)) acc.billed += row.amount
      if (row.status === 'paid') acc.collected += row.amount
      return acc
    }, { expected: 0, billed: 0, collected: 0 })
  }, [rows])

  const thStyle = {
    padding: '10px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: '#F5F5DC',
    borderBottom: '1px solid #D4AF37',
  }

  const tdStyle = {
    padding: '12px 16px',
    fontSize: 13,
    color: '#2C2C2C',
    borderBottom: '1px solid #E8E0C8',
    verticalAlign: 'top',
  }

  if (role !== 'admin') {
    return <p style={{ color: '#8B0000' }}>Admin access required.</p>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>AMC Monthly Billing Tracker</h1>
          <p style={{ color: '#888888', fontSize: 13, marginTop: 4 }}>
            Track who needs invoicing this month, what has been billed, and what has already been collected.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="month"
            value={month}
            onChange={event => setMonth(event.target.value)}
            style={{ border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', color: '#2C2C2C', padding: '7px 12px', fontSize: 13, outline: 'none' }}
          />
          <Link to="/contracts" style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
            Contracts
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 18 }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#2C2C2C' }}>{fmt(totals.expected)}</p>
          <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 600, marginTop: 4 }}>Expected revenue</p>
          <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>{rows.length} active contract{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 18 }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#8B4500' }}>{fmt(totals.billed)}</p>
          <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 600, marginTop: 4 }}>Marked billed</p>
          <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>Includes already paid contracts</p>
        </div>
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 18 }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#D4AF37' }}>{fmt(totals.collected)}</p>
          <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 600, marginTop: 4 }}>Collected revenue</p>
          <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>Payments confirmed this month</p>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #D4AF37', padding: 16, marginBottom: 16 }}>
          <p style={{ color: '#8B0000', fontSize: 13, fontWeight: 700 }}>{error}</p>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#888888' }}>Loading...</p>
      ) : rows.length === 0 ? (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={{ color: '#888888', fontSize: 14 }}>No active AMC contracts found for this month.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Contract</th>
                <th style={thStyle}>Customer</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Monthly Fee</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Dates</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {rows.map(row => {
                const statusStyle = STATUS_STYLES[row.status] || STATUS_STYLES.pending
                const billedKey = `${row.contract.id}-billed`
                const paidKey = `${row.contract.id}-paid`
                const pendingKey = `${row.contract.id}-pending`

                return (
                  <tr key={row.contract.id}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      <p>{maskProjectName(row.contract.contract_number || row.contract.project_name, 'Project')}</p>
                      <Link to={`/contracts/${row.contract.id}`} style={{ color: '#D4AF37', fontSize: 12, fontWeight: 600 }}>
                        View contract
                      </Link>
                    </td>
                    <td style={tdStyle}>{row.contract.customers?.name || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700 }}>{fmt(row.amount)}</td>
                    <td style={tdStyle}>
                      <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <p style={{ fontSize: 12, color: '#2C2C2C' }}>Month: {month}</p>
                      <p style={{ fontSize: 11, color: '#888888', marginTop: 4 }}>
                        Billed: {row.record?.billed_at ? new Date(row.record.billed_at).toLocaleDateString('en-PH') : '-'}
                      </p>
                      <p style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>
                        Paid: {row.record?.paid_at ? new Date(row.record.paid_at).toLocaleDateString('en-PH') : '-'}
                      </p>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => updateStatus(row, 'pending')}
                          disabled={acting === pendingKey}
                          style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: acting === pendingKey ? 0.5 : 1 }}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(row, 'billed')}
                          disabled={acting === billedKey}
                          style={{ border: '1px solid #D4AF37', backgroundColor: '#2C2C2C', color: '#D4AF37', padding: '6px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: acting === billedKey ? 0.5 : 1 }}
                        >
                          {acting === billedKey ? 'Saving...' : 'Mark billed'}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(row, 'paid')}
                          disabled={acting === paidKey}
                          style={{ border: '1px solid #D4AF37', backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: acting === paidKey ? 0.5 : 1 }}
                        >
                          {acting === paidKey ? 'Saving...' : 'Mark paid'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
