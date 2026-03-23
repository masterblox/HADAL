import { useEffect, useRef } from 'react'
import { useGlobe } from '@/canvas/useGlobe'
import type { Incident } from '@/hooks/useDataPipeline'

export function GlobeView({ incidents }: { incidents: Incident[] }) {
  const globeRef = useGlobe(incidents)
  const ticksRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ticksRef.current
    if (!C) return
    const x = C.getContext('2d')
    if (!x) return
    const cx = 280, cy = 280, G = 'rgba(218,255,74,'
    for (let i = 0; i < 120; i++) {
      const a = i * (Math.PI * 2 / 120) - Math.PI / 2
      const maj = i % 10 === 0
      const r1 = maj ? 260 : 264, r2 = maj ? 247 : 259
      x.beginPath()
      x.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a))
      x.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
      x.strokeStyle = maj ? G + '.3)' : G + '.1)'
      x.lineWidth = maj ? 1.5 : .7
      x.stroke()
    }
  }, [])

  return (
    <div className="globe-wrap" style={{background:'radial-gradient(ellipse at center,rgba(218,255,74,.04) 0%,transparent 70%)'}}>
      <div className="globe-sizer">
        <canvas ref={ticksRef} width={560} height={560} className="globe-ticks" />
        <canvas ref={globeRef} width={560} height={560} className="globe-canvas" />
      </div>
      <div className="globe-label">&#9670; PRESSURE MAP · REAL-TIME OSINT</div>
    </div>
  )
}
