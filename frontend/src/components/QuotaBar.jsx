import React from 'react'

export default function QuotaBar({ quota }) {
  if (!quota?.remaining) return null
  const total = (quota.remaining ?? 0) + (quota.used ?? 0)
  const pct   = total > 0 ? Math.round((quota.remaining / total) * 100) : 0
  const color = pct > 50 ? 'bg-chimera-green' : pct > 20 ? 'bg-chimera-amber' : 'bg-chimera-red'

  return (
    <div className="flex items-center gap-4 bg-chimera-800 rounded-lg px-4 py-2">
      <span className="text-xs text-slate-500 whitespace-nowrap">Odds API quota</span>
      <div className="flex-1 h-1.5 bg-chimera-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 whitespace-nowrap">
        {quota.remaining?.toLocaleString()} remaining
        {quota.lastCost != null && (
          <span className="text-slate-600"> · last call cost {quota.lastCost}</span>
        )}
      </span>
    </div>
  )
}
