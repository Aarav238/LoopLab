import axios from 'axios'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''
const BASE = `${BACKEND}/api/v1`

// ngrok free tier returns an interstitial HTML page without CORS headers unless this header is set.
const api = axios.create(
  BACKEND.includes('ngrok')
    ? { headers: { 'ngrok-skip-browser-warning': 'true' } }
    : {}
)

export const createExperiment = (data) =>
  api.post(`${BASE}/experiments`, data)

export const getExperiments = () => api.get(`${BASE}/experiments`)

export const getExperiment = (id) =>
  api.get(`${BASE}/experiments/${id}`)

export const deleteExperiment = (id) =>
  api.delete(`${BASE}/experiments/${id}`)
