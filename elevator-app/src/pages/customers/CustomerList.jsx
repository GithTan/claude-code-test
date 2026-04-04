import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomers } from '../../lib/api'

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }
const tdStyle = { padding: '12px 16px', fontSize: 13, color: '#2C2C2C', borderBottom: '1px solid #E8E0C8' }

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomers().then(({ data }) => {
      setCustomers(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const filtered = search
    ? customers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.contact_person?.toLowerCase().includes(search.toLowerCase()))
    : customers

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Customers</h1>
        <Link to="/customers/new"
          style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
          + Add Customer
        </Link>
      </div>
      <p className="text-sm mb-5" style={{ color: '#888888' }}>
        Every building or company you service. Add a customer first, then attach their buildings, elevators, and contracts.
      </p>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name or contact…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 12px', fontSize: 13, width: 280, outline: 'none' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, textAlign: 'center' }}>
          {customers.length === 0 ? (
            <>
              <p style={{ color: '#888888', fontSize: 14 }}>No customers yet.</p>
              <Link to="/customers/new" style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>Add your first customer →</Link>
            </>
          ) : (
            <p style={{ color: '#888888', fontSize: 14 }}>No customers match "{search}".</p>
          )}
        </div>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Company / Building</th>
                <th style={thStyle}>Contact Person</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {filtered.map(c => (
                <tr key={c.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{c.name}</td>
                  <td style={tdStyle}>{c.contact_person || <span style={{ color: '#CCCCCC' }}>—</span>}</td>
                  <td style={tdStyle}>{c.phone || <span style={{ color: '#CCCCCC' }}>—</span>}</td>
                  <td style={tdStyle}>{c.email || <span style={{ color: '#CCCCCC' }}>—</span>}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Link to={`/customers/${c.id}`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ backgroundColor: '#F5F5DC', padding: '8px 16px', borderTop: '1px solid #D4AF37' }}>
            <span style={{ fontSize: 12, color: '#888888' }}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}
