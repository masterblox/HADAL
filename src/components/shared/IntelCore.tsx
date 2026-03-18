import { useEffect, useRef } from 'react'
import { createParticleRenderer, type ParticleInstance } from '@/canvas/particle-renderer'

// Placement B — small (120x120) particle cloud "intelligence nucleus"
// Meant to sit at center of an entity/force-directed graph
// Slow Y-axis auto-rotation, low point size, additive glow

const MOBILE_MQ = '(max-width: 768px)'

interface IntelCoreProps {
  pulse?: boolean  // set true when a new incident arrives — briefly boosts opacity
  size?: number
}

export function IntelCore({ pulse = false, size = 120 }: IntelCoreProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<ParticleInstance | null>(null)

  useEffect(() => {
    if (window.matchMedia(MOBILE_MQ).matches) return
    const el = containerRef.current
    if (!el) return

    let inst: ParticleInstance | null = null

    createParticleRenderer({
      container: el,
      size: 1.5,
      opacity: 0.4,
      rotation: { axis: 'y', speed: 0.003 },
      width: size,
      height: size,
    }).then(i => {
      inst = i
      instanceRef.current = i
      i.start()
    })

    return () => {
      inst?.dispose()
      instanceRef.current = null
    }
  }, [size])

  // Pulse effect — boost opacity briefly when new incident arrives
  useEffect(() => {
    const inst = instanceRef.current
    if (!inst || !pulse) return
    inst.setOpacity(0.7)
    const t = setTimeout(() => inst.setOpacity(0.4), 600)
    return () => clearTimeout(t)
  }, [pulse])

  return (
    <div
      ref={containerRef}
      style={{
        width: size,
        height: size,
        position: 'relative',
        pointerEvents: 'none',
      }}
    />
  )
}
