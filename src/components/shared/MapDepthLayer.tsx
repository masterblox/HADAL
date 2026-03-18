import { useEffect, useRef } from 'react'
import { createParticleRenderer, type ParticleInstance } from '@/canvas/particle-renderer'

// Placement C — ambient particle depth layer behind Leaflet map
// Full container width, extremely subtle (.04–.08 opacity)
// Sine-wave drift, no rotation — "looking through deep water" feel
// pointer-events: none, z-index behind tiles but above body

const MOBILE_MQ = '(max-width: 768px)'

export function MapDepthLayer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia(MOBILE_MQ).matches) return
    const el = containerRef.current
    if (!el) return

    let inst: ParticleInstance | null = null

    createParticleRenderer({
      container: el,
      size: 1,
      opacity: 0.06,
      drift: { enabled: true, amplitude: 2.5, frequency: 0.4 },
      width: el.clientWidth,
      height: el.clientHeight,
    }).then(i => {
      inst = i
      i.start()
    })

    return () => { inst?.dispose() }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  )
}
