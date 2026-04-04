import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Customers', to: '/customers' },
  { label: 'Elevators', to: '/elevators' },
  { label: 'Contracts', to: '/contracts' },
  { label: 'Maintenance', to: '/maintenance' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Breakdowns', to: '/breakdowns' },
  { label: 'Pipeline', to: '/pipeline' },
  { label: 'Invoices', to: '/invoices', adminOnly: true },
  { label: 'Projects', to: '/projects', adminOnly: true },
  { label: 'Reports', to: '/reports' },
]

export default function Layout({ children }) {
  const { user, role, signOut } = useAuth()

  const visibleItems = navItems.filter(item => !item.adminOnly || role === 'admin')

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col" style={{ backgroundColor: '#2C2C2C' }}>
        {/* Brand */}
        <div className="p-5" style={{ borderBottom: '1px solid #3D3D3D' }}>
          <h1 className="font-brand text-xl font-bold" style={{ color: '#D4AF37', letterSpacing: '0.02em' }}>
            FIEC Elevator
          </h1>
          <p className="text-xs mt-1 capitalize" style={{ color: '#888888' }}>
            {role?.replaceAll('_', ' ')}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
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
          <p className="text-xs truncate mb-2" style={{ color: '#888888' }}>{user?.email}</p>
          <button onClick={signOut} className="text-xs transition-colors" style={{ color: '#888888' }}
            onMouseEnter={e => e.target.style.color = '#D4AF37'}
            onMouseLeave={e => e.target.style.color = '#888888'}>
            Sign out
          </button>
          {/* Luck seal — right aligned */}
          <div className="flex justify-end mt-3">
            <span className="font-brand text-xs" style={{ color: '#D4AF37', opacity: 0.5 }}>RC77558</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#F5F5F5' }}>
        {children}
      </main>
    </div>
  )
}
