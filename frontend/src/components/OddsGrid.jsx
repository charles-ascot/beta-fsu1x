/**
 * OddsGrid — one card per event.
 * Shows a bookmaker × outcome matrix.
 * Best price per outcome highlighted in green.
 * Overround % shown per bookmaker.
 */
import React, { useMemo, useState } from 'react'

function calcOverround(outcomes) {
  const sum = outcomes.reduce((acc, o) => acc + (o.price > 0 ? 1 / o.price : 0), 0)
  return (sum * 100).toFixed(1)
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function OddsGrid({ event }) {
  const [showLay, setShowLay] = useState(false)

  const { bookmakers, outcomes, bestPrices, backBooks, layBooks } = useMemo(() => {
    const all = event.bookmakers ?? []

    // Separate back and lay bookmakers
    const backBooks = all.filter((b) =>
      b.markets?.some((m) => m.key === 'h2h')
    )
    const layBooks = all.filter((b) =>
      b.markets?.some((m) => m.key === 'h2h_lay')
    )

    const active = showLay ? layBooks : backBooks
    const mkey   = showLay ? 'h2h_lay' : 'h2h'

    // Build unique outcome names
    const outcomeSet = new Set()
    active.forEach((b) => {
      const m = b.markets?.find((m) => m.key === mkey)
      m?.outcomes?.forEach((o) => outcomeSet.add(o.name))
    })
    const outcomes = [...outcomeSet]

    // Best price per outcome across all bookmakers
    const bestPrices = {}
    outcomes.forEach((name) => {
      let best = 0
      active.forEach((b) => {
        const m = b.markets?.find((m) => m.key === mkey)
        const o = m?.outcomes?.find((o) => o.name === name)
        if (o && o.price > best) best = o.price
      })
      bestPrices[name] = best
    })

    return { bookmakers: active, outcomes, bestPrices, backBooks, layBooks }
  }, [event, showLay])

  const isLive = new Date(event.commence_time) < new Date()

  return (
    <div className="bg-chimera-800 rounded-xl overflow-hidden">
      {/* Event header */}
      <div className="px-4 py-3 border-b border-chimera-700 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="text-xs bg-red-900 text-chimera-red px-2 py-0.5 rounded-full font-medium animate-pulse">
                LIVE
              </span>
            )}
            <span className="font-medium text-white text-sm">
              {event.home_team} vs {event.away_team}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{formatTime(event.commence_time)}</p>
        </div>

        {/* Back / Lay toggle */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-chimera-900 rounded-lg p-1">
            <button
              onClick={() => setShowLay(false)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                !showLay ? 'bg-chimera-accent text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Back ({backBooks.length})
            </button>
            {layBooks.length > 0 && (
              <button
                onClick={() => setShowLay(true)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  showLay ? 'bg-chimera-amber text-chimera-900' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lay ({layBooks.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Odds table */}
      {bookmakers.length === 0 ? (
        <p className="px-4 py-6 text-xs text-slate-500 text-center">
          No {showLay ? 'lay' : 'back'} odds available
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-chimera-700">
                <th className="text-left px-4 py-2 font-medium">Bookmaker</th>
                {outcomes.map((o) => (
                  <th key={o} className="text-center px-4 py-2 font-medium">{o}</th>
                ))}
                <th className="text-center px-4 py-2 font-medium">Overround</th>
                <th className="text-left px-4 py-2 font-medium text-xs">Updated</th>
              </tr>
            </thead>
            <tbody>
              {bookmakers.map((b, bi) => {
                const mkey = showLay ? 'h2h_lay' : 'h2h'
                const market = b.markets?.find((m) => m.key === mkey)
                const rowOutcomes = outcomes.map((name) =>
                  market?.outcomes?.find((o) => o.name === name)
                )
                const overround = market ? calcOverround(market.outcomes ?? []) : '—'

                return (
                  <tr
                    key={b.key}
                    className={`border-b border-chimera-700 last:border-0 ${
                      bi % 2 === 0 ? '' : 'bg-chimera-900/30'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap font-medium">
                      {b.title}
                    </td>
                    {rowOutcomes.map((o, i) => {
                      const isBest = o && o.price === bestPrices[outcomes[i]]
                      return (
                        <td key={i} className="px-4 py-2.5 text-center">
                          {o ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                                isBest
                                  ? 'bg-green-900 text-chimera-green'
                                  : 'text-slate-300'
                              }`}
                            >
                              {o.price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`text-xs font-mono ${
                          parseFloat(overround) < 105
                            ? 'text-chimera-green'
                            : parseFloat(overround) < 115
                            ? 'text-chimera-amber'
                            : 'text-chimera-red'
                        }`}
                      >
                        {overround}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 whitespace-nowrap">
                      {b.last_update
                        ? new Date(b.last_update).toLocaleTimeString()
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
