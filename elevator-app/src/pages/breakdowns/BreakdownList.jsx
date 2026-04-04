import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBreakdowns } from '../../lib/api'

function priorityBadge(priority) {
  const map = {
    high: { bg: '#8B0000', color: '#FFFFFF', border: '#8B0000', label: 'High' },
    medium: { bg: '#D4AF37', color: '#2C2C2C', border: '#D4AF37', label: 'Medium' },
    low: { bg: '#F5F5DC', color: '#2C2C2C', border: '#D4AF37', label: 'Low' },
  }
  const s = map[priority] || { bg: '#F5F5F5', color: '#888888', border: '#CCCCCC', label: priority }
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}

function statusBadge(status) {
  const map = {
    open: { bg: '#8B0000', color: '#FFFFFF', border: '#8B0000', label: 'Open' },
    in_progress: { bg: '#2C2C2C', color: '#D4AF37', border: '#2C2C2C', label: 'In Progress' },
    resolved: { bg: '#D4AF37', color: '#2C2C2C', border: '#D4AF37', label: 'Resolved' },
  }
  const s = map[status] || { bg: '#F5F5F5', color: '#888888', border: '#CCCCCC', label: status }
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  )
}

const thStyle = { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }
const tdStyle = { padding: '12px 16px', fontSize: 13, color: '#2C2C2C', borderBottom: '1px solid #E8E0C8' }

export default function BreakdownList() {
  const [breakdowns, setBreakdowns] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBreakdowns().then(({ data }) => {
      setBreakdowns(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const filtered = filter === 'all' ? breakdowns : breakdowns.filter(b => b.status === filter)
  const openCount = breakdowns.filter(b => b.status === 'open').length
  const inProgressCount = breakdowns.filter(b => b.status === 'in_progress').length

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Breakdown Calls</h1>
        <Link to="/breakdowns/new"
          style={{ backgroundColor: '#8B0000', color: '#FFFFFF', padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
          + Log Breakdown
        </Link>
      </div>
      <p className="text-sm mb-5" style={{ color: '#888888' }}>
        Customer calls with a stuck or faulty elevator. Log it here, assign a technician, and track until resolved.
      </p>

      {/* Quick stats */}
      <div className="flex gap-3 mb-5">
        {[
          { label: 'Open', value: openCount, filter: 'open' },
          { label: 'In Progress', value: inProgressCount, filter: 'in_progress' },
          { label: 'All', value: breakdowns.length, filter: 'all' },
        ].map(s => (
          <button key={s.filter} onClick={() => setFilter(s.filter)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              backgroundColor: filter === s.filter ? '#D4AF37' : '#F5F5DC',
              color: '#2C2C2C', border: '1px solid #D4AF37',
            }}>
            {s.value} {s.label}
          </button>
        ))}
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ marginLeft: 'auto', border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', color: '#2C2C2C', padding: '8px 12px', fontSize: 13 }}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#888888', fontSize: 14 }}>No breakdown calls found.</p>
          <Link to="/breakdowns/new" style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>Log your first breakdown →</Link>
        </div>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Elevator</th>
                <th style={thStyle}>Problem</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Technician</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {filtered.map(b => (
                <tr key={b.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                  <td style={tdStyle}>{b.reported_date || '—'}</td>
                  <td style={tdStyle}>{b.elevators?.buildings?.customers?.name || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{b.elevators?.unit_number || '—'}</td>
                  <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.description || '—'}</td>
                  <td style={tdStyle}>{priorityBadge(b.priority)}</td>
                  <td style={tdStyle}>{b.technician_name || <span style={{ color: '#CCCCCC' }}>Unassigned</span>}</td>
                  <td style={tdStyle}>{statusBadge(b.status)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Link to={`/breakdowns/${b.id}/edit`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upsell prompt — show when there are resolved breakdowns */}
      {breakdowns.filter(b => b.status === 'resolved').length > 0 && (
        <div style={{ marginTop: 24, backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 20 }}>
          <p style={{ color: '#D4AF37', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            Recurring breakdowns? Consider a Maintenance Contract.
          </p>
          <p style={{ color: '#AAAAAA', fontSize: 13, marginBottom: 12 }}>
            Customers on AMC get priority response and scheduled visits — fewer emergency calls for you, better service for them.
          </p>
          <Link to="/contracts/new"
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '7px 16px', fontSize: 13, fontWeight: 600 }}>
            Create Maintenance Contract →
          </Link>
        </div>
      )}
    </div>
  )
}
