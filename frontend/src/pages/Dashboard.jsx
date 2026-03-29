/**
 * Main odds dashboard.
 * Sport selector → bookmaker odds grid for every event.
 * Highlights best back price per outcome. Shows overround per bookmaker.
 */
import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSports, getOdds } from '../services/api'
import QuotaBar from '../components/QuotaBar'
import OddsGrid from '../components/OddsGrid'
import SportSelector from '../components/SportSelector'

const REGIONS = ['uk', 'eu', 'us', 'au']
const DEFAULT_REGION = 'uk'
const REFRESH_MS = 60_000

export default function Dashboard() {
  const [sport, setSport]   = useState(null)
  const [region, setRegion] = useState(DEFAULT_REGION)

  // Sports list
  const { data: sportsData, isLoading: sportsLoading } = useQuery({
    queryKey: ['sports'],
    queryFn:  () => getSports(false),
  })

  const sports = useMemo(
    () => sportsData?.data ?? [],
    [sportsData]
  )

  // Odds for selected sport — auto-refreshes
  const {
    data: oddsData,
    isLoading: oddsLoading,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey:  ['odds', sport, region],
    queryFn:   () => getOdds(sport, { regions: region, markets: 'h2h', oddsFormat: 'decimal' }),
    enabled:   !!sport,
    refetchInterval: REFRESH_MS,
  })

  const events = useMemo(() => oddsData?.data ?? [], [oddsData])
  const quota  = oddsData?.quota ?? null
  const cache  = oddsData?.cache ?? null

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <SportSelector
          sports={sports}
          loading={sportsLoading}
          value={sport}
          onChange={setSport}
        />

        {/* Region picker */}
        <div className="flex gap-1 bg-chimera-800 rounded-lg p-1">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors uppercase ${
                region === r
                  ? 'bg-chimera-accent text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Status */}
        {sport && (
          <div className="flex items-center gap-2 text-xs text-slate-500 ml-auto">
            {isFetching && (
              <div className="w-2 h-2 rounded-full bg-chimera-amber animate-pulse" />
            )}
            {cache && (
              <span
                className={cache === 'HIT' ? 'text-chimera-green' : 'text-chimera-amber'}
              >
                cache {cache}
              </span>
            )}
            {dataUpdatedAt > 0 && (
              <span>
                updated {new Date(dataUpdatedAt).toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quota bar */}
      {quota && <QuotaBar quota={quota} />}

      {/* Odds grid */}
      {!sport && (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
          Select a sport to load odds
        </div>
      )}

      {sport && oddsLoading && (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
          Loading odds…
        </div>
      )}

      {sport && !oddsLoading && events.length === 0 && (
        <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
          No events available for this sport right now
        </div>
      )}

      {events.map((event) => (
        <OddsGrid key={event.id} event={event} />
      ))}
    </div>
  )
}
