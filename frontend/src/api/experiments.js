import axios from 'axios'

// Production (Vercel): leave VITE_BACKEND_URL unset → same-origin /api → serverless proxy (no CORS).
// Local dev: VITE_BACKEND_URL=http://localhost:8000
const BACKEND = import.meta.env.VITE_BACKEND_URL || ''
const BASE = BACKEND ? `${BACKEND}/api/v1` : '/api/v1'

const api = axios.create()

export const createExperiment = (data) =>
  api.post(`${BASE}/experiments`, data)

export const getExperiments = () => api.get(`${BASE}/experiments`)

export const getExperiment = (id) =>
  api.get(`${BASE}/experiments/${id}`)

export const deleteExperiment = (id) =>
  api.delete(`${BASE}/experiments/${id}`)
