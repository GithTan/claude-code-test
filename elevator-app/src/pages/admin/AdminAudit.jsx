import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getRecentAmcActivity,
  getRecentProjectActivity,
  getSensitivePageAccess,
} from '../../lib/api'
import { maskProjectName } from '../../lib/trialMode'

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SectionCard({ title, count, children }) {
  return (
    <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        <span style={{ fontSize: 11, color: '#888888' }}>{count}</span>
      </div>
      {children}
    </div>
  )
}

export default function AdminAudit() {
  const [sensitiveViews, setSensitiveViews] = useState([])
  const [projectActivity, setProjectActivity] = useState([])
  const [amcActivity, setAmcActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      const [sensitiveRes, projectRes, amcRes] = await Promise.all([
        getSensitivePageAccess(),
        getRecentProjectActivity(),
        getRecentAmcActivity(),
      ])

      const firstError = sensitiveRes.error || projectRes.error || amcRes.error
      if (firstError) {
        setError(firstError.message || 'Unable to load admin audit data.')
      }

      setSensitiveViews(sensitiveRes.data || [])
      setProjectActivity(projectRes.data || [])
      setAmcActivity(amcRes.data || [])
      setLoading(false)
    }

    load()
  }, [])

  const allRows = useMemo(() => {
    const pageRows = sensitiveViews.map(row => ({
      id: `page-${row.id}`,
      group: 'page',
      title: row.page_label || row.page_key || 'Confidential page',
      subtitle: row.page_path || row.page_key || 'Page view',
      actor: row.viewed_by || row.viewer_role || 'Unknown',
      when: row.viewed_at || row.created_at,
      detail: row.viewer_role ? `Role: ${row.viewer_role}` : 'Sensitive page viewed',
      to: null,
    }))

    const projectRows = projectActivity.map(row => ({
      id: `project-${row.id}`,
      group: 'project',
      title: maskProjectName(row.ops_projects?.project_name, 'Project'),
      subtitle: row.action?.replace(/_/g, ' ') || 'activity',
      actor: row.performed_by || 'Unknown',
      when: row.performed_at,
      detail: row.details || '',
      to: row.ops_project_id ? `/operations/${row.ops_project_id}` : null,
    }))

    const amcRows = amcActivity.map(row => ({
      id: `amc-${row.id}`,
      group: 'amc',
      title: row.amc_contracts?.contract_number || row.amc_contracts?.project_name || 'AMC activity',
      subtitle: row.action?.replace(/_/g, ' ') || 'activity',
      actor: row.performed_by || 'Unknown',
      when: row.performed_at,
      detail: row.details || row.amc_contracts?.customers?.name || '',
      to: row.amc_contract_id ? `/contracts/${row.amc_contract_id}` : null,
    }))

    return [...pageRows, ...projectRows, ...amcRows].sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0))
  }, [amcActivity, projectActivity, sensitiveViews])

  const filteredRows = allRows.filter(row => {
    if (tab !== 'all' && row.group !== tab) return false
    if (!search) return true
    const q = search.toLowerCase()
    return [row.title, row.subtitle, row.actor, row.detail].some(value => String(value || '').toLowerCase().includes(q))
  })

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Admin audit</h1>
          <p style={{ fontSize: 13, color: '#888888', marginTop: 4 }}>
            Review confidential page access, project activity, and AMC actions in one place.
          </p>
        </div>
        <Link to="/operations" style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
          Project Status
        </Link>
      </div>

      {error && (
        <div style={{ backgroundColor: '#FFF4F0', border: '1px solid #8B0000', padding: '10px 14px', marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8B0000' }}>Audit notice</p>
          <p style={{ fontSize: 12, color: '#8B0000' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <SectionCard title="Sensitive page views" count={`${sensitiveViews.length} recent`}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#2C2C2C' }}>{sensitiveViews.length}</p>
          <p style={{ fontSize: 12, color: '#888888', marginTop: 4 }}>Confidential screens opened</p>
        </SectionCard>
        <SectionCard title="Project actions" count={`${projectActivity.length} recent`}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#8B4500' }}>{projectActivity.length}</p>
          <p style={{ fontSize: 12, color: '#888888', marginTop: 4 }}>Project edits, approvals, and deletion activity</p>
        </SectionCard>
        <SectionCard title="AMC actions" count={`${amcActivity.length} recent`}>
          <p style={{ fontSize: 26, fontWeight: 700, color: '#D4AF37' }}>{amcActivity.length}</p>
          <p style={{ fontSize: 12, color: '#888888', marginTop: 4 }}>Renewals and monthly billing status changes</p>
        </SectionCard>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All activity' },
          { key: 'page', label: 'Sensitive pages' },
          { key: 'project', label: 'Project activity' },
          { key: 'amc', label: 'AMC activity' },
        ].map(option => (
          <button
            key={option.key}
            onClick={() => setTab(option.key)}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: tab === option.key ? '#D4AF37' : '#F5F5DC',
              color: '#2C2C2C',
              border: '1px solid #D4AF37',
            }}
          >
            {option.label}
          </button>
        ))}
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search page, action, user, or detail"
          style={{ flex: 1, minWidth: 240, border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 12px', fontSize: 13, outline: 'none' }}
        />
      </div>

      <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#2C2C2C', fontWeight: 600 }}>
          Example use:
        </p>
        <p style={{ fontSize: 12, color: '#888888', marginTop: 4 }}>
          If someone opens Finance or Reports using a shared test account, you can now see when that happened. You can also review who changed AMC billing status or requested / approved a project deletion.
        </p>
      </div>

      <div style={{ border: '1px solid #D4AF37', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Type', 'Record', 'Action', 'User', 'When', 'Detail'].map(label => (
                <th key={label} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: '#F5F5DC', borderBottom: '1px solid #D4AF37' }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ backgroundColor: '#FFFFFF' }}>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '18px 14px', fontSize: 13, color: '#888888' }}>No audit entries match this filter.</td>
              </tr>
            ) : (
              filteredRows.map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid #E8E0C8' }}>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#888888', fontWeight: 700, textTransform: 'uppercase' }}>{row.group}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13, color: '#2C2C2C', fontWeight: 600 }}>
                    {row.to ? (
                      <Link to={row.to} style={{ color: '#2C2C2C', textDecoration: 'none' }}>{row.title}</Link>
                    ) : row.title}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: row.group === 'page' ? '#8B0000' : '#8B4500', fontWeight: 600 }}>{row.subtitle}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#2C2C2C' }}>{row.actor}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#888888', whiteSpace: 'nowrap' }}>{formatDateTime(row.when)}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#666666' }}>{row.detail || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
