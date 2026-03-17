import { useEffect, useRef } from 'react'
import type { TrackedObject } from '../hooks/useTracking'

// Color map per type
const COLORS: Record<string, { r: number; g: number; b: number }> = {
  aircraft: { r: 0, g: 212, b: 255 },   // cyan
  satellite: { r: 255, g: 215, b: 0 },   // gold
  maritime: { r: 255, g: 140, b: 0 },    // orange
}

export function useSonar(objects?: TrackedObject[]) {
  const ref = useRef<HTMLCanvasElement>(null)
  const objRef = useRef<TrackedObject[]>([])

  // Keep objects ref updated without re-triggering the animation loop
  useEffect(() => {
    objRef.current = objects || []
  }, [objects])

  useEffect(() => {
    const C = ref.current
    if (!C) return
    C.width = 140; C.height = 140
    const x = C.getContext('2d')
    if (!x) return
    const W = 140, cx = 70, cy = 70, R = 64
    let a = 0
    let raf: number

    // Map lat/lng to sonar coordinates (relative to Gulf center)
    function toSonar(lat: number, lng: number): { sx: number; sy: number; r: number } | null {
      const dlat = lat - 25, dlng = lng - 54
      const dist = Math.sqrt(dlat * dlat + dlng * dlng)
      if (dist > 10) return null // out of range
      const r = (dist / 10) * R * 0.9
      const angle = Math.atan2(dlat, dlng)
      return { sx: cx + r * Math.cos(angle), sy: cy - r * Math.sin(angle), r: dist }
    }

    function f() {
      if (!x) return
      x.clearRect(0, 0, W, W)

      // Background
      const base = x.createRadialGradient(cx, cy, 0, cx, cy, R)
      base.addColorStop(0, 'rgba(2,8,2,.98)')
      base.addColorStop(1, 'rgba(0,4,0,.99)')
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fillStyle = base; x.fill()

      // Rings
      ;[R * .25, R * .5, R * .75, R].forEach((r, i) => {
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2)
        x.strokeStyle = `rgba(196,255,44,${i === 3 ? .22 : .1})`; x.lineWidth = i === 3 ? 1 : .6; x.stroke()
      })

      // Crosshairs
      x.beginPath(); x.moveTo(cx - R, cy); x.lineTo(cx + R, cy)
      x.strokeStyle = 'rgba(196,255,44,.07)'; x.lineWidth = .6; x.stroke()
      x.beginPath(); x.moveTo(cx, cy - R); x.lineTo(cx, cy + R); x.stroke()
      x.setLineDash([3, 6])
      x.beginPath(); x.moveTo(cx - R * .7, cy - R * .7); x.lineTo(cx + R * .7, cy + R * .7)
      x.strokeStyle = 'rgba(196,255,44,.04)'; x.stroke()
      x.beginPath(); x.moveTo(cx + R * .7, cy - R * .7); x.lineTo(cx - R * .7, cy + R * .7); x.stroke()
      x.setLineDash([])

      // Sweep beam
      x.save(); x.translate(cx, cy)
      for (let i = 0; i < 22; i++) {
        const fa = a - i * .06
        x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, R, fa, fa + .1); x.closePath()
        x.fillStyle = `rgba(196,255,44,${(.28 - i * .012).toFixed(3)})`; x.fill()
      }
      x.restore()

      // Sweep line
      x.save(); x.translate(cx, cy)
      x.beginPath(); x.moveTo(0, 0); x.lineTo(R * Math.cos(a), R * Math.sin(a))
      x.strokeStyle = 'rgba(196,255,44,.55)'; x.lineWidth = 1.2; x.stroke()
      x.restore()

      // Plot tracked objects
      const objs = objRef.current
      objs.forEach(obj => {
        const pos = toSonar(obj.lat, obj.lng)
        if (!pos) return
        const col = COLORS[obj.type] || COLORS.aircraft

        // Sweep-activated brightness
        const objAngle = Math.atan2(pos.sy - cy, pos.sx - cx)
        const diff = ((a - objAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2)
        const alpha = diff < Math.PI * 1.5 ? Math.max(0.1, 0.95 - diff * 0.2) : 0.1

        x.beginPath()
        x.arc(pos.sx, pos.sy, obj.type === 'satellite' ? 2 : obj.type === 'maritime' ? 3 : 2.5, 0, Math.PI * 2)
        x.fillStyle = `rgba(${col.r},${col.g},${col.b},${alpha})`
        x.shadowColor = `rgba(${col.r},${col.g},${col.b},1)`
        x.shadowBlur = alpha > 0.5 ? 8 : 3
        x.fill()
        x.shadowBlur = 0
      })

      // Center dot
      x.beginPath(); x.arc(cx, cy, 2, 0, Math.PI * 2)
      x.fillStyle = 'rgba(196,255,44,.6)'; x.fill()

      a += .012
      raf = requestAnimationFrame(f)
    }
    f()
    return () => cancelAnimationFrame(raf)
  }, [])

  return ref
}
