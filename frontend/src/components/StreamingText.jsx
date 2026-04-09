import { useState, useEffect } from 'react'

export default function StreamingText({ text, speed = 12, onComplete }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!text) return
    setDisplayed('')
    setDone(false)
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
        onComplete?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed])

  return (
    <span className="streaming-text">
      {displayed}
      {!done && <span className="blinking-cursor" />}
    </span>
  )
}
