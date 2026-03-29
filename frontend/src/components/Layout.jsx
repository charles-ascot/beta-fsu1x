import { Outlet, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../services/api'

const navItems = [
  { to: '/dashboard', label: 'Dashboard',     icon: '⬛' },
  { to: '/odds',      label: 'Odds Explorer', icon: '📊' },
  { to: '/scores',    label: 'Scores',        icon: '🏁' },
  { to: '/keys',      label: 'API Keys',      icon: '🔑' },
]

export default function Layout() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  })

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-800">
          <div className="text-blue-400 font-semibold text-sm tracking-wide">CHIMERA</div>
          <div className="text-slate-500 text-xs mt-0.5 mono">FSU-1X · The Odds API</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Status footer */}
        <div className="px-4 py-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                health ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-xs text-slate-500">
              {health ? 'Backend online' : 'Backend offline'}
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-1 mono">v1.0.0</div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <Outlet />
      </main>
    </div>
  )
}
