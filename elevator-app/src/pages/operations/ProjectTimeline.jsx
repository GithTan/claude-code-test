import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOpsProjects } from '../../lib/api'
import { statusDef } from './OperationsList'
import { maskProjectName } from '../../lib/trialMode'

function today() {
  return new Date().toISOString().split('T')[0]
}

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000)
}

// Given a set of projects with dates, compute a shared timeline window
function getWindow(projects) {
  const dates = []
  projects.forEach(p => {
    if (p.project_start_date) dates.push(new Date(p.project_start_date))
    if (p.project_end_date) dates.push(new Date(p.project_end_date))
  })
  if (dates.length === 0) return null
  const min = new Date(Math.min(...dates.map(d => d.getTime())))
  const max = new Date(Math.max(...dates.map(d => d.getTime())))
  // Pad 14 days each side
  min.setDate(min.getDate() - 14)
  max.setDate(max.getDate() + 14)
  return { min, max, span: daysBetween(min, max) }
}

function pct(date, win) {
  return Math.max(0, Math.min(100, (daysBetween(win.min, date) / win.span) * 100))
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ProjectTimeline() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('with_dates') // 'all' | 'with_dates' | 'no_dates'

  useEffect(() => {
    getOpsProjects().then(({ data }) => {
      setProjects((data || []).filter(p => p.status !== 'handed_over'))
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const withDates = projects.filter(p => p.project_start_date || p.project_end_date)
  const noDates = projects.filter(p => !p.project_start_date && !p.project_end_date)

  const displayed = filter === 'with_dates' ? withDates
    : filter === 'no_dates' ? noDates
    : projects

  const win = getWindow(withDates)
  const todayStr = today()
  const todayDate = new Date(todayStr)
  const todayPct = win ? pct(todayDate, win) : 50

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Project Timeline</h1>
        <Link to="/operations"
          style={{ border: '1px solid #D4AF37', color: '#888888', padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
          ← List View
        </Link>
      </div>
      <p style={{ color: '#888888', fontSize: 13, marginBottom: 16 }}>
        Active projects with installation dates. Projects without dates shown separately.
      </p>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #D4AF37' }}>
        {[
          { key: 'with_dates', label: `With Dates (${withDates.length})` },
          { key: 'no_dates',   label: `No Dates (${noDates.length})` },
          { key: 'all',        label: `All (${projects.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              borderBottom: filter === t.key ? '2px solid #D4AF37' : '2px solid transparent',
              backgroundColor: 'transparent', color: filter === t.key ? '#2C2C2C' : '#888888',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Timeline chart — only for projects with dates */}
      {filter !== 'no_dates' && win && withDates.length > 0 && (
        <div style={{ marginBottom: 32 }}>

          {/* Month labels */}
          <MonthLabels win={win} />

          {/* Today line marker */}
          <div style={{ position: 'relative', height: 0, marginBottom: 0 }}>
            <div style={{
              position: 'absolute', left: `${todayPct}%`, top: 0, bottom: 0,
              width: 0, borderLeft: '2px dashed #D4AF37', height: (withDates.length * 52) + 8, zIndex: 10,
              transform: 'translateX(-1px)',
            }} />
            <div style={{
              position: 'absolute', left: `${todayPct}%`, top: -20,
              transform: 'translateX(-50%)',
              backgroundColor: '#D4AF37', color: '#2C2C2C', fontSize: 10, fontWeight: 700,
              padding: '1px 6px', whiteSpace: 'nowrap',
            }}>TODAY</div>
          </div>

          {/* Bars */}
          <div style={{ marginTop: 24 }}>
            {withDates.map(p => {
              const s = statusDef(p.status)
              const start = parseDate(p.project_start_date)
              const end = parseDate(p.project_end_date)
              const hasStart = !!start
              const hasEnd = !!end

              const leftPct = hasStart ? pct(start, win) : (hasEnd ? pct(end, win) - 5 : 0)
              const rightPct = hasEnd ? pct(end, win) : (hasStart ? pct(start, win) + 5 : 100)
              const widthPct = Math.max(rightPct - leftPct, 1)

              const isOverdue = hasEnd && end < todayDate && p.status !== 'handed_over'
              const isDueSoon = hasEnd && daysBetween(todayDate, end) <= 14 && end >= todayDate

              return (
                <div key={p.id} style={{ position: 'relative', height: 44, marginBottom: 8 }}>
                  {/* Background track */}
                  <div style={{
                    position: 'absolute', left: 0, right: 0, top: '50%',
                    transform: 'translateY(-50%)', height: 1, backgroundColor: '#E8E0C8',
                  }} />

                  {/* Project bar */}
                  <div style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    top: '50%', transform: 'translateY(-50%)',
                    height: 28,
                    backgroundColor: isOverdue ? '#8B0000' : s.bg,
                    border: `1px solid ${isOverdue ? '#CC0000' : '#D4AF37'}`,
                    display: 'flex', alignItems: 'center', overflow: 'hidden',
                    minWidth: 4,
                  }}>
                    {widthPct > 8 && (
                      <Link to={`/operations/${p.id}`}
                        style={{
                          color: isOverdue ? '#FFD0D0' : s.color,
                          fontSize: 11, fontWeight: 700, padding: '0 8px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          textDecoration: 'none', display: 'block', width: '100%',
                        }}>
                        {maskProjectName(p.project_name)}
                      </Link>
                    )}
                  </div>

                  {/* Project name label outside bar if bar too small */}
                  {widthPct <= 8 && (
                    <Link to={`/operations/${p.id}`}
                      style={{
                        position: 'absolute',
                        left: `${Math.min(leftPct + widthPct + 1, 70)}%`,
                        top: '50%', transform: 'translateY(-50%)',
                        fontSize: 11, color: '#2C2C2C', fontWeight: 600,
                        whiteSpace: 'nowrap', textDecoration: 'none',
                      }}>
                      {maskProjectName(p.project_name)}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Table for selected filter */}
      {displayed.length === 0 ? (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#888888', fontSize: 14 }}>No projects in this group.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Project', 'Status', 'Start', 'End', 'Duration', 'PIC'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                    color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em',
                    backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {displayed.map(p => {
                const s = statusDef(p.status)
                const start = parseDate(p.project_start_date)
                const end = parseDate(p.project_end_date)
                const isOverdue = end && end < todayDate
                const duration = start && end ? daysBetween(start, end) + ' days' : '—'
                return (
                  <tr key={p.id}
                    style={{ borderBottom: '1px solid #E8E0C8' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF0'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>
                      <Link to={`/operations/${p.id}`}
                        style={{ color: '#2C2C2C', textDecoration: 'none' }}
                        onMouseEnter={e => e.target.style.color = '#D4AF37'}
                        onMouseLeave={e => e.target.style.color = '#2C2C2C'}>
                        {maskProjectName(p.project_name)}
                      </Link>
                      {p.address && <div style={{ fontSize: 11, color: '#888888', marginTop: 2 }}>{p.address}</div>}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ backgroundColor: s.bg, color: s.color, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#2C2C2C' }}>
                      {formatDate(p.project_start_date)}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: isOverdue ? '#8B0000' : '#2C2C2C', fontWeight: isOverdue ? 700 : 400 }}>
                      {formatDate(p.project_end_date)}
                      {isOverdue && <div style={{ fontSize: 10, color: '#8B0000' }}>OVERDUE</div>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#888888' }}>{duration}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#2C2C2C' }}>{p.pic || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ backgroundColor: '#F5F5DC', padding: '8px 14px', borderTop: '1px solid #D4AF37' }}>
            <span style={{ fontSize: 12, color: '#888888' }}>{displayed.length} project{displayed.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* No-dates callout when viewing all */}
      {filter === 'all' && noDates.length > 0 && (
        <div style={{ marginTop: 16, backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: '12px 16px' }}>
          <p style={{ fontSize: 12, color: '#888888' }}>
            {noDates.length} project{noDates.length !== 1 ? 's' : ''} have no installation dates set.
            Add dates in the project edit page to show them on timeline.
          </p>
        </div>
      )}
    </div>
  )
}

function MonthLabels({ win }) {
  const labels = []
  const cur = new Date(win.min)
  cur.setDate(1)
  while (cur <= win.max) {
    const p = Math.max(0, Math.min(100, (daysBetween(win.min, cur) / win.span) * 100))
    labels.push({
      label: cur.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' }),
      pct: p,
    })
    cur.setMonth(cur.getMonth() + 1)
  }
  return (
    <div style={{ position: 'relative', height: 20, marginBottom: 4, borderBottom: '1px solid #E8E0C8' }}>
      {labels.map((l, i) => (
        <span key={i} style={{
          position: 'absolute', left: `${l.pct}%`,
          fontSize: 10, color: '#888888', fontWeight: 600, whiteSpace: 'nowrap',
          transform: 'translateX(-50%)',
        }}>{l.label}</span>
      ))}
    </div>
  )
}
