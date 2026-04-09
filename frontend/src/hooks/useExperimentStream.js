import { useState, useEffect, useRef } from 'react'

export function useExperimentStream(experimentId) {
  const [steps, setSteps] = useState([])
  const [status, setStatus] = useState('pending')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [suggestion, setSuggestion] = useState(null)
  const wsRef = useRef(null)
  const terminalRef = useRef(false)

  useEffect(() => {
    if (!experimentId) return

    terminalRef.current = false

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/experiments/${experimentId}/stream`
    )
    wsRef.current = ws

    ws.onmessage = (e) => {
      const event = JSON.parse(e.data)

      if (event.event === 'heartbeat') return

      if (event.progress !== undefined && event.progress !== null) {
        setProgress(event.progress)
      }

      if (event.event === 'step_started') {
        setSteps((prev) => {
          const exists = prev.find((s) => s.step_name === event.step_name)
          if (exists) {
            return prev.map((s) =>
              s.step_name === event.step_name
                ? { ...s, status: 'running' }
                : s
            )
          }
          return [...prev, { step_name: event.step_name, status: 'running', output: {} }]
        })
        setStatus('running')
      }

      if (event.event === 'step_completed') {
        setSteps((prev) => {
          const exists = prev.find((s) => s.step_name === event.step_name)
          if (exists) {
            return prev.map((s) =>
              s.step_name === event.step_name
                ? { ...s, status: 'completed', output: event.data || {} }
                : s
            )
          }
          return [
            ...prev,
            { step_name: event.step_name, status: 'completed', output: event.data || {} },
          ]
        })
      }

      if (event.event === 'experiment_completed') {
        setResult(event.data)
        setStatus('completed')
        terminalRef.current = true
      }

      if (event.event === 'ai_suggestion_ready') {
        setSuggestion(event.data)
        setProgress(100)
        setStatus('completed')
        terminalRef.current = true
      }

      if (event.event === 'failed') {
        setStatus('failed')
        terminalRef.current = true
      }
    }

    ws.onerror = () => {
      if (!terminalRef.current) {
        setStatus('failed')
      }
    }

    return () => {
      ws.close()
    }
  }, [experimentId])

  return { steps, status, progress, result, suggestion }
}
