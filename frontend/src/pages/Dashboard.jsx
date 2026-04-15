import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getExperiments, createExperiment, deleteExperiment } from '../api/experiments'
import { useTracker } from '../context/ExperimentTracker'

const STATUS_MAP = {
  pending: { color: 'bg-slate-500', ring: 'ring-slate-500/20', text: 'text-slate-400', label: 'IDLE' },
  running: { color: 'bg-amber-400', ring: 'ring-amber-400/30', text: 'text-amber-400', label: 'ACTIVE' },
  completed: { color: 'bg-emerald-400', ring: 'ring-emerald-400/20', text: 'text-emerald-400', label: 'DONE' },
  failed: { color: 'bg-red-500', ring: 'ring-red-500/20', text: 'text-red-400', label: 'FAIL' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export default function Dashboard() {
  const [experiments, setExperiments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [goal, setGoal] = useState('')
  const [params, setParams] = useState([{ key: 'temperature', value: '220' }])
  const [constraints, setConstraints] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { trackExperiment } = useTracker()

  const fetchExperiments = useCallback(async () => {
    try {
      const res = await getExperiments()
      const data = res.data
      // Proxy/network errors may return { error: "..." } instead of a list
      setExperiments(Array.isArray(data) ? data : [])
      if (!Array.isArray(data)) {
        console.warn('getExperiments: expected an array', data)
      }
    } catch (err) {
      console.error('Failed to fetch experiments', err)
    }
  }, [])

  useEffect(() => {
    fetchExperiments()
    const interval = setInterval(fetchExperiments, 5000)
    return () => clearInterval(interval)
  }, [fetchExperiments])

  const addParam = () => setParams([...params, { key: '', value: '' }])
  const removeParam = (i) => setParams(params.filter((_, idx) => idx !== i))
  const updateParam = (i, field, val) =>
    setParams(params.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const parameters = {}
      params.forEach((p) => {
        if (p.key.trim()) parameters[p.key.trim()] = parseFloat(p.value) || 0
      })
      const constraintList = constraints.split(',').map((c) => c.trim()).filter(Boolean)
      const res = await createExperiment({ goal, parameters, constraints: constraintList })
      trackExperiment(res.data.experiment_id, goal)
      setShowModal(false)
      setGoal('')
      setParams([{ key: 'temperature', value: '220' }])
      setConstraints('')
      navigate(`/experiment/${res.data.experiment_id}`)
    } catch (err) {
      console.error('Failed to create experiment', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await deleteExperiment(id)
      setExperiments((prev) => prev.filter((exp) => exp.id !== id))
    } catch (err) {
      console.error('Failed to delete experiment', err)
    }
  }

  useEffect(() => {
    const handler = (e) => {
      const { goal: g, parameters, constraints: c } = e.detail
      setGoal(g || '')
      if (parameters) {
        setParams(Object.entries(parameters).map(([key, value]) => ({ key, value: String(value) })))
      }
      setConstraints(c ? c.join(', ') : '')
      setShowModal(true)
    }
    window.addEventListener('open-new-run', handler)
    return () => window.removeEventListener('open-new-run', handler)
  }, [])

  const runningCount = experiments.filter((e) => e.status === 'running').length

  return (
    <div className="min-h-screen relative">
      {/* Atmospheric gradient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[radial-gradient(ellipse,_rgba(0,240,255,0.04)_0%,_transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] rounded-full bg-[radial-gradient(ellipse,_rgba(52,211,153,0.03)_0%,_transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="relative border-b border-[var(--border)] px-8 py-5 scanline-overlay">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            {/* Logo mark */}
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-[var(--cyan)] opacity-10" />
              <div className="absolute inset-[3px] rounded-md border border-[var(--cyan)] opacity-40" />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="relative z-10">
                <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="var(--cyan)" strokeWidth="1.5" fill="none"/>
                <circle cx="8" cy="8" r="2" fill="var(--cyan)" opacity="0.8"/>
              </svg>
            </div>
            <div>
              <h1 className="font-mono-lab text-lg font-semibold text-[var(--text-primary)] tracking-tight">
                LoopLab
              </h1>
              <p className="font-mono-lab text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
                Materials Discovery Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {runningCount > 0 && (
              <div className="flex items-center gap-2 font-mono-lab text-xs text-amber-400 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot" />
                {runningCount} active
              </div>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="group relative font-mono-lab text-sm font-medium text-[var(--surface-0)] bg-[var(--cyan)] px-5 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_var(--cyan-dim)] active:scale-[0.97]"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                NEW RUN
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-5xl mx-auto px-8 py-10">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6 animate-slide-up">
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
          <span className="font-mono-lab text-[11px] tracking-[0.2em] uppercase text-[var(--text-muted)]">
            Experiment Log
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-[var(--border)] to-transparent" />
        </div>

        {experiments.length === 0 && (
          <div className="animate-slide-up delay-2 text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-dashed border-[var(--border-bright)] mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--text-muted)]">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="font-mono-lab text-sm text-[var(--text-muted)]">
              No experiments yet
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 opacity-60">
              Start a new run to begin materials discovery
            </p>
          </div>
        )}

        {/* Experiment Cards */}
        <div className="space-y-2">
          {experiments.map((exp, i) => {
            const st = STATUS_MAP[exp.status] || STATUS_MAP.pending
            return (
              <div
                key={exp.id}
                onClick={() => navigate(`/experiment/${exp.id}`)}
                className={`animate-slide-up delay-${Math.min(i + 1, 8)} group relative bg-[var(--surface-1)] border border-[var(--border)] rounded-xl p-5 cursor-pointer transition-all duration-300 hover:border-[var(--border-bright)] hover:bg-[var(--surface-2)] ${
                  exp.status === 'running' ? 'glow-border-cyan' : ''
                }`}
              >
                {/* Running indicator line */}
                {exp.status === 'running' && (
                  <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl overflow-hidden">
                    <div className="data-stream-bar h-full w-1/2 animate-progress-indeterminate" />
                  </div>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Goal */}
                    <p className="text-[var(--text-primary)] font-medium text-[15px] leading-snug truncate group-hover:text-white transition-colors">
                      {exp.goal}
                    </p>

                    {/* Metadata row */}
                    <div className="flex items-center gap-4 mt-2.5">
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 font-mono-lab text-[10px] tracking-wider font-semibold ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.color} ring-2 ${st.ring} ${
                          exp.status === 'running' ? 'animate-pulse-dot' : ''
                        }`} />
                        {st.label}
                      </span>

                      {/* Param count */}
                      <span className="font-mono-lab text-[11px] text-[var(--text-muted)]">
                        {Object.keys(exp.parameters || {}).length} params
                      </span>

                      {/* Params preview */}
                      <div className="hidden sm:flex items-center gap-2">
                        {Object.entries(exp.parameters || {}).slice(0, 3).map(([k, v]) => (
                          <span key={k} className="font-mono-lab text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
                            {k}={v}
                          </span>
                        ))}
                      </div>

                      {/* Time */}
                      <span className="font-mono-lab text-[11px] text-[var(--text-muted)] ml-auto">
                        {timeAgo(exp.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={(e) => handleDelete(e, exp.id)}
                      className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                    >
                      DELETE
                    </button>
                    <svg
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      className="text-[var(--text-muted)] group-hover:text-[var(--cyan)] group-hover:translate-x-0.5 transition-all duration-200"
                    >
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal content */}
          <div className="relative w-full max-w-lg bg-[var(--surface-1)] border border-[var(--border-bright)] rounded-2xl overflow-hidden animate-slide-up">
            {/* Cyan accent line at top */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-mono-lab text-base font-semibold text-[var(--text-primary)]">
                    New Experiment
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Define your materials discovery parameters
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Goal */}
                <div>
                  <label className="font-mono-lab text-[11px] tracking-wider uppercase text-[var(--text-muted)] block mb-1.5">
                    Objective
                  </label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Find polymer with thermal conductivity > 2 W/mK for EV battery application"
                    rows={2}
                    required
                    className="w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none transition-all"
                  />
                </div>

                {/* Parameters */}
                <div>
                  <label className="font-mono-lab text-[11px] tracking-wider uppercase text-[var(--text-muted)] block mb-1.5">
                    Parameters
                  </label>
                  <div className="space-y-2">
                    {params.map((p, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          value={p.key}
                          onChange={(e) => updateParam(i, 'key', e.target.value)}
                          placeholder="name"
                          className="flex-1 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono-lab text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all"
                        />
                        <input
                          value={p.value}
                          onChange={(e) => updateParam(i, 'value', e.target.value)}
                          placeholder="0.0"
                          type="number"
                          step="any"
                          className="w-28 bg-[var(--surface-0)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm font-mono-lab text-[var(--cyan)] placeholder-[var(--text-muted)] text-right transition-all"
                        />
                        {params.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeParam(i)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addParam}
                    className="mt-2 font-mono-lab text-[11px] tracking-wider text-[var(--cyan)] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    ADD PARAMETER
                  </button>
                </div>

                {/* Constraints */}
                <div>
                  <label className="font-mono-lab text-[11px] tracking-wider uppercase text-[var(--text-muted)] block mb-1.5">
                    Constraints
                  </label>
                  <input
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    placeholder="e.g. cost_per_kg < 80, non_toxic = true"
                    className="w-full bg-[var(--surface-0)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full relative font-mono-lab text-sm font-semibold tracking-wider text-[var(--surface-0)] bg-[var(--cyan)] py-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-[0_0_30px_var(--cyan-dim)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-[var(--surface-0)] border-t-transparent rounded-full animate-spin" />
                      INITIALIZING...
                    </span>
                  ) : (
                    'LAUNCH EXPERIMENT'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
