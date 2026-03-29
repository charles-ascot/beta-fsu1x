import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSports, getHealth } from './services/api'
import Dashboard from './pages/Dashboard'
import KeyManager from './pages/KeyManager'

const NAV = ['Dashboard', 'Key Manager']

export default function App() {
  const [page, setPage] = useState('Dashboard')

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 30_000,
  })

  return (
    <div className="min-h-screen bg-chimera-900 text-slate-200">
      {/* Top bar */}
      <header className="bg-chimera-800 border-b border-chimera-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-chimera-green animate-pulse" />
          <span className="font-semibold tracking-wide text-white">
            Chimera <span className="text-chimera-accent">FSU-1X</span>
          </span>
          <span className="text-chimera-600 text-sm">— The Odds API</span>
        </div>
        <div className="flex items-center gap-6">
          {NAV.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`text-sm font-medium transition-colors ${
                page === n
                  ? 'text-chimera-accent'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {n}
            </button>
          ))}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                health ? 'bg-chimera-green' : 'bg-chimera-red'
              }`}
            />
            {health ? 'API online' : 'API offline'}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="p-6">
        {page === 'Dashboard' && <Dashboard />}
        {page === 'Key Manager' && <KeyManager />}
      </main>
    </div>
  )
}
