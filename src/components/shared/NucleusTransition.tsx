import { useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════════════════════
   NUCLEUS TRANSITION — Doctor Strange Portal → Globe Reveal

   Cinematic sequence:
   1. FORM     — particles drift inward organically, loosely coalesce
   2. SPIN     — ring orbits with organic wobble, logo appears
   3. DISSOLVE — particles scatter outward like dust
   4. HOLD     — ring glows alone on black (the cinematic beat)
   5. REVEAL   — black melts away, globe materialises inside ring
   6. RING_OUT — ring fades into the globe outline
   ══════════════════════════════════════════════════════════ */

const N = 600 // more particles, smaller — organic cloud feel

// Timing (ms) — compressed to ~2.3s total
const T_FORM     = 500
const T_SPIN     = 500
const T_DISSOLVE = 300
const T_HOLD     = 200
const T_REVEAL   = 450
const T_RING_OUT = 350
const T_TOTAL    = T_FORM + T_SPIN + T_DISSOLVE + T_HOLD + T_REVEAL + T_RING_OUT

// Phase boundaries (cumulative)
const P_SPIN     = T_FORM
const P_DISSOLVE = T_FORM + T_SPIN
const P_HOLD     = P_DISSOLVE + T_DISSOLVE
const P_REVEAL   = P_HOLD + T_HOLD
const P_RING_OUT = P_REVEAL + T_REVEAL

interface P {
  angle: number
  startAngle: number
  startR: number
  speed: number
  size: number
  brightness: number
  phase: number
  drift: number      // organic drift amount per particle
  noiseX: number     // unique noise offset
  noiseY: number
  straggler: number  // 0-1: how much this particle "lags behind"
}

function seed(r: number): P[] {
  const out: P[] = []
  for (let i = 0; i < N; i++) {
    const straggler = Math.random() < 0.15 ? 0.3 + Math.random() * 0.7 : 0
    out.push({
      angle: (i / N) * Math.PI * 2 + (Math.random() - .5) * 0.3,
      startAngle: Math.random() * Math.PI * 2,
      startR: 30 + Math.random() * r * 3.5,
      speed: 0.6 + Math.random() * 0.6,
      size: 0.4 + Math.random() * 1.6,
      brightness: 0.15 + Math.random() * 0.85,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - .5) * 18,
      noiseX: (Math.random() - .5) * 2,
      noiseY: (Math.random() - .5) * 2,
      straggler,
    })
  }
  return out
}

/* Simple smooth noise-like function */
function fbm(t: number, phase: number): number {
  return Math.sin(t * 1.7 + phase) * 0.5
       + Math.sin(t * 3.1 + phase * 2.3) * 0.25
       + Math.sin(t * 5.3 + phase * 0.7) * 0.125
}

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInOut(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }

interface Props { onComplete: () => void; onReveal?: () => void }

export function NucleusTransition({ onComplete, onReveal }: Props) {
  const cRef = useRef<HTMLCanvasElement>(null)
  const oRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const [showLogo, setShowLogo] = useState(false)
  const [logoPos, setLogoPos] = useState<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const cvs = cRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    let setupRaf1 = requestAnimationFrame(() => {
      setupRaf1 = requestAnimationFrame(() => {
        startAnimation(ctx, cvs)
      })
    })

    let raf = 0
    let done = false
    let logoShown = false
    let logoHidden = false
    let revealFired = false
    let globalRotation = 0

    function startAnimation(ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) {
      const canvasW = window.innerWidth
      const canvasH = window.innerHeight

      let cx = canvasW / 2
      let cy = canvasH / 2
      let radius = 196

      let targetCx = cx
      let targetCy = cy
      let targetRadius = radius
      let globeFound = false

      setLogoPos({ x: cx, y: cy })

      const dpr = Math.min(window.devicePixelRatio, 2)
      cvs.width = canvasW * dpr
      cvs.height = canvasH * dpr
      cvs.style.width = `${canvasW}px`
      cvs.style.height = `${canvasH}px`
      ctx.scale(dpr, dpr)

      const pts = seed(radius)
      const t0 = performance.now()

      function render(now: number) {
        if (done) return
        const el = now - t0

        if (el >= T_TOTAL) {
          done = true
          onComplete()
          return
        }

        ctx.clearRect(0, 0, canvasW, canvasH)

        // Fire onReveal once
        if (!revealFired && el >= P_REVEAL - 100) {
          revealFired = true
          onReveal?.()
        }

        // Track globe position once terminal mounts
        if (revealFired) {
          const globe = document.querySelector('.globe-canvas') as HTMLElement | null
          if (globe) {
            const gr = globe.getBoundingClientRect()
            if (gr.width > 0) {
              globeFound = true
              targetCx = gr.left + gr.width / 2
              targetCy = gr.top + gr.height / 2
              targetRadius = Math.min(gr.width, gr.height) / 2
            }
          }
        }
        if (globeFound) {
          const lerpF = 0.14
          cx += (targetCx - cx) * lerpF
          cy += (targetCy - cy) * lerpF
          radius += (targetRadius - radius) * lerpF
        }

        // Background fade
        if (bgRef.current) {
          if (el < P_REVEAL) {
            bgRef.current.style.opacity = '1'
          } else {
            const t = (el - P_REVEAL) / T_REVEAL
            bgRef.current.style.opacity = String(Math.max(0, 1 - easeOut(t)))
          }
        }

        // Logo timing
        if (!logoShown && el >= T_FORM * 0.65) { logoShown = true; setShowLogo(true) }
        if (!logoHidden && el >= P_DISSOLVE + T_DISSOLVE * 0.15) { logoHidden = true; setShowLogo(false) }

        // Spin speed
        let spinSpeed: number
        if (el < P_SPIN) {
          spinSpeed = easeOut(el / T_FORM) * 3.5
        } else if (el < P_DISSOLVE) {
          const spinT = (el - P_SPIN) / T_SPIN
          spinSpeed = 3.5 * (1 - spinT * 0.6)
        } else if (el < P_HOLD) {
          spinSpeed = 1.4 * Math.max(0, 1 - (el - P_DISSOLVE) / T_DISSOLVE)
        } else {
          spinSpeed = 0
        }
        globalRotation += spinSpeed * 0.016

        // Iris contracts during spin
        let irisR = radius
        if (el >= P_SPIN && el < P_DISSOLVE) {
          const irisT = (el - P_SPIN) / T_SPIN
          irisR = radius - easeOut(irisT) * 8
        }

        const timeS = el / 1000 // time in seconds for noise

        // ── Particles — organic, fluid ──
        if (el < P_HOLD) {
          for (let i = 0; i < N; i++) {
            const p = pts[i]
            let x: number, y: number, alpha: number

            // Per-particle organic noise offset
            const nx = fbm(timeS * 1.2, p.phase) * p.drift
            const ny = fbm(timeS * 1.2, p.phase + 3.14) * p.drift

            if (el < P_SPIN) {
              // FORM: drift inward organically — stragglers lag behind
              const rawT = el / T_FORM
              const t = easeInOut(rawT * (1 - p.straggler * 0.6))
              const currentR = p.startR + (radius - p.startR) * t
              const swirlAngle = p.startAngle + (p.angle - p.startAngle) * t + globalRotation * p.speed

              // Organic scatter — particles don't converge to exact ring
              const scatter = (1 - t) * 30 + p.drift * (1 - t * 0.7)
              x = cx + Math.cos(swirlAngle) * currentR + nx + scatter * p.noiseX
              y = cy + Math.sin(swirlAngle) * currentR + ny + scatter * p.noiseY
              alpha = p.brightness * (0.05 + t * 0.95)
            } else if (el < P_DISSOLVE) {
              // SPIN: orbit with organic wobble
              const orbitAngle = p.angle + globalRotation * p.speed
              const wobble = Math.sin(el * 0.006 + p.phase) * 4 + fbm(timeS * 2, p.phase) * 8
              const radialWobble = irisR + wobble + p.straggler * 15

              x = cx + Math.cos(orbitAngle) * radialWobble + nx * 0.5
              y = cy + Math.sin(orbitAngle) * radialWobble + ny * 0.5
              alpha = p.brightness * (0.7 + 0.3 * Math.sin(el * 0.01 + p.phase))
            } else {
              // DISSOLVE: scatter outward like dust
              const dt = (el - P_DISSOLVE) / T_DISSOLVE
              const orbitAngle = p.angle + globalRotation * p.speed
              const expandR = irisR + dt * dt * 250 * p.speed + p.drift * dt

              // Add tangential drift for organic scatter
              const tangent = orbitAngle + dt * p.noiseX * 0.8
              x = cx + Math.cos(tangent) * expandR + nx * dt * 3
              y = cy + Math.sin(tangent) * expandR + ny * dt * 3
              alpha = p.brightness * Math.max(0, 1 - dt * 1.4)
            }

            const flicker = 0.8 + 0.2 * Math.sin(el * 0.008 + p.phase)
            const a = Math.max(0, Math.min(1, alpha * flicker))
            if (a <= 0) continue

            // Varied particle rendering — mix of dots and tiny squares
            ctx.fillStyle = `rgba(218,255,74,${a})`
            if (p.size < 1) {
              // Tiny dot
              ctx.fillRect(x, y, p.size, p.size)
            } else {
              // Slightly larger, soft square
              ctx.fillRect(x - p.size * 0.3, y - p.size * 0.3, p.size * 0.7, p.size * 0.7)
            }
          }
        }

        // ── Portal ring — persists through HOLD+REVEAL, fades during RING_OUT ──
        if (el >= T_FORM * 0.3) {
          let ra: number
          if (el < P_SPIN) {
            ra = easeOut((el - T_FORM * 0.3) / (T_FORM * 0.7)) * 0.5
          } else if (el < P_RING_OUT) {
            ra = 0.5
          } else {
            ra = 0.5 * Math.max(0, 1 - (el - P_RING_OUT) / T_RING_OUT)
          }

          const ringR = (el >= P_DISSOLVE) ? radius : irisR

          // Subtle pulse during hold
          let pulse = 0
          if (el >= P_HOLD && el < P_REVEAL) {
            const ht = (el - P_HOLD) / T_HOLD
            pulse = Math.sin(ht * Math.PI * 2) * 0.12
          }

          const mainAlpha = Math.min(1, ra + pulse)
          ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(218,255,74,${mainAlpha})`; ctx.lineWidth = 2.5; ctx.stroke()

          ctx.beginPath(); ctx.arc(cx, cy, ringR - 6, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(218,255,74,${mainAlpha * 0.3})`; ctx.lineWidth = 1; ctx.stroke()

          ctx.beginPath(); ctx.arc(cx, cy, ringR + 6, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(218,255,74,${mainAlpha * 0.2})`; ctx.lineWidth = 1; ctx.stroke()

          // Radial glow during hold
          if (el >= P_HOLD && el < P_RING_OUT) {
            let glowAlpha: number
            if (el < P_REVEAL) {
              glowAlpha = 0.06 + pulse * 0.3
            } else {
              glowAlpha = 0.06 * Math.max(0, 1 - (el - P_REVEAL) / T_REVEAL)
            }
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR)
            g.addColorStop(0, `rgba(218,255,74,${glowAlpha})`)
            g.addColorStop(0.7, `rgba(218,255,74,${glowAlpha * 0.3})`)
            g.addColorStop(1, 'rgba(218,255,74,0)')
            ctx.fillStyle = g
            ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.fill()
          }
        }

        // ── Spinning arcs — only during FORM / SPIN / early DISSOLVE ──
        if (el >= T_FORM * 0.4 && el < P_DISSOLVE + T_DISSOLVE * 0.15) {
          let aa: number
          if (el < P_SPIN) aa = easeOut((el - T_FORM * 0.4) / (T_FORM * 0.6)) * 0.6
          else if (el < P_DISSOLVE) aa = 0.6
          else aa = 0.6 * Math.max(0, 1 - (el - P_DISSOLVE) / (T_DISSOLVE * 0.15))

          for (let a = 0; a < 3; a++) {
            const arcStart = globalRotation * 1.5 + (a * Math.PI * 2 / 3)
            ctx.beginPath(); ctx.arc(cx, cy, irisR, arcStart, arcStart + Math.PI * 0.4)
            ctx.strokeStyle = `rgba(218,255,74,${aa})`; ctx.lineWidth = 3; ctx.stroke()
          }
        }

        // ── Central glow — only during FORM / SPIN / early DISSOLVE ──
        if (el >= T_FORM * 0.5 && el < P_DISSOLVE + T_DISSOLVE * 0.5) {
          let ga: number
          if (el < P_SPIN) ga = easeOut((el - T_FORM * 0.5) / (T_FORM * 0.5)) * 0.12
          else if (el < P_DISSOLVE) ga = 0.12
          else ga = 0.12 * Math.max(0, 1 - (el - P_DISSOLVE) / (T_DISSOLVE * 0.5))

          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.8)
          g.addColorStop(0, `rgba(218,255,74,${ga})`)
          g.addColorStop(0.5, `rgba(218,255,74,${ga * 0.3})`)
          g.addColorStop(1, 'rgba(218,255,74,0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(cx, cy, radius * 0.8, 0, Math.PI * 2); ctx.fill()
        }

        raf = requestAnimationFrame(render)
      }

      raf = requestAnimationFrame(render)
    }

    return () => {
      done = true
      cancelAnimationFrame(raf)
      cancelAnimationFrame(setupRaf1)
    }
  }, [onComplete, onReveal])

  return (
    <div
      ref={oRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {/* Background — stays black through hold, fades during reveal */}
      <div ref={bgRef} style={{ position: 'absolute', inset: 0, background: '#060800' }} />
      {/* Full-viewport canvas — ring draws at globe's actual position */}
      <canvas ref={cRef} style={{ position: 'fixed', inset: 0, display: 'block' }} />

      {/* HADAL wordmark — centered on globe position */}
      <div
        style={{
          position: 'fixed',
          left: logoPos ? logoPos.x : '50%',
          top: logoPos ? logoPos.y : '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          opacity: showLogo ? 1 : 0,
          transition: showLogo ? 'opacity 0.25s ease' : 'opacity 0.15s ease',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            fontFamily: 'Teko, sans-serif',
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: 'transparent',
            WebkitTextStroke: '1.2px #DAFF4A',
            lineHeight: 1,
            textShadow: '0 0 30px rgba(218,255,74,.4)',
          }}
        >
          HADAL
        </span>
        <span
          style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.35em',
            color: 'rgba(218,255,74,.5)',
          }}
        >
          THREAT INTELLIGENCE TERMINAL
        </span>
      </div>
    </div>
  )
}
