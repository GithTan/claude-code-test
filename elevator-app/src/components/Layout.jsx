import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'
import { getAlerts, approveDeletion, denyDeletion, getWarrantyAlerts } from '../lib/api'

const navItems = [
  { label: '⬡ Start Here', to: '/start' },
  { label: 'Dashboard', to: '/' },
  { label: 'Customers', to: '/customers' },
  { label: 'New Installations', to: '/pipeline' },
  { label: 'Maintenance Contracts', to: '/contracts' },
  { label: 'Project Status', to: '/operations' },
  { label: 'Service Visits', to: '/jobs' },
  { label: 'Breakdown Calls', to: '/breakdowns' },
  { label: 'Finance', to: '/finance', adminOnly: true },
  { label: 'Invoices', to: '/invoices', adminOnly: true },
  { label: 'Reports', to: '/reports', adminOnly: true },
]

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function NotificationBell({ role }) {
  const [alerts, setAlerts] = useState({ production: [], deletions: [], overdueUpdates: [], actionsDue: [], total: 0 })
  const [warranty, setWarranty] = useState({ expiring: [], renewalFollowup: [] })
  const [open, setOpen] = useState(false)
  const [acting, setActing] = useState(null)
  const panelRef = useRef(null)

  async function load() {
    const [a, w] = await Promise.all([getAlerts(), getWarrantyAlerts()])
    setAlerts(a)
    setWarranty(w)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [])

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleApprove(id) {
    setActing(id)
    await approveDeletion(id)
    await load()
    setActing(null)
  }

  async function handleDeny(id) {
    setActing(id)
    await denyDeletion(id)
    await load()
    setActing(null)
  }

  const count = alerts.total + warranty.expiring.length + (role === 'admin' ? warranty.renewalFollowup.length : 0)

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'none', border: 'none',
          cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
        }}
        title={count > 0 ? `${count} alert${count > 1 ? 's' : ''}` : 'No alerts'}
      >
        {/* Bell SVG */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill={count > 0 ? '#D4AF37' : '#666666'}>
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        {/* Badge */}
        {count > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            backgroundColor: '#CC0000', color: '#FFFFFF',
            borderRadius: '50%', minWidth: 16, height: 16,
            fontSize: 10, fontWeight: 700, lineHeight: '16px',
            textAlign: 'center', padding: '0 3px',
          }}>
            {count}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'fixed', left: 224, top: 0,
          width: 320, maxHeight: '80vh', overflowY: 'auto',
          backgroundColor: '#FFFFFF', border: '1px solid #D4AF37',
          boxShadow: '4px 4px 16px rgba(0,0,0,0.2)', zIndex: 1000,
        }}>
          <div style={{ backgroundColor: '#2C2C2C', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: 13 }}>Alerts</span>
            {count === 0 && <span style={{ color: '#888888', fontSize: 12 }}>All clear</span>}
          </div>

          {/* Production alerts */}
          {alerts.production.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#F5F5DC', padding: '8px 16px', borderBottom: '1px solid #E8E0C8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8B4500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pre-Shipment Payment Due ({alerts.production.length})
                </span>
              </div>
              {alerts.production.map(p => {
                const days = daysSince(p.production_start_date)
                return (
                  <div key={p.id} style={{ padding: '12px 16px', borderBottom: '1px solid #E8E0C8', backgroundColor: '#FFFBF0' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 2 }}>{p.project_name}</p>
                    <p style={{ fontSize: 12, color: '#8B4500' }}>
                      Production day <strong>{days}</strong> of ~30 — follow up client for pre-shipment payment
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Deletion requests — admin only */}
          {role === 'admin' && alerts.deletions.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#F5F5DC', padding: '8px 16px', borderBottom: '1px solid #E8E0C8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8B0000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Deletion Requests ({alerts.deletions.length})
                </span>
              </div>
              {alerts.deletions.map(p => (
                <div key={p.id} style={{ padding: '12px 16px', borderBottom: '1px solid #E8E0C8' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 2 }}>{p.project_name}</p>
                  <p style={{ fontSize: 11, color: '#888888', marginBottom: 8 }}>
                    Requested by {p.deletion_requested_by || 'staff'}
                    {p.deletion_requested_at ? ` · ${daysSince(p.deletion_requested_at)}d ago` : ''}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleApprove(p.id)}
                      disabled={acting === p.id}
                      style={{ backgroundColor: '#8B0000', color: '#FFFFFF', border: 'none', padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {acting === p.id ? '…' : 'Approve Delete'}
                    </button>
                    <button
                      onClick={() => handleDeny(p.id)}
                      disabled={acting === p.id}
                      style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', border: '1px solid #D4AF37', padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overdue updates */}
          {alerts.overdueUpdates?.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#F5F5DC', padding: '8px 16px', borderBottom: '1px solid #E8E0C8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8B0000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  No Update in 7+ Days ({alerts.overdueUpdates.length})
                </span>
              </div>
              {alerts.overdueUpdates.map(p => (
                <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid #E8E0C8', backgroundColor: '#FFF8F8' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{p.project_name}</p>
                  <p style={{ fontSize: 11, color: '#8B0000' }}>Last updated {daysSince(p.last_updated_at)}d ago</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions due */}
          {alerts.actionsDue?.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#F5F5DC', padding: '8px 16px', borderBottom: '1px solid #E8E0C8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5C4A00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Next Actions Due ({alerts.actionsDue.length})
                </span>
              </div>
              {alerts.actionsDue.map(p => (
                <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid #E8E0C8', backgroundColor: '#FFFBF0' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{p.project_name}</p>
                  <p style={{ fontSize: 11, color: '#8B4500' }}>→ {p.next_action}</p>
                  {p.assigned_to && <p style={{ fontSize: 11, color: '#888888' }}>Assigned: {p.assigned_to}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Warranty expiring soon */}
          {warranty.expiring.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#F5F5DC', padding: '8px 16px', borderBottom: '1px solid #E8E0C8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#5C4A00', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Warranty Expiring Soon ({warranty.expiring.length})
                </span>
              </div>
              {warranty.expiring.map(p => (
                <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid #E8E0C8', backgroundColor: '#FFFBF0' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{p.project_name}</p>
                  <p style={{ fontSize: 11, color: '#8B4500' }}>Warranty ends: {p.maintenance_end_date}</p>
                </div>
              ))}
            </div>
          )}

          {/* Renewal follow-up — boss only */}
          {role === 'admin' && warranty.renewalFollowup.length > 0 && (
            <div>
              <div style={{ backgroundColor: '#F5F5DC', padding: '8px 16px', borderBottom: '1px solid #E8E0C8' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#8B0000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Renewal Follow-up — Boss Only ({warranty.renewalFollowup.length})
                </span>
              </div>
              {warranty.renewalFollowup.map(p => (
                <div key={p.id} style={{ padding: '10px 16px', borderBottom: '1px solid #E8E0C8', backgroundColor: '#FFF8F8' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C' }}>{p.project_name}</p>
                  <p style={{ fontSize: 11, color: '#8B0000' }}>Warranty expired. Has client signed renewal?</p>
                  <p style={{ fontSize: 11, color: '#888888' }}>Status: {p.renewal_negotiation_status?.replace(/_/g, ' ') || 'None'}</p>
                </div>
              ))}
            </div>
          )}

          {count === 0 && (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#888888' }}>No alerts right now.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const { user, role, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visibleItems = navItems.filter(item => !item.adminOnly || role === 'admin')

  function SidebarContent() {
    return (
      <>
        {/* Brand + Bell */}
        <div className="p-5" style={{ borderBottom: '1px solid #3D3D3D', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="font-brand text-xl font-bold" style={{ color: '#D4AF37', letterSpacing: '0.02em' }}>
              FIEC Elevator
            </h1>
            <p className="text-xs mt-1 capitalize" style={{ color: '#888888' }}>
              {role?.replaceAll('_', ' ')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell role={role} />
            {/* Close button on mobile */}
            <button className="desktop-hide" onClick={() => setSidebarOpen(false)}
              style={{ background: 'none', border: 'none', color: '#888888', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>
              ✕
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5" onClick={() => setSidebarOpen(false)}>
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#2C2C2C] font-semibold'
                    : 'hover:text-[#D4AF37]'
                }`
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#D4AF37', color: '#2C2C2C' } : { color: '#AAAAAA' }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4" style={{ borderTop: '1px solid #3D3D3D' }}>
          <p className="text-xs truncate mb-3" style={{ color: '#888888' }}>{user?.email}</p>
          <div className="flex items-center justify-end gap-2 mb-2">
            <div style={{
              width: 18, height: 18, border: '1.5px solid #D4AF37',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#D4AF37' }} />
            </div>
            <span className="font-brand text-xs" style={{ color: '#D4AF37', opacity: 0.7, letterSpacing: '0.05em' }}>
              RC 77558
            </span>
          </div>
          <div className="flex justify-end">
            <button onClick={signOut} className="text-xs transition-colors" style={{ color: '#888888' }}
              onMouseEnter={e => e.target.style.color = '#D4AF37'}
              onMouseLeave={e => e.target.style.color = '#888888'}>
              Sign out
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Desktop sidebar */}
      <aside className="w-56 flex flex-col mobile-hide" style={{ backgroundColor: '#2C2C2C' }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="desktop-hide" style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          {/* Backdrop */}
          <div onClick={() => setSidebarOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} />
          {/* Drawer */}
          <aside style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 224, backgroundColor: '#2C2C2C', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="desktop-hide" style={{ backgroundColor: '#2C2C2C', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'block', width: 20, height: 2, backgroundColor: '#D4AF37' }} />
            <span style={{ display: 'block', width: 20, height: 2, backgroundColor: '#D4AF37' }} />
            <span style={{ display: 'block', width: 20, height: 2, backgroundColor: '#D4AF37' }} />
          </button>
          <span className="font-brand" style={{ color: '#D4AF37', fontWeight: 700, fontSize: 16, letterSpacing: '0.02em' }}>FIEC Elevator</span>
          <div style={{ marginLeft: 'auto' }}>
            <NotificationBell role={role} />
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#F5F5F5' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
