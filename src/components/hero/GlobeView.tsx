import { useEffect, useRef } from 'react'
import { useGlobe } from '@/canvas/useGlobe'

export function GlobeView() {
  const globeRef = useGlobe()
  const ticksRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ticksRef.current
    if (!C) return
    const x = C.getContext('2d')
    if (!x) return
    const cx = 260, cy = 260, G = 'rgba(196,255,44,'
    for (let i = 0; i < 120; i++) {
      const a = i * (Math.PI * 2 / 120) - Math.PI / 2
      const maj = i % 10 === 0
      const r1 = maj ? 245 : 248, r2 = maj ? 235 : 244
      x.beginPath()
      x.moveTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a))
      x.lineTo(cx + r2 * Math.cos(a), cy + r2 * Math.sin(a))
      x.strokeStyle = maj ? G + '.3)' : G + '.1)'
      x.lineWidth = maj ? 1.5 : .7
      x.stroke()
    }
  }, [])

  return (
    <div className="globe-wrap" style={{background:'radial-gradient(ellipse at center,rgba(196,255,44,.04) 0%,transparent 70%)'}}>
      <canvas ref={ticksRef} width={520} height={520} style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none'}} />
      <canvas ref={globeRef} width={420} height={420} />
      <div className="globe-label">&#9670; GULF THEATRE · REAL-TIME OSINT</div>
    </div>
  )
}
