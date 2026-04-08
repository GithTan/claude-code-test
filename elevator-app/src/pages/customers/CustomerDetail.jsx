import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCustomer, getBuildings } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { shouldHideContactNumbers } from '../../lib/trialMode'

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }
const tdStyle = { padding: '12px 16px', fontSize: 13, color: '#2C2C2C', borderBottom: '1px solid #E8E0C8' }
const labelStyle = { fontSize: 12, color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }
const valueStyle = { fontSize: 14, color: '#2C2C2C', fontWeight: 500 }

export default function CustomerDetail() {
  const { id } = useParams()
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const hideContactNumbers = shouldHideContactNumbers()
  const [customer, setCustomer] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCustomer(id), getBuildings(id)]).then(([c, b]) => {
      setCustomer(c.data)
      setBuildings(b.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>
  if (!customer) return <p style={{ color: '#8B0000' }}>Customer not found.</p>

  return (
    <div style={{ maxWidth: 680 }}>
      <Link to="/customers" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Customers</Link>

      <div className="flex justify-between items-start mt-3 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>{customer.name}</h1>
        <Link to={`/customers/${id}/edit`}
          style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
          Edit
        </Link>
      </div>

      {/* Contact info */}
      <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={labelStyle}>Contact Person</p>
            <p style={valueStyle}>{customer.contact_person || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Phone</p>
            {hideContactNumbers
              ? <p style={{ ...valueStyle, color: '#CCCCCC', fontStyle: 'italic', fontSize: 13 }}>Hidden during trial</p>
              : isAdmin
              ? <p style={valueStyle}>{customer.phone || '—'}</p>
              : <p style={{ ...valueStyle, color: '#CCCCCC', fontStyle: 'italic', fontSize: 13 }}>Visible to admin only</p>}
          </div>
          <div>
            <p style={labelStyle}>Email</p>
            <p style={valueStyle}>{customer.email || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Address</p>
            <p style={valueStyle}>{customer.address || '—'}</p>
          </div>
        </div>
      </div>

      {/* Buildings */}
      <div className="flex justify-between items-center mb-3">
        <p style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2C' }}>Buildings</p>
        <Link to={`/customers/${id}/buildings/new`}
          style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '7px 14px', fontSize: 13, fontWeight: 600 }}>
          + Add Building
        </Link>
      </div>

      {buildings.length === 0 ? (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#888888', fontSize: 14 }}>No buildings yet.</p>
          <Link to={`/customers/${id}/buildings/new`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>Add a building →</Link>
        </div>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Building Name</th>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>Floors</th>
                <th style={thStyle}>Capacity</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {buildings.map(b => (
                <tr key={b.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{b.name}</td>
                  <td style={tdStyle}>{b.address || '—'}</td>
                  <td style={tdStyle}>{b.floors || '—'}</td>
                  <td style={tdStyle}>{b.capacity || '—'}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Link to={`/buildings/${b.id}/elevators`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>
                      View Elevators →
                    </Link>
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
