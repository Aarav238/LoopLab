import axios from 'axios'

const BASE = '/api/v1'

export const createExperiment = (data) =>
  axios.post(`${BASE}/experiments`, data)

export const getExperiments = () =>
  axios.get(`${BASE}/experiments`)

export const getExperiment = (id) =>
  axios.get(`${BASE}/experiments/${id}`)

export const deleteExperiment = (id) =>
  axios.delete(`${BASE}/experiments/${id}`)
