import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOpsProjects } from '../../lib/api'
import { TEAM_MEMBERS } from './OpsProjectDetail'

// Handed over projects are moved to Finished Projects page

export const OPS_STATUSES = [
  { value: 'on_going_production',          label: 'On-Going Production',           bg: '#1A2A4A', color: '#7EB8F7' },
  { value: 'for_delivery',                 label: 'For Delivery / Shipment',       bg: '#4A3A00', color: '#F5D87A' },
  { value: 'unit_delivered_awaiting_shaft',label: 'Unit Delivered – Awaiting Shaft',bg: '#5C3A00', color: '#F5C06A' },
  { value: 'awaiting_shaft_readiness',     label: 'Awaiting Shaft Readiness',      bg: '#3A1A00', color: '#E8B87A' },
  { value: 'for_unloading',               label: 'For Unloading',                 bg: '#2C2C2C', color: '#D4AF37' },
  { value: 'mechanical_installation',      label: 'Mechanical Installation',        bg: '#2C2C2C', color: '#D4AF37' },
  { value: 'for_tnc',                     label: 'For T&C',                        bg: '#5C4A00', color: '#F5F5DC' },
  { value: 'done_tnc',                    label: 'Done T&C',                       bg: '#D4AF37', color: '#2C2C2C' },
  { value: 'awaiting_power',              label: 'Awaiting Power',                 bg: '#8B4500', color: '#F5F5DC' },
  { value: 'for_handover',               label: 'For Handover',                   bg: '#D4AF37', color: '#2C2C2C' },
  { value: 'handed_over',                label: 'Handed Over',                    bg: '#2C2C2C', color: '#D4AF37' },
]

export function statusDef(val) {
  return OPS_STATUSES.find(s => s.value === val) || { label: val, bg: '#888', color: '#fff' }
}

function StatusBadge({ status }) {
  const s = statusDef(status)
  return (
    <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 9px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

function QADot({ done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: done ? '#D4AF37' : '#E8E0C8', border: '1px solid #D4AF37', flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#888888' }}>{label}</span>
    </div>
  )
}

const thStyle = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }
const tdStyle = { padding: '11px 14px', fontSize: 13, color: '#2C2C2C', borderBottom: '1px solid #E8E0C8', verticalAlign: 'top' }

function isNew(createdAt) {
  if (!createdAt) return false
  return (Date.now() - new Date(createdAt)) < 3 * 86400000
}

export default function OperationsList() {
  const [projects, setProjects] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [picFilter, setPicFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only load active (non-handed-over) projects
    getOpsProjects().then(({ data }) => {
      setProjects((data || []).filter(p => p.status !== 'handed_over'))
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  const activeCount = projects.length

  const pics = ['all', ...TEAM_MEMBERS]

  const filtered = projects
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => picFilter === 'all' || p.pic === picFilter)
    .filter(p => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        p.project_name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.pic?.toLowerCase().includes(q) ||
        p.subcon?.toLowerCase().includes(q) ||
        p.contact_person?.toLowerCase().includes(q) ||
        p.concerns?.toLowerCase().includes(q) ||
        p.next_action?.toLowerCase().includes(q)
      )
    })

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Project Status</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/operations/finished"
            style={{ border: '1px solid #D4AF37', color: '#888888', padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
            Finished Projects →
          </Link>
          <Link to="/operations/new"
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
            + Add Project
          </Link>
        </div>
      </div>
      <p className="text-sm mb-4" style={{ color: '#888888' }}>
        Active projects only — from production through installation and T&C. Handed over projects are in Finished Projects.
      </p>

      {/* Search + PIC filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search project name, address, contact, concerns…"
          style={{ flex: 1, border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 12px', fontSize: 13, outline: 'none' }}
        />
        <select value={picFilter} onChange={e => setPicFilter(e.target.value)}
          style={{ border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', color: '#2C2C2C', padding: '8px 12px', fontSize: 13 }}>
          {pics.map(p => <option key={p} value={p}>{p === 'all' ? 'All PICs' : p}</option>)}
        </select>
        {(search || picFilter !== 'all' || filter !== 'all') && (
          <button onClick={() => { setSearch(''); setPicFilter('all'); setFilter('all') }}
            style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#888888', padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {[
          { label: 'Active', value: activeCount, filter: 'all' },
          { label: 'In Production', value: projects.filter(p => p.status === 'on_going_production').length, filter: 'on_going_production' },
          { label: 'Awaiting Shaft', value: projects.filter(p => p.status === 'awaiting_shaft_readiness').length, filter: 'awaiting_shaft_readiness' },
          { label: 'Unit Delivered', value: projects.filter(p => p.status === 'unit_delivered_awaiting_shaft').length, filter: 'unit_delivered_awaiting_shaft' },
          { label: 'For Handover', value: projects.filter(p => p.status === 'for_handover').length, filter: 'for_handover' },
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
          {OPS_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, textAlign: 'center' }}>
          <p style={{ color: '#888888', fontSize: 14 }}>No projects found.</p>
          <Link to="/operations/new" style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600 }}>Add a project →</Link>
        </div>
      ) : (
        <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>PIC</th>
                <th style={thStyle}>Specs / Unit</th>
                <th style={thStyle}>Subcon</th>
                <th style={thStyle}>QA</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Concerns</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#FFFFFF' }}>
              {filtered.map(p => {
                const brandNew = isNew(p.created_at)
                const pendingDeletion = p.deletion_pending
                const rowBg = pendingDeletion ? '#FFF0F0' : brandNew ? '#FFFEF0' : '#FFFFFF'
                const rowHover = pendingDeletion ? '#FFE8E8' : brandNew ? '#FFFDE0' : '#FAFAF0'
                return (
                  <tr key={p.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = rowHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = rowBg}
                    style={{ backgroundColor: rowBg, borderLeft: brandNew ? '3px solid #D4AF37' : pendingDeletion ? '3px solid #CC0000' : 'none' }}>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Link to={`/operations/${p.id}`} style={{ color: '#2C2C2C', textDecoration: 'none', fontWeight: 600 }}
                          onMouseEnter={e => e.target.style.color = '#D4AF37'}
                          onMouseLeave={e => e.target.style.color = '#2C2C2C'}>
                          {p.project_name}
                        </Link>
                        {brandNew && (
                          <span style={{ fontSize: 9, fontWeight: 700, backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '1px 5px', letterSpacing: '0.05em' }}>NEW</span>
                        )}
                        {pendingDeletion && (
                          <span style={{ fontSize: 9, fontWeight: 700, backgroundColor: '#CC0000', color: '#FFFFFF', padding: '1px 5px', letterSpacing: '0.05em' }}>DEL PENDING</span>
                        )}
                      </div>
                      {p.address && <p style={{ fontSize: 11, color: '#888888', fontWeight: 400, marginTop: 2 }}>{p.address}</p>}
                      {(p.project_start_date || p.project_end_date) && (
                        <p style={{ fontSize: 11, color: '#888888', fontWeight: 400, marginTop: 2 }}>
                          {p.project_start_date || '—'} → {p.project_end_date || 'ongoing'}
                        </p>
                      )}
                      {p.next_action
                        ? <p style={{ fontSize: 11, color: '#8B4500', marginTop: 3 }}>→ {p.next_action}{p.assigned_to ? ` · ${p.assigned_to}` : ''}</p>
                        : <p style={{ fontSize: 11, color: '#D4AF37', marginTop: 3, fontStyle: 'italic' }}>No next action — needs owner</p>
                      }
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.pic || '—'}</td>
                    <td style={tdStyle}>
                      {p.specs && <p style={{ fontWeight: 500 }}>{p.specs}</p>}
                      {p.unit_label && <p style={{ fontSize: 11, color: '#888888' }}>{p.unit_label}</p>}
                      {p.s_o_f && <p style={{ fontSize: 11, color: '#888888' }}>S/O/F: {p.s_o_f}</p>}
                    </td>
                    <td style={tdStyle}>{p.subcon || <span style={{ color: '#CCCCCC' }}>—</span>}</td>
                    <td style={{ ...tdStyle, minWidth: 90 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <QADot done={p.qa_pre_install} label="Pre-install" />
                        <QADot done={p.qa_mid} label="Mid" />
                        <QADot done={p.qa_pre_handover} label="Pre-HO" />
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={p.status} />
                      {p.stall_reason && (
                        <p style={{ fontSize: 11, color: '#8B4500', marginTop: 4, fontStyle: 'italic' }}>{p.stall_reason}</p>
                      )}
                    </td>
                    <td style={{ ...tdStyle, maxWidth: 200, fontSize: 12, color: '#666666' }}>
                      {p.concerns || <span style={{ color: '#CCCCCC' }}>—</span>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      <Link to={`/operations/${p.id}/edit`} style={{ color: '#D4AF37', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        Edit →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ backgroundColor: '#F5F5DC', padding: '8px 14px', borderTop: '1px solid #D4AF37' }}>
            <span style={{ fontSize: 12, color: '#888888' }}>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}
