import { useNavigate } from 'react-router-dom'
import { useTracker } from '../context/ExperimentTracker'

export default function ProcessingBar() {
  const { activeExperiments } = useTracker()
  const navigate = useNavigate()

  if (activeExperiments.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] animate-slide-up">
      {/* Glass backdrop */}
      <div className="bg-[var(--surface-1)]/90 backdrop-blur-md border-t border-[var(--cyan-dim)]">
        {/* Top glow line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--cyan)] to-transparent opacity-40" />

        <div className="max-w-5xl mx-auto px-6 py-2.5">
          <div className="flex items-center gap-4">
            {/* Pulsing indicator */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-5 h-5 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[var(--cyan)] opacity-20 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-[var(--cyan)]" />
              </div>
              <span className="font-mono-lab text-[10px] tracking-[0.15em] uppercase text-[var(--cyan)] font-semibold">
                {activeExperiments.length} ACTIVE
              </span>
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-[var(--border)]" />

            {/* Experiment items — scrollable */}
            <div className="flex-1 overflow-x-auto flex items-center gap-3 scrollbar-none">
              {activeExperiments.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => navigate(`/experiment/${exp.id}`)}
                  className="shrink-0 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--cyan-dim)] transition-all cursor-pointer group"
                >
                  {/* Mini progress ring */}
                  <div className="relative w-6 h-6 shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" className="transform -rotate-90">
                      <circle
                        cx="12" cy="12" r="9"
                        fill="none"
                        stroke="var(--surface-0)"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx="12" cy="12" r="9"
                        fill="none"
                        stroke="var(--cyan)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 9}`}
                        strokeDashoffset={`${2 * Math.PI * 9 * (1 - (exp.progress || 0) / 100)}`}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono-lab text-[7px] font-bold text-[var(--cyan)]">
                      {exp.progress || 0}
                    </span>
                  </div>

                  {/* Goal text */}
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] text-[var(--text-primary)] truncate max-w-[180px] group-hover:text-white transition-colors">
                      {exp.goal}
                    </p>
                    <p className="font-mono-lab text-[9px] text-[var(--text-muted)]">
                      {exp.currentStep || 'Starting...'}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-[var(--text-muted)] group-hover:text-[var(--cyan)] transition-colors shrink-0">
                    <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
