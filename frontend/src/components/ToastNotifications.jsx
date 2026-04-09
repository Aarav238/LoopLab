import { useNavigate } from 'react-router-dom'
import { useTracker } from '../context/ExperimentTracker'

export default function ToastNotifications() {
  const { notifications, dismissNotification } = useTracker()
  const navigate = useNavigate()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {notifications.map((notif, i) => {
        const isSuccess = notif.type === 'success'
        return (
          <div
            key={notif.id}
            className={`animate-slide-right group relative bg-[var(--surface-1)] border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
              isSuccess
                ? 'border-emerald-500/30 hover:border-emerald-500/50'
                : 'border-red-500/30 hover:border-red-500/50'
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
            onClick={() => {
              dismissNotification(notif.id)
              navigate(`/experiment/${notif.experimentId}`)
            }}
          >
            {/* Top accent line */}
            <div className={`h-[2px] ${
              isSuccess
                ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
                : 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
            }`} />

            <div className="p-4 flex items-start gap-3">
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isSuccess
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}>
                {isSuccess ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M11 4L5.5 10L3 7.5" stroke="var(--emerald)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 4V7.5M7 10H7.005" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-mono-lab text-[10px] tracking-wider font-semibold uppercase ${
                  isSuccess ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {isSuccess ? 'EXPERIMENT COMPLETE' : 'EXPERIMENT FAILED'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  {notif.goal}
                </p>
                <p className="font-mono-lab text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
                  {isSuccess ? (
                    <>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 5L7 5M5.5 3L7.5 5L5.5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Click to view results
                    </>
                  ) : (
                    'Click for details'
                  )}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  dismissNotification(notif.id)
                }}
                className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="h-[2px] bg-[var(--surface-2)]">
              <div
                className={`h-full ${isSuccess ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}
                style={{
                  animation: 'toast-countdown 8s linear forwards',
                  width: '100%',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
