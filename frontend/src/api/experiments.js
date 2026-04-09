import axios from 'axios'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''
const BASE = `${BACKEND}/api/v1`

export const createExperiment = (data) =>
  axios.post(`${BASE}/experiments`, data)

export const getExperiments = () =>
  axios.get(`${BASE}/experiments`)

export const getExperiment = (id) =>
  axios.get(`${BASE}/experiments/${id}`)

export const deleteExperiment = (id) =>
  axios.delete(`${BASE}/experiments/${id}`)
