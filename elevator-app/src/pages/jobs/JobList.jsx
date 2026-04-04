import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobs } from '../../lib/api'

function statusBadge(status) {
  const map = {
    scheduled: { bg: '#F5F5DC', color: '#2C2C2C', border: '#D4AF37', label: 'Scheduled' },
    in_progress: { bg: '#2C2C2C', color: '#D4AF37', border: '#2C2C2C', label: 'In Progress' },
    completed: { bg: '#D4AF37', color: '#2C2C2C', border: '#D4AF37', label: 'Completed' },
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

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobs().then(({ data }) => { setJobs(data || []); setLoading(false) })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const today = new Date().toISOString().split('T')[0]
  const filtered = filter === 'all' ? jobs
    : filter === 'today' ? jobs.filter(j => j.scheduled_date === today)
    : jobs.filter(j => j.status === filter)

  const todayCount = jobs.filter(j => j.scheduled_date === today).length
  const openCount = jobs.filter(j => j.status === 'scheduled' || j.status === 'in_progress').length

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Service Visits</h1>
        <Link to="/jobs/new"
          style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
          + Log Service Visit
        </Link>
      </div>
      <p className="text-sm mb-5" style={{ color: '#888888' }}>
        Record every technician visit — preventive maintenance, repairs, inspections. Upload the service report to close the visit.
      </p>

      {/* Quick stats */}
      <div className="flex gap-3 mb-5">
        {[
          { label: "Today's Visits", value: todayCount, filter: 'today' },
          { label: 'Open', value: openCount, filter: 'scheduled' },
          { label: 'Total', value: jobs.length, filter: 'all' },
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
          <option value="today">Today</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#888888', fontSize: 14 }}>No service visits found.</p>
          <Link to="/jobs/new" style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>Log your first visit →</Link>
        </div>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Elevator</th>
                <th style={thStyle}>Visit Type</th>
                <th style={thStyle}>Technician</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {filtered.map(j => (
                <tr key={j.id}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                  <td style={{ ...tdStyle, fontWeight: j.scheduled_date === today ? 700 : 400, color: j.scheduled_date === today ? '#D4AF37' : '#2C2C2C' }}>
                    {j.scheduled_date === today ? 'Today' : j.scheduled_date}
                  </td>
                  <td style={tdStyle}>{j.elevators?.buildings?.customers?.name || '—'}</td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{j.elevators?.unit_number || '—'}</td>
                  <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{j.maintenance_schedules?.visit_type || j.job_type || '—'}</td>
                  <td style={tdStyle}>{j.technician_name || <span style={{ color: '#CCCCCC' }}>Unassigned</span>}</td>
                  <td style={tdStyle}>{statusBadge(j.status)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <Link to={`/jobs/${j.id}/edit`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>View →</Link>
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
