import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAmcContracts } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function expiryBadge(endDate, status) {
  if (status === 'expired' || status === 'cancelled') {
    return <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, backgroundColor: '#E8E8E8', color: '#2C2C2C' }} className="capitalize">{status}</span>
  }
  const daysLeft = Math.ceil((new Date(endDate) - new Date()) / 86400000)
  if (daysLeft <= 30) return <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, backgroundColor: '#2C2C2C', color: '#D4AF37' }}>Expires in {daysLeft}d</span>
  if (daysLeft <= 60) return <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, backgroundColor: '#F5F5DC', color: '#2C2C2C', border: '1px solid #D4AF37' }}>Expires in {daysLeft}d</span>
  return <span style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, backgroundColor: '#D4AF37', color: '#2C2C2C' }}>Active</span>
}

export default function AmcList() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const [contracts, setContracts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAmcContracts().then(({ data }) => {
      setContracts(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter)

  const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }
  const tdStyle = { padding: '12px 16px', fontSize: 13, color: '#2C2C2C', borderBottom: '1px solid #E8E0C8' }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Maintenance Contracts</h1>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', color: '#2C2C2C', padding: '6px 12px', fontSize: 13 }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Link to="/contracts/new"
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
            New Contract
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: '#888888' }}>No contracts yet.</p>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Contract Name</th>
                <th style={thStyle}>Customer</th>
                {isAdmin && <th style={thStyle}>Contact</th>}
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Period</th>
                <th style={thStyle}>Billing</th>
                {isAdmin && <th style={{ ...thStyle, textAlign: 'right' }}>Monthly Fee</th>}
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {filtered.map(c => (
                <tr key={c.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{c.contract_number || '—'}</td>
                  <td style={tdStyle}>{c.customers?.name || '—'}</td>
                  {isAdmin && (
                    <td style={tdStyle}>
                      {c.contact_name && <p style={{ fontSize: 13 }}>{c.contact_name}</p>}
                      {c.contact_number
                        ? <p style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>{c.contact_number}</p>
                        : <p style={{ fontSize: 12, color: '#CCCCCC' }}>—</p>
                      }
                    </td>
                  )}
                  <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{c.contract_type?.replace(/_/g, ' ')}</td>
                  <td style={tdStyle}>
                    <p style={{ fontSize: 12 }}>{c.start_date}</p>
                    <p style={{ fontSize: 12, color: '#888888' }}>to {c.end_date}</p>
                  </td>
                  <td style={{ ...tdStyle, textTransform: 'capitalize', fontSize: 12 }}>
                    {(c.billing_frequency || 'monthly').replace(/_/g, ' ')}
                  </td>
                  {isAdmin && (
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: c.monthly_fee > 0 ? '#D4AF37' : '#2C2C2C' }}>
                      {fmt(c.monthly_fee)}
                      <p style={{ fontSize: 11, fontWeight: 400, color: '#888888' }}>
                        {c.vat_inclusive ? 'VAT Inc.' : 'Non-VAT'}
                      </p>
                    </td>
                  )}
                  <td style={tdStyle}>{expiryBadge(c.end_date, c.status)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Link to={`/contracts/${c.id}`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
