import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getExperiment } from '../api/experiments'
import { useExperimentStream } from '../hooks/useExperimentStream'
import StreamingText from '../components/StreamingText'
import ExportResults from '../components/ExportResults'

const STEP_ORDER = ['Parameter Validation', 'Simulation', 'Analysis']

const STEP_ICONS = {
  'Parameter Validation': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 5L6.5 11.5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Simulation': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L5.5 5L8.5 8L11 3L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  'Analysis': (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 5V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

const STATUS_STYLES = {
  pending: {
    dot: 'bg-slate-600',
    border: 'border-[var(--border)]',
    bg: 'bg-[var(--surface-1)]',
    text: 'text-[var(--text-muted)]',
    label: 'WAITING',
    icon: 'text-[var(--text-muted)]',
  },
  running: {
    dot: 'bg-[var(--cyan)] animate-pulse-dot',
    border: 'glow-border-cyan',
    bg: 'bg-[var(--surface-1)]',
    text: 'text-[var(--cyan)]',
    label: 'PROCESSING',
    icon: 'text-[var(--cyan)]',
  },
  completed: {
    dot: 'bg-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-[var(--surface-1)]',
    text: 'text-emerald-400',
    label: 'COMPLETE',
    icon: 'text-emerald-400',
  },
  failed: {
    dot: 'bg-red-500',
    border: 'border-red-500/30',
    bg: 'bg-[var(--surface-1)]',
    text: 'text-red-400',
    label: 'FAILED',
    icon: 'text-red-400',
  },
}

function StepCard({ name, stepData, index }) {
  const status = stepData?.status || 'pending'
  const style = STATUS_STYLES[status]
  const output = stepData?.output || {}
  const isRunning = status === 'running'
  const isCompleted = status === 'completed'

  return (
    <div
      className={`animate-slide-up delay-${index + 1} relative ${style.bg} border ${style.border} rounded-xl p-5 transition-all duration-500`}
    >
      {/* Running shimmer line */}
      {isRunning && (
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl overflow-hidden">
          <div className="data-stream-bar h-full w-1/2 animate-progress-indeterminate" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Step number + icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
          isRunning ? 'border-[var(--cyan-dim)] bg-[var(--cyan)]/5' :
          isCompleted ? 'border-emerald-500/20 bg-emerald-500/5' :
          'border-[var(--border)] bg-[var(--surface-2)]'
        }`}>
          <span className={style.icon}>{STEP_ICONS[name]}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-mono-lab text-sm font-medium text-[var(--text-primary)]">{name}</h3>
              <span className={`font-mono-lab text-[9px] tracking-[0.15em] font-semibold ${style.text} px-1.5 py-0.5 rounded bg-[var(--surface-2)]`}>
                {style.label}
              </span>
            </div>
            {stepData?.duration_ms > 0 && (
              <span className="font-mono-lab text-[11px] text-[var(--text-muted)]">
                {(stepData.duration_ms / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
            {isRunning ? (
              <div className="data-stream-bar h-full w-1/2 animate-progress-indeterminate rounded-full" />
            ) : (
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isCompleted ? 'bg-emerald-400 w-full' :
                  status === 'failed' ? 'bg-red-500 w-full' : 'w-0'
                }`}
              />
            )}
          </div>

          {/* Output */}
          {isCompleted && Object.keys(output).length > 0 && (
            <div className="mt-3 animate-fade-in">
              {name === 'Parameter Validation' && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-mono-lab px-1.5 py-0.5 rounded ${
                    output.valid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {output.valid ? 'VALID' : 'INVALID'}
                  </span>
                  {output.warnings?.length > 0 && (
                    <span className="text-amber-400 font-mono-lab text-[11px]">
                      {output.warnings.join(', ')}
                    </span>
                  )}
                  {output.warnings?.length === 0 && (
                    <span className="text-[var(--text-muted)] font-mono-lab text-[11px]">no warnings</span>
                  )}
                </div>
              )}

              {name === 'Simulation' && output.candidates && (
                <div className="space-y-1.5">
                  {output.candidates.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 font-mono-lab text-[11px]">
                      <span className="text-[var(--text-secondary)] font-semibold w-16">{c.id}</span>
                      <span className="text-[var(--cyan)]">{c.thermal_conductivity} W/mK</span>
                      <span className="text-[var(--text-muted)]">stability: {c.stability_score}</span>
                      <span className="text-[var(--text-muted)]">${c.cost_per_kg}/kg</span>
                    </div>
                  ))}
                </div>
              )}

              {name === 'Analysis' && (
                <div className="flex flex-wrap items-center gap-3 font-mono-lab text-[11px]">
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-semibold">
                    {output.best_candidate}
                  </span>
                  <span className="text-[var(--cyan)]">
                    {output.best_thermal_conductivity} W/mK
                  </span>
                  <span className="text-emerald-400">
                    +{output.improvement_over_baseline_pct}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Running status text */}
          {isRunning && (
            <div className="mt-2 font-mono-lab text-[11px] text-[var(--cyan)] flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--cyan)] animate-pulse-dot" />
              {name === 'Parameter Validation' && 'Validating input parameters...'}
              {name === 'Simulation' && 'Generating material candidates...'}
              {name === 'Analysis' && 'Analyzing simulation results...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ExperimentView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [experiment, setExperiment] = useState(null)
  const { steps: liveSteps, status: liveStatus, progress: liveProgress, result: liveResult, suggestion: liveSuggestion } =
    useExperimentStream(id)
  const [showRationale, setShowRationale] = useState(false)

  useEffect(() => {
    getExperiment(id)
      .then((res) => setExperiment(res.data))
      .catch(console.error)
  }, [id])

  useEffect(() => {
    if (liveStatus === 'completed' || liveSuggestion) {
      getExperiment(id)
        .then((res) => setExperiment(res.data))
        .catch(console.error)
    }
  }, [liveStatus, liveSuggestion, id])

  if (!experiment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 font-mono-lab text-sm text-[var(--text-muted)]">
          <span className="w-4 h-4 border-2 border-[var(--cyan)] border-t-transparent rounded-full animate-spin" />
          Loading experiment...
        </div>
      </div>
    )
  }

  const mergedSteps = STEP_ORDER.map((name) => {
    const live = liveSteps.find((s) => s.step_name === name)
    const db = experiment.steps?.find((s) => s.step_name === name)
    return live || db || { step_name: name, status: 'pending', output: {} }
  })

  const status = liveStatus !== 'pending' ? liveStatus : experiment.status
  const finalResult = liveResult || experiment.final_result
  const suggestion = liveSuggestion || (Object.keys(experiment.ai_suggestion || {}).length > 0 ? experiment.ai_suggestion : null)

  const handleNextIteration = () => {
    if (!suggestion) return
    const newParams = {}
    suggestion.suggested_parameters?.forEach((p) => {
      newParams[p.name] = p.suggested_value
    })
    window.dispatchEvent(
      new CustomEvent('open-new-run', {
        detail: {
          goal: experiment.goal,
          parameters: newParams,
          constraints: experiment.constraints,
        },
      })
    )
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen relative">
      {/* Atmospheric gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[300px] rounded-full bg-[radial-gradient(ellipse,_rgba(0,240,255,0.03)_0%,_transparent_70%)]" />
        {status === 'completed' && (
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(ellipse,_rgba(52,211,153,0.04)_0%,_transparent_70%)]" />
        )}
      </div>

      {/* Header */}
      <header className="relative border-b border-[var(--border)] scanline-overlay">
        <div className="max-w-4xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="font-mono-lab text-[11px] tracking-wider text-[var(--text-muted)] hover:text-[var(--cyan)] transition-colors cursor-pointer flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8 3L3 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              BACK TO LOG
            </button>
            <ExportResults experiment={experiment} />
          </div>

          <h1 className="text-lg font-semibold text-[var(--text-primary)] leading-snug animate-slide-up">
            {experiment.goal}
          </h1>

          {/* Parameter chips */}
          <div className="flex flex-wrap items-center gap-2 mt-3 animate-slide-up delay-1">
            {Object.entries(experiment.parameters || {}).map(([k, v]) => (
              <span
                key={k}
                className="font-mono-lab text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)]"
              >
                <span className="text-[var(--text-muted)]">{k}</span>
                <span className="text-[var(--cyan)] ml-1.5">{v}</span>
              </span>
            ))}
            {experiment.constraints?.length > 0 && (
              <span className="relative group/constraints">
                <span className="font-mono-lab text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-400 cursor-default inline-flex items-center gap-1.5 transition-all duration-200 group-hover/constraints:bg-amber-500/10 group-hover/constraints:border-amber-400/40">
                  {experiment.constraints.length} constraint{experiment.constraints.length > 1 ? 's' : ''}
                </span>

                <div className="absolute bottom-full left-0 mb-2 z-50 opacity-0 invisible -translate-y-1 group-hover/constraints:opacity-100 group-hover/constraints:visible group-hover/constraints:translate-y-0 transition-all duration-200 ease-out pointer-events-none group-hover/constraints:pointer-events-auto">
                  <div className="w-max max-w-xs bg-[var(--surface-2)] border border-amber-500/20 rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
                    <div className="px-3 pt-2.5 pb-1">
                      <p className="font-mono-lab text-[9px] tracking-[0.15em] uppercase text-amber-400/70 font-semibold">
                        Constraints
                      </p>
                    </div>
                    <div className="px-3 pb-3 space-y-1">
                      {experiment.constraints.map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-[5px] w-1 h-1 rounded-full bg-amber-400/50 shrink-0" />
                          <span className="font-mono-lab text-[11px] text-[var(--text-secondary)] leading-snug">
                            {c}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </span>
            )}
          </div>

          {/* Overall progress bar */}
          {status === 'running' && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] uppercase">
                  Overall Progress
                </span>
                <span className="font-mono-lab text-xs text-[var(--cyan)] font-semibold">
                  {liveProgress}%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--cyan)] transition-all duration-700 ease-out"
                  style={{ width: `${liveProgress}%` }}
                />
              </div>
            </div>
          )}
          {status === 'completed' && (
            <div className="mt-4 animate-fade-in">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono-lab text-[10px] tracking-wider text-emerald-400 uppercase">
                  Complete
                </span>
                <span className="font-mono-lab text-xs text-emerald-400 font-semibold">
                  100%
                </span>
              </div>
              <div className="h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 w-full" />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-8 py-8 space-y-10">
        {/* Pipeline Section */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent" />
            <span className="font-mono-lab text-[10px] tracking-[0.2em] uppercase text-[var(--text-muted)]">
              Pipeline
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-[var(--border)] to-transparent" />
          </div>

          {/* Step connector + cards */}
          <div className="relative space-y-3">
            {/* Vertical connector line */}
            <div className="absolute left-[39px] top-10 bottom-10 w-px bg-gradient-to-b from-[var(--border)] via-[var(--border-bright)] to-[var(--border)]" />

            {mergedSteps.map((step, i) => (
              <StepCard key={step.step_name} name={step.step_name} stepData={step} index={i} />
            ))}
          </div>
        </section>

        {/* Result Section */}
        {finalResult && Object.keys(finalResult).length > 0 && (
          <section className="animate-slide-up delay-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
              <span className="font-mono-lab text-[10px] tracking-[0.2em] uppercase text-emerald-400">
                Result
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/20 to-transparent" />
            </div>

            <div className="glow-border-emerald bg-[var(--surface-1)] border rounded-xl p-6">
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] uppercase mb-1">
                    Best Candidate
                  </p>
                  <p className="font-mono-lab text-xl font-bold text-emerald-400">
                    {finalResult.best_candidate}
                  </p>
                </div>
                <div className="text-center border-x border-[var(--border)]">
                  <p className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] uppercase mb-1">
                    Conductivity
                  </p>
                  <p className="font-mono-lab text-xl font-bold text-[var(--cyan)]">
                    {finalResult.best_thermal_conductivity}
                    <span className="text-xs font-normal text-[var(--text-muted)] ml-1">W/mK</span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] uppercase mb-1">
                    Improvement
                  </p>
                  <p className="font-mono-lab text-xl font-bold text-emerald-400">
                    +{finalResult.improvement_over_baseline_pct}%
                  </p>
                </div>
              </div>

              {finalResult.recommendation && (
                <p className="text-sm text-[var(--text-secondary)] border-t border-[var(--border)] pt-3 italic">
                  {finalResult.recommendation}
                </p>
              )}
            </div>
          </section>
        )}

        {/* AI Suggestion Section — uses streaming-response pattern */}
        {suggestion && (
          <section className="animate-slide-up delay-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--cyan-dim)] to-transparent" />
              <span className="font-mono-lab text-[10px] tracking-[0.2em] uppercase text-[var(--cyan)]">
                AI Suggestion
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-[var(--cyan-dim)] to-transparent" />
            </div>

            <div className="glow-border-cyan bg-[var(--surface-1)] border rounded-xl overflow-hidden">
              {/* Reasoning header — streaming text effect */}
              <div className="p-5 border-b border-[var(--border)]">
                <p className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] uppercase mb-2">
                  Reasoning
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  <StreamingText text={suggestion.reasoning} speed={8} />
                </p>
              </div>

              {/* Parameter changes */}
              <div className="p-5 space-y-3">
                <p className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] uppercase mb-3">
                  Suggested Changes
                </p>

                {suggestion.suggested_parameters?.map((p, i) => (
                  <div
                    key={p.name}
                    className={`animate-slide-right delay-${i + 1} flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]`}
                  >
                    {/* Direction badge */}
                    <span className={`shrink-0 font-mono-lab text-[9px] tracking-wider font-bold px-2 py-1 rounded ${
                      p.change_direction === 'increase'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : p.change_direction === 'decrease'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {p.change_direction === 'increase' ? 'UP' : p.change_direction === 'decrease' ? 'DOWN' : 'HOLD'}
                    </span>

                    {/* Parameter name + values */}
                    <div className="flex-1 min-w-0">
                      <span className="font-mono-lab text-xs text-[var(--text-primary)] font-medium">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono-lab text-[11px] text-[var(--text-muted)]">{p.current_value}</span>
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" className="text-[var(--text-muted)] shrink-0">
                          <path d="M1 4H11M8 1L11 4L8 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-mono-lab text-[11px] text-[var(--cyan)] font-semibold">{p.suggested_value}</span>
                      </div>
                    </div>

                    {/* Impact */}
                    <span className="font-mono-lab text-[10px] text-[var(--text-muted)] text-right max-w-[200px] truncate">
                      {p.expected_impact}
                    </span>
                  </div>
                ))}

                {/* Metrics row */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[var(--border)]">
                  <div>
                    <p className="font-mono-lab text-[9px] tracking-wider text-[var(--text-muted)] uppercase">Expected</p>
                    <p className="font-mono-lab text-lg font-bold text-[var(--cyan)]">
                      +{suggestion.predicted_improvement_pct}%
                    </p>
                  </div>
                  <div>
                    <p className="font-mono-lab text-[9px] tracking-wider text-[var(--text-muted)] uppercase">Confidence</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono-lab text-lg font-bold text-[var(--text-primary)]">
                        {(suggestion.confidence * 100).toFixed(0)}%
                      </p>
                      {/* Mini confidence bar */}
                      <div className="w-16 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[var(--cyan)] transition-all duration-1000"
                          style={{ width: `${suggestion.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scientific rationale — collapsible with streaming text */}
                {suggestion.scientific_rationale && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowRationale(!showRationale)}
                      className="font-mono-lab text-[10px] tracking-wider text-[var(--text-muted)] hover:text-[var(--cyan)] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <svg
                        width="10" height="10" viewBox="0 0 10 10" fill="none"
                        className={`transition-transform duration-200 ${showRationale ? 'rotate-90' : ''}`}
                      >
                        <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      SCIENTIFIC RATIONALE
                    </button>
                    {showRationale && (
                      <div className="mt-2 pl-4 border-l-2 border-[var(--cyan-dim)] animate-fade-in">
                        <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">
                          <StreamingText text={suggestion.scientific_rationale} speed={6} />
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Next iteration CTA */}
                <button
                  onClick={handleNextIteration}
                  className="mt-5 w-full group relative font-mono-lab text-sm font-semibold tracking-wider text-[var(--surface-0)] bg-[var(--cyan)] py-3 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-[0_0_30px_var(--cyan-dim)] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    RUN NEXT ITERATION
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="group-hover:translate-x-1 transition-transform">
                      <path d="M1 7H13M10 4L13 7L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Failed state */}
        {status === 'failed' && (
          <div className="animate-slide-up bg-red-500/5 border border-red-500/20 rounded-xl p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-400">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="font-mono-lab text-sm text-red-400">Experiment failed</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Check the backend logs for details</p>
          </div>
        )}
      </main>
    </div>
  )
}
