import { useState, useEffect } from 'react'

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'] as const
const MISSION_START = Date.UTC(2026, 1, 28, 0, 0, 0) // Feb 28, 2026 00:00:00 UTC

function pad(n: number) { return String(n).padStart(2, '0') }

function formatZulu(now: Date): string {
  const d = now.getUTCDate()
  const mon = MONTHS[now.getUTCMonth()]
  const y = now.getUTCFullYear()
  const h = pad(now.getUTCHours())
  const m = pad(now.getUTCMinutes())
  const s = pad(now.getUTCSeconds())
  return `${String(d).padStart(2, '0')} ${mon} ${y} · ${h}:${m}:${s}Z`
}

function formatElapsed(now: Date): string {
  let diff = Math.max(0, Math.floor((now.getTime() - MISSION_START) / 1000))
  const days = Math.floor(diff / 86400); diff %= 86400
  const hrs  = Math.floor(diff / 3600);  diff %= 3600
  const mins = Math.floor(diff / 60)
  const secs = diff % 60
  return `T+${days}D ${pad(hrs)}H ${pad(mins)}M ${pad(secs)}S`
}

export function useUtcClock(): { zulu: string; elapsed: string } {
  const [state, setState] = useState(() => {
    const now = new Date()
    return { zulu: formatZulu(now), elapsed: formatElapsed(now) }
  })

  useEffect(() => {
    function tick() {
      const now = new Date()
      setState({ zulu: formatZulu(now), elapsed: formatElapsed(now) })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return state
}
