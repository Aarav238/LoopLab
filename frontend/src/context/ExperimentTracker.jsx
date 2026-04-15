import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const TrackerContext = createContext(null)

export function useTracker() {
  return useContext(TrackerContext)
}

export function ExperimentTrackerProvider({ children }) {
  // { [id]: { id, goal, status, progress, ws } }
  const [tracked, setTracked] = useState({})
  const [notifications, setNotifications] = useState([])
  const wsRefs = useRef({})
  const terminalRefs = useRef({})
  const notifId = useRef(0)

  const addNotification = useCallback((notif) => {
    const id = ++notifId.current
    setNotifications((prev) => [...prev, { ...notif, id }])
    // Auto-dismiss after 8s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 8000)
    return id
  }, [])

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const trackExperiment = useCallback((experimentId, goal) => {
    // Don't double-track
    if (wsRefs.current[experimentId]) return

    setTracked((prev) => ({
      ...prev,
      [experimentId]: { id: experimentId, goal, status: 'running', progress: 0 },
    }))

    const wsBackend =
      import.meta.env.VITE_WS_URL || import.meta.env.VITE_BACKEND_URL
    let wsUrl
    if (wsBackend) {
      wsUrl = `${wsBackend.replace(/^http/, 'ws')}/ws/experiments/${experimentId}/stream`
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${protocol}//${window.location.host}/ws/experiments/${experimentId}/stream`
    }
    const ws = new WebSocket(wsUrl)
    wsRefs.current[experimentId] = ws

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data)
      if (event.event === 'heartbeat') return

      if (event.event === 'step_started' || event.event === 'step_completed') {
        setTracked((prev) => ({
          ...prev,
          [experimentId]: {
            ...prev[experimentId],
            progress: event.progress || prev[experimentId]?.progress || 0,
            currentStep: event.step_name,
          },
        }))
      }

      if (event.event === 'experiment_completed') {
        setTracked((prev) => ({
          ...prev,
          [experimentId]: { ...prev[experimentId], status: 'completed', progress: 95 },
        }))
      }

      if (event.event === 'ai_suggestion_ready') {
        terminalRefs.current[experimentId] = true
        setTracked((prev) => ({
          ...prev,
          [experimentId]: { ...prev[experimentId], status: 'completed', progress: 100 },
        }))
        addNotification({
          type: 'success',
          experimentId,
          goal: goal?.slice(0, 60) || 'Experiment',
          message: 'Pipeline complete — results ready',
        })
        ws.close()
        delete wsRefs.current[experimentId]
      }

      if (event.event === 'failed') {
        terminalRefs.current[experimentId] = true
        setTracked((prev) => ({
          ...prev,
          [experimentId]: { ...prev[experimentId], status: 'failed', progress: 0 },
        }))
        addNotification({
          type: 'error',
          experimentId,
          goal: goal?.slice(0, 60) || 'Experiment',
          message: 'Pipeline failed',
        })
        ws.close()
        delete wsRefs.current[experimentId]
      }
    }

    ws.onerror = () => {
      if (terminalRefs.current[experimentId]) return
      setTracked((prev) => ({
        ...prev,
        [experimentId]: { ...prev[experimentId], status: 'failed', progress: 0 },
      }))
    }
  }, [addNotification])

  const untrack = useCallback((experimentId) => {
    const ws = wsRefs.current[experimentId]
    if (ws) {
      ws.close()
      delete wsRefs.current[experimentId]
    }
    delete terminalRefs.current[experimentId]
    setTracked((prev) => {
      const next = { ...prev }
      delete next[experimentId]
      return next
    })
  }, [])

  // Clean up all WebSockets on unmount
  useEffect(() => {
    return () => {
      Object.values(wsRefs.current).forEach((ws) => ws.close())
    }
  }, [])

  const activeExperiments = Object.values(tracked).filter(
    (t) => t.status === 'running'
  )

  return (
    <TrackerContext.Provider
      value={{
        tracked,
        activeExperiments,
        notifications,
        trackExperiment,
        untrack,
        addNotification,
        dismissNotification,
      }}
    >
      {children}
    </TrackerContext.Provider>
  )
}
