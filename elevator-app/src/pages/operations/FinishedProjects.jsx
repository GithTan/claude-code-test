import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFinishedOpsProjects } from '../../lib/api'
import { maskProjectName } from '../../lib/trialMode'

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }
const tdStyle = { padding: '11px 14px', fontSize: 13, color: '#2C2C2C', borderBottom: '1px solid #E8E0C8', verticalAlign: 'top' }

export default function FinishedProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedYear, setExpandedYear] = useState(null)

  useEffect(() => {
    getFinishedOpsProjects().then(({ data }) => {
      setProjects(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  // Group by year
  const byYear = {}
  for (const p of projects) {
    const year = p.year_completed
      || (p.handed_over_date ? new Date(p.handed_over_date).getFullYear() : null)
      || (p.updated_at ? new Date(p.updated_at).getFullYear() : new Date().getFullYear())
    if (!byYear[year]) byYear[year] = []
    byYear[year].push(p)
  }
  const years = Object.keys(byYear).sort((a, b) => b - a)

  // Default: expand the most recent year
  const activeYear = expandedYear ?? years[0]

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div>
          <Link to="/operations" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Project Status</Link>
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#2C2C2C' }}>Finished Projects</h1>
        </div>
      </div>
      <p className="text-sm mb-6" style={{ color: '#888888' }}>
        All handed-over projects, grouped by year. {projects.length} total.
      </p>

      {years.length === 0 && (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#888888', fontSize: 14 }}>No finished projects yet.</p>
          <p style={{ color: '#888888', fontSize: 12, marginTop: 4 }}>Projects appear here when their status is set to "Handed Over".</p>
        </div>
      )}

      {/* Year tabs */}
      {years.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {years.map(year => (
            <button key={year} onClick={() => setExpandedYear(year)}
              style={{
                padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                backgroundColor: activeYear === year ? '#D4AF37' : '#F5F5DC',
                color: '#2C2C2C', border: '1px solid #D4AF37',
              }}>
              {year} ({byYear[year].length})
            </button>
          ))}
        </div>
      )}

      {activeYear && byYear[activeYear] && (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>PIC</th>
                <th style={thStyle}>Specs</th>
                <th style={thStyle}>Subcon</th>
                <th style={thStyle}>Handed Over</th>
                <th style={thStyle}>Warranty End</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {byYear[activeYear].map(p => {
                const warrantyDays = p.maintenance_end_date
                  ? Math.ceil((new Date(p.maintenance_end_date) - Date.now()) / 86400000)
                  : null
                return (
                  <tr key={p.id}
                    style={{ borderLeft: '3px solid #D4AF37' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      <Link to={`/operations/${p.id}`} style={{ color: '#2C2C2C', textDecoration: 'none', fontWeight: 600 }}
                        onMouseEnter={e => e.target.style.color = '#D4AF37'}
                        onMouseLeave={e => e.target.style.color = '#2C2C2C'}>
                        {maskProjectName(p.project_name)}
                      </Link>
                      {p.address && <p style={{ fontSize: 11, color: '#888888', fontWeight: 400, marginTop: 2 }}>{p.address}</p>}
                    </td>
                    <td style={tdStyle}>{p.pic || '—'}</td>
                    <td style={tdStyle}>
                      {p.specs && <p style={{ fontWeight: 500 }}>{p.specs}</p>}
                      {p.brand && <p style={{ fontSize: 11, color: '#888888' }}>{p.brand}</p>}
                      {p.unit_label && <p style={{ fontSize: 11, color: '#888888' }}>{p.unit_label}</p>}
                    </td>
                    <td style={tdStyle}>{p.subcon || <span style={{ color: '#CCCCCC' }}>—</span>}</td>
                    <td style={tdStyle}>
                      {p.handed_over_date
                        ? <span style={{ fontWeight: 600 }}>{p.handed_over_date}</span>
                        : <span style={{ color: '#CCCCCC' }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      {p.maintenance_end_date ? (
                        <div>
                          <p style={{ fontWeight: 500 }}>{p.maintenance_end_date}</p>
                          {warrantyDays !== null && (
                            <p style={{ fontSize: 11, color: warrantyDays <= 0 ? '#8B0000' : warrantyDays <= 30 ? '#8B4500' : '#888888', marginTop: 2 }}>
                              {warrantyDays <= 0 ? `Expired ${Math.abs(warrantyDays)}d ago` : `${warrantyDays}d left`}
                            </p>
                          )}
                        </div>
                      ) : <span style={{ color: '#CCCCCC' }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <Link to={`/operations/${p.id}/edit`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>
                        Edit →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ backgroundColor: '#F5F5DC', padding: '8px 14px', borderTop: '1px solid #D4AF37' }}>
            <span style={{ fontSize: 12, color: '#888888' }}>{byYear[activeYear].length} project{byYear[activeYear].length !== 1 ? 's' : ''} handed over in {activeYear}</span>
          </div>
        </div>
      )}
    </div>
  )
}
