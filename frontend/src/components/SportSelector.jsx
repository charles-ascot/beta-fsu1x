import React, { useState, useMemo } from 'react'

const PRIORITY_GROUPS = ['Soccer', 'Horse Racing', 'Tennis', 'Cricket', 'American Football', 'Basketball']

export default function SportSelector({ sports, loading, value, onChange }) {
  const [search, setSearch] = useState('')

  const grouped = useMemo(() => {
    const filtered = sports.filter(
      (s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.group.toLowerCase().includes(search.toLowerCase())
    )
    const groups = {}
    filtered.forEach((s) => {
      if (!groups[s.group]) groups[s.group] = []
      groups[s.group].push(s)
    })
    // Sort groups with priority first
    return Object.entries(groups).sort(([a], [b]) => {
      const ai = PRIORITY_GROUPS.indexOf(a)
      const bi = PRIORITY_GROUPS.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
  }, [sports, search])

  const selected = sports.find((s) => s.key === value)

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-chimera-800 border border-chimera-700 rounded-lg px-3 py-2 min-w-64">
        <input
          type="text"
          placeholder={loading ? 'Loading sports…' : 'Search sports…'}
          value={search || (selected && !search ? selected.title : '')}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={(e) => { setSearch(''); e.target.select() }}
          className="bg-transparent text-sm text-slate-200 flex-1 focus:outline-none placeholder:text-slate-500"
        />
        {selected && !search && (
          <span className="text-xs text-slate-500 bg-chimera-700 px-2 py-0.5 rounded">
            {selected.group}
          </span>
        )}
      </div>

      {search && (
        <div className="absolute z-50 top-full mt-1 w-80 max-h-72 overflow-y-auto bg-chimera-800 border border-chimera-700 rounded-xl shadow-xl">
          {grouped.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-500">No sports found</p>
          )}
          {grouped.map(([group, items]) => (
            <div key={group}>
              <p className="px-4 pt-3 pb-1 text-xs text-slate-500 uppercase tracking-wide">
                {group}
              </p>
              {items.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { onChange(s.key); setSearch('') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-chimera-700 hover:text-white transition-colors"
                >
                  {s.title}
                  {!s.active && (
                    <span className="ml-2 text-xs text-slate-600">(off-season)</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
