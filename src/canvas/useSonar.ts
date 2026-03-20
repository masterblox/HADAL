import { useEffect, useRef } from 'react'
import type { TrackedObject } from '../hooks/useTracking'

const COLORS: Record<string, { r: number; g: number; b: number }> = {
  aircraft: { r: 0, g: 212, b: 255 },
  satellite: { r: 255, g: 215, b: 0 },
  maritime: { r: 255, g: 140, b: 0 },
}

export function useSonar(objects?: TrackedObject[]) {
  const ref = useRef<HTMLCanvasElement>(null)
  const objRef = useRef<TrackedObject[]>([])
  const drawnRef = useRef(false)

  useEffect(() => {
    objRef.current = objects || []
    drawnRef.current = false // re-draw on data change
  }, [objects])

  useEffect(() => {
    const C = ref.current
    if (!C) return
    C.width = 140; C.height = 140
    const x = C.getContext('2d')
    if (!x) return
    const W = 140, cx = 70, cy = 70, R = 64

    function toSonar(lat: number, lng: number): { sx: number; sy: number } | null {
      const dlat = lat - 25, dlng = lng - 54
      const dist = Math.sqrt(dlat * dlat + dlng * dlng)
      if (dist > 10) return null
      const r = (dist / 10) * R * 0.9
      const angle = Math.atan2(dlat, dlng)
      return { sx: cx + r * Math.cos(angle), sy: cy - r * Math.sin(angle) }
    }

    function draw() {
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

      // Plot tracked objects — static dots, no sweep
      const objs = objRef.current
      objs.forEach(obj => {
        const pos = toSonar(obj.lat, obj.lng)
        if (!pos) return
        const col = COLORS[obj.type] || COLORS.aircraft

        x.beginPath()
        x.arc(pos.sx, pos.sy, obj.type === 'satellite' ? 2 : obj.type === 'maritime' ? 3 : 2.5, 0, Math.PI * 2)
        x.fillStyle = `rgba(${col.r},${col.g},${col.b},.85)`
        x.fill()
      })

      // Center dot
      x.beginPath(); x.arc(cx, cy, 2, 0, Math.PI * 2)
      x.fillStyle = 'rgba(196,255,44,.6)'; x.fill()
    }

    // Draw once, then re-draw on interval check for data changes
    draw()
    const iv = setInterval(() => {
      if (!drawnRef.current) {
        draw()
        drawnRef.current = true
      }
    }, 500)

    return () => clearInterval(iv)
  }, [])

  return ref
}
