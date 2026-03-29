/**
 * Axios instance for FSU-1X backend.
 * Reads VITE_API_BASE_URL and VITE_FSU_API_KEY from env.
 */
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'X-API-Key': import.meta.env.VITE_FSU_API_KEY || '',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// ── Quota tracker ───────────────────────────────────────────────────────────
let quotaState = { remaining: null, used: null, lastCost: null }

client.interceptors.response.use(
  (response) => {
    const h = response.headers
    if (h['x-requests-remaining']) {
      quotaState = {
        remaining: parseInt(h['x-requests-remaining'], 10),
        used:      parseInt(h['x-requests-used'], 10),
        lastCost:  parseInt(h['x-requests-last'], 10),
      }
    }
    return response
  },
  (error) => Promise.reject(error)
)

export const getQuota = () => ({ ...quotaState })

// ── API methods ─────────────────────────────────────────────────────────────

export const getSports = (all = false) =>
  client.get('/v1/sports', { params: { all } }).then((r) => r.data)

export const getOdds = (sport, params = {}) =>
  client.get(`/v1/odds/${sport}`, { params }).then((r) => r.data)

export const getEventOdds = (sport, eventId, params = {}) =>
  client.get(`/v1/odds/${sport}/${eventId}`, { params }).then((r) => r.data)

export const getEvents = (sport, params = {}) =>
  client.get(`/v1/events/${sport}`, { params }).then((r) => r.data)

export const getScores = (sport, params = {}) =>
  client.get(`/v1/scores/${sport}`, { params }).then((r) => r.data)

export const getHealth = () =>
  client.get('/health').then((r) => r.data)

// ── Admin API key management ─────────────────────────────────────────────────

export const adminClient = (adminKey) =>
  axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '',
    headers: {
      'X-Admin-Key': adminKey,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  })

export const listApiKeys = (adminKey) =>
  adminClient(adminKey).get('/v1/keys').then((r) => r.data)

export const createApiKey = (adminKey, name) =>
  adminClient(adminKey).post('/v1/keys', { name }).then((r) => r.data)

export const revokeApiKey = (adminKey, keyId) =>
  adminClient(adminKey).delete(`/v1/keys/${keyId}`).then((r) => r.data)
