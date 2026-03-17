import { useState, useEffect } from 'react'
import type { TrackedObject } from './useTracking'

function formatAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 10) return 'NOW'
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m`
}

function formatAlt(obj: TrackedObject): string {
  if (!obj.alt) return ''
  if (obj.type === 'satellite') return `${Math.floor(obj.alt / 1000)}km`
  return `FL${Math.floor(obj.alt / 100)}`
}

function formatSpeed(obj: TrackedObject): string {
  if (!obj.speed) return ''
  if (obj.type === 'maritime') return `${obj.speed}kn`
  return `${obj.speed}kt`
}

export function useSignalMonitor(objects?: TrackedObject[]) {
  const [tickerIdx, setTickerIdx] = useState(0)
  const [signalStrength, setSignalStrength] = useState(91)

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerIdx(i => i + 1)
      setSignalStrength(78 + Math.floor(Math.random() * 18))
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  const objs = objects || []
  const current = objs.length > 0 ? objs[tickerIdx % objs.length] : null

  const msg = current
    ? `${current.callsign} · ${current.type.toUpperCase()} · ${formatAlt(current)} ${formatSpeed(current)} · ${formatAgo(current.lastSeen)}`
    : 'NO TRACKING DATA'

  const freq = current
    ? `${(4 + Math.random() * 12).toFixed(3)} kHz`
    : '0.000 kHz'

  const typeLabel = current
    ? { aircraft: '✈ AIR', satellite: '◉ SAT', maritime: '⚓ MAR' }[current.type]
    : '—'

  return {
    msg,
    freq,
    sigVal: signalStrength,
    sigWidth: signalStrength,
    typeLabel,
    currentObject: current,
    totalTracked: objs.length,
  }
}
