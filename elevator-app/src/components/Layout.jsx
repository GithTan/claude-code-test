import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Customers', to: '/customers' },
  { label: 'Elevators', to: '/elevators' },
  { label: 'Maintenance', to: '/maintenance' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Invoices', to: '/invoices', adminOnly: true },
  { label: 'Projects', to: '/projects', adminOnly: true },
  { label: 'Reports', to: '/reports' },
]

export default function Layout({ children }) {
  const { user, role } = useAuth()

  const visibleItems = navItems.filter(item =>
    !item.adminOnly || role === 'admin'
  )

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="font-bold text-lg">Elevator App</h1>
          <p className="text-xs text-gray-400 mt-1 capitalize">
            {role?.replace('_', ' ')}
          </p>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate mb-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
