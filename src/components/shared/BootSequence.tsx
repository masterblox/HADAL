import { useEffect, useRef, useState } from 'react'
import { loadPly } from '@/canvas/ply-loader'

// Boot sequence — full-viewport particle cloud animation
// Plays once per session (sessionStorage flag)
// Respects prefers-reduced-motion: shows static wordmark instead

const SESSION_KEY = 'hadal-boot-played'
const MOBILE_MQ = '(max-width: 768px)'
const REDUCED_MOTION_MQ = '(prefers-reduced-motion: reduce)'

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [wordmarkVisible, setWordmarkVisible] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Skip if already played this session or mobile
    if (sessionStorage.getItem(SESSION_KEY)) {
      setVisible(false)
      onComplete()
      return
    }

    const isMobile = window.matchMedia(MOBILE_MQ).matches
    if (isMobile) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setVisible(false)
      onComplete()
      return
    }

    const reducedMotion = window.matchMedia(REDUCED_MOTION_MQ).matches

    if (reducedMotion) {
      // Static wordmark, no animation
      setWordmarkVisible(true)
      setSubtitleVisible(true)
      const t = setTimeout(() => {
        setFadeOut(true)
        setTimeout(() => {
          sessionStorage.setItem(SESSION_KEY, '1')
          setVisible(false)
          onComplete()
        }, 600)
      }, 2000)
      return () => clearTimeout(t)
    }

    // Full animation path
    const el = containerRef.current
    if (!el) return

    let disposed = false
    let raf = 0

    async function run() {
      // Dynamically load Three.js
      if (!window.THREE) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
          s.onload = () => resolve()
          s.onerror = () => reject()
          document.head.appendChild(s)
        })
      }

      if (disposed || !el) return
      const THREE = window.THREE
      const data = await loadPly()
      if (disposed || !el) return

      const w = window.innerWidth
      const h = window.innerHeight

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 2000)
      camera.position.z = 200

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 1)
      el.appendChild(renderer.domElement)

      // Geometry with scattered start positions
      const geometry = new THREE.BufferGeometry()
      const startPositions = new Float32Array(data.count * 3)
      const targetPositions = data.positions

      // Scatter: random positions across viewport in 3D space
      for (let i = 0; i < data.count; i++) {
        startPositions[i * 3] = (Math.random() - 0.5) * 600
        startPositions[i * 3 + 1] = (Math.random() - 0.5) * 400
        startPositions[i * 3 + 2] = (Math.random() - 0.5) * 300
      }

      const currentPositions = new Float32Array(startPositions)
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(currentPositions, 3))

      // Vertex colors — HADAL green with per-vertex opacity
      const vertexColors = new Float32Array(data.count * 3)
      for (let i = 0; i < data.count; i++) {
        const a = data.colors[i * 4 + 3]
        vertexColors[i * 3] = data.colors[i * 4] * a
        vertexColors[i * 3 + 1] = data.colors[i * 4 + 1] * a
        vertexColors[i * 3 + 2] = data.colors[i * 4 + 2] * a
      }
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3))

      const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      })

      const points = new THREE.Points(geometry, material)
      scene.add(points)

      const startTime = Date.now()
      const SWIRL_DURATION = 2500
      const HOLD_START = SWIRL_DURATION
      const WORDMARK_SHOW = HOLD_START + 400
      const SUBTITLE_SHOW = WORDMARK_SHOW + 300
      const DISSOLVE_START = SUBTITLE_SHOW + 1000
      const DISSOLVE_DURATION = 800
      const TOTAL_END = DISSOLVE_START + DISSOLVE_DURATION

      function animate() {
        if (disposed) return
        raf = requestAnimationFrame(animate)
        const elapsed = Date.now() - startTime
        const posArr = geometry.attributes.position.array as Float32Array

        if (elapsed < SWIRL_DURATION) {
          // Phase 1: swirl inward
          const t = elapsed / SWIRL_DURATION
          // Ease-in-out cubic
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
          const swirlAngle = t * Math.PI * 3 // 3 full rotations

          for (let i = 0; i < data.count; i++) {
            const sx = startPositions[i * 3]
            const sy = startPositions[i * 3 + 1]
            const sz = startPositions[i * 3 + 2]
            const tx = targetPositions[i * 3]
            const ty = targetPositions[i * 3 + 1]
            const tz = targetPositions[i * 3 + 2]

            // Lerp with swirl offset
            let x = sx + (tx - sx) * ease
            let y = sy + (ty - sy) * ease
            let z = sz + (tz - sz) * ease

            // Add swirl (diminishes as particles converge)
            const swirlRadius = (1 - ease) * 30
            const particlePhase = i * 0.0003
            x += Math.cos(swirlAngle + particlePhase) * swirlRadius
            y += Math.sin(swirlAngle + particlePhase) * swirlRadius

            posArr[i * 3] = x
            posArr[i * 3 + 1] = y
            posArr[i * 3 + 2] = z
          }
          geometry.attributes.position.needsUpdate = true
        } else if (elapsed < DISSOLVE_START) {
          // Phase 2: hold + slow rotate + ambient drift
          const holdTime = (elapsed - HOLD_START) / 1000
          points.rotation.y = holdTime * 0.3

          // Ambient drift
          for (let i = 0; i < data.count; i++) {
            const tx = targetPositions[i * 3]
            const ty = targetPositions[i * 3 + 1]
            const tz = targetPositions[i * 3 + 2]
            const phase = tx * 0.02 + ty * 0.02
            posArr[i * 3] = tx + Math.sin(holdTime * 1.5 + phase) * 0.5
            posArr[i * 3 + 1] = ty + Math.cos(holdTime * 1.2 + phase * 1.3) * 0.3
            posArr[i * 3 + 2] = tz
          }
          geometry.attributes.position.needsUpdate = true

          // Show wordmark and subtitle
          if (elapsed >= WORDMARK_SHOW) setWordmarkVisible(true)
          if (elapsed >= SUBTITLE_SHOW) setSubtitleVisible(true)
        } else if (elapsed < TOTAL_END) {
          // Phase 3: dissolve outward
          const dt = (elapsed - DISSOLVE_START) / DISSOLVE_DURATION
          const ease = dt * dt
          material.opacity = 1 - ease
          points.rotation.y += 0.005

          for (let i = 0; i < data.count; i++) {
            const tx = targetPositions[i * 3]
            const ty = targetPositions[i * 3 + 1]
            const tz = targetPositions[i * 3 + 2]
            // Explode outward from target
            const dx = tx * 0.01 || (Math.random() - 0.5)
            const dy = ty * 0.01 || (Math.random() - 0.5)
            posArr[i * 3] = tx + dx * ease * 200
            posArr[i * 3 + 1] = ty + dy * ease * 200
            posArr[i * 3 + 2] = tz + (tz * 0.01 || (Math.random() - 0.5)) * ease * 100
          }
          geometry.attributes.position.needsUpdate = true

          setFadeOut(true)
        } else {
          // Done
          cancelAnimationFrame(raf)
          geometry.dispose()
          material.dispose()
          renderer.dispose()
          if (renderer.domElement.parentElement) {
            renderer.domElement.parentElement.removeChild(renderer.domElement)
          }
          sessionStorage.setItem(SESSION_KEY, '1')
          setVisible(false)
          onComplete()
          return
        }

        renderer.render(scene, camera)
      }

      animate()
    }

    run()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.6s ease',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* Wordmark — renders on top of particle canvas */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <h1
          style={{
            fontFamily: 'Teko, sans-serif',
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: 'transparent',
            WebkitTextStroke: '1.5px #DAFF4A',
            opacity: wordmarkVisible ? 1 : 0,
            transition: 'opacity 0.8s ease',
            margin: 0,
            lineHeight: 1,
          }}
        >
          HADAL
        </h1>
        <span
          style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 11,
            letterSpacing: '0.35em',
            color: '#DAFF4A',
            opacity: subtitleVisible ? 0.6 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          THREAT INTELLIGENCE TERMINAL
        </span>
      </div>
    </div>
  )
}
