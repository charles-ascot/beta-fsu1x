/**
 * Admin page: create, list and revoke FSU consumer API keys.
 * Requires the admin key — entered once per session, held in component state only.
 */
import React, { useState } from 'react'
import { listApiKeys, createApiKey, revokeApiKey } from '../services/api'

export default function KeyManager() {
  const [adminKey, setAdminKey]   = useState('')
  const [authed, setAuthed]       = useState(false)
  const [keys, setKeys]           = useState([])
  const [newName, setNewName]     = useState('')
  const [created, setCreated]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const load = async (key) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listApiKeys(key)
      setKeys(data.keys)
      setAuthed(true)
    } catch {
      setError('Invalid admin key or backend unreachable.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await createApiKey(adminKey, newName.trim())
      setCreated(data)
      setNewName('')
      await load(adminKey)
    } catch {
      setError('Failed to create key.')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (keyId) => {
    if (!confirm('Revoke this key? This cannot be undone.')) return
    setLoading(true)
    try {
      await revokeApiKey(adminKey, keyId)
      await load(adminKey)
    } catch {
      setError('Failed to revoke key.')
    } finally {
      setLoading(false)
    }
  }

  if (!authed) {
    return (
      <div className="max-w-md mx-auto mt-20 space-y-4">
        <h2 className="text-lg font-semibold text-white">Key Manager — Admin Access</h2>
        <p className="text-sm text-slate-400">
          Enter the admin key set in your Cloud Run environment to manage FSU consumer keys.
        </p>
        <input
          type="password"
          placeholder="X-Admin-Key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(adminKey)}
          className="w-full bg-chimera-800 border border-chimera-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-chimera-accent"
        />
        {error && <p className="text-chimera-red text-sm">{error}</p>}
        <button
          onClick={() => load(adminKey)}
          disabled={loading}
          className="w-full bg-chimera-accent hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">FSU-1X API Keys</h2>
        <button
          onClick={() => { setAuthed(false); setKeys([]); setCreated(null) }}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Disconnect
        </button>
      </div>

      {/* Create new key */}
      <div className="bg-chimera-800 rounded-xl p-5 space-y-3">
        <p className="text-sm font-medium text-slate-300">Create new consumer key</p>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Key name (e.g. mark-dashboard)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="flex-1 bg-chimera-700 border border-chimera-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-chimera-accent"
          />
          <button
            onClick={handleCreate}
            disabled={loading || !newName.trim()}
            className="bg-chimera-accent hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            Generate
          </button>
        </div>

        {/* Show newly created key — one time only */}
        {created && (
          <div className="bg-chimera-900 border border-chimera-green rounded-lg p-4 space-y-1">
            <p className="text-xs text-chimera-green font-medium">
              Key created — copy now, it will not be shown again in full
            </p>
            <code className="text-sm text-white break-all">{created.key}</code>
          </div>
        )}
      </div>

      {error && <p className="text-chimera-red text-sm">{error}</p>}

      {/* Keys table */}
      <div className="bg-chimera-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-chimera-700 text-xs text-slate-500 uppercase">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Key (prefix)</th>
              <th className="text-left px-4 py-3">Calls</th>
              <th className="text-left px-4 py-3">Last used</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.key_id} className="border-b border-chimera-700 last:border-0">
                <td className="px-4 py-3 text-slate-200">{k.name}</td>
                <td className="px-4 py-3 font-mono text-slate-400">
                  {k.key?.slice(0, 20)}…
                </td>
                <td className="px-4 py-3 text-slate-400">{k.call_count ?? 0}</td>
                <td className="px-4 py-3 text-slate-400">
                  {k.last_used_at
                    ? new Date(k.last_used_at * 1000).toLocaleString()
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      k.is_active
                        ? 'bg-green-900 text-chimera-green'
                        : 'bg-red-900 text-chimera-red'
                    }`}
                  >
                    {k.is_active ? 'active' : 'revoked'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {k.is_active && (
                    <button
                      onClick={() => handleRevoke(k.key_id)}
                      className="text-xs text-chimera-red hover:text-red-400 transition-colors"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                  No keys yet — create one above
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
