import { useEffect, useRef, useState } from 'react'

/* ══════════════════════════════════════════════════════════
   NUCLEUS TRANSITION — Doctor Strange Portal → Globe Reveal

   Cinematic sequence:
   1. FORM     — particles swirl inward, coalesce into ring
   2. SPIN     — ring orbits, logo appears
   3. DISSOLVE — particles fly off, logo fades, ring stays
   4. HOLD     — ring glows alone on black (the cinematic beat)
   5. REVEAL   — black melts away, globe materialises inside ring
   6. RING_OUT — ring fades into the globe outline
   ══════════════════════════════════════════════════════════ */

const N = 400

// Timing (ms)
const T_FORM     = 600   // particles coalesce
const T_SPIN     = 900   // ring orbits, logo visible
const T_DISSOLVE = 400   // particles scatter, logo hides
const T_HOLD     = 1000  // ring glows alone on black — the beat
const T_REVEAL   = 600   // black bg fades, globe appears inside ring
const T_RING_OUT = 500   // ring fades into globe outline
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
}

function seed(r: number): P[] {
  const out: P[] = []
  for (let i = 0; i < N; i++) {
    out.push({
      angle: (i / N) * Math.PI * 2,
      startAngle: Math.random() * Math.PI * 2,
      startR: 50 + Math.random() * r * 3,
      speed: 0.8 + Math.random() * 0.4,
      size: 0.8 + Math.random() * 1.8,
      brightness: 0.3 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return out
}

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3) }
function easeInOut(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }

interface Props { onComplete: () => void }

export function NucleusTransition({ onComplete }: Props) {
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
    let globalRotation = 0

    function startAnimation(ctx: CanvasRenderingContext2D, cvs: HTMLCanvasElement) {
      const globe = document.querySelector('.globe-canvas') as HTMLElement | null
      let cx: number, cy: number, radius: number, canvasW: number, canvasH: number

      if (globe) {
        const gr = globe.getBoundingClientRect()
        canvasW = window.innerWidth
        canvasH = window.innerHeight
        cx = gr.left + gr.width / 2
        cy = gr.top + gr.height / 2
        radius = Math.min(gr.width, gr.height) / 2
      } else {
        canvasW = window.innerWidth
        canvasH = window.innerHeight
        cx = canvasW / 2
        cy = canvasH / 2
        radius = 196
      }

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

        // ── Background fade — stays BLACK through dissolve+hold, fades during REVEAL ──
        if (bgRef.current) {
          if (el < P_REVEAL) {
            bgRef.current.style.opacity = '1'
          } else {
            const t = (el - P_REVEAL) / T_REVEAL
            bgRef.current.style.opacity = String(Math.max(0, 1 - easeOut(t)))
          }
        }

        // ── Logo timing — appears during spin, hides during dissolve ──
        if (!logoShown && el >= T_FORM * 0.65) { logoShown = true; setShowLogo(true) }
        if (!logoHidden && el >= P_DISSOLVE + T_DISSOLVE * 0.15) { logoHidden = true; setShowLogo(false) }

        // ── Spin speed ──
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

        // ── Particles — only during FORM / SPIN / DISSOLVE ──
        if (el < P_HOLD) {
          for (let i = 0; i < N; i++) {
            const p = pts[i]
            let x: number, y: number, alpha: number

            if (el < P_SPIN) {
              const t = easeInOut(el / T_FORM)
              const currentR = p.startR + (radius - p.startR) * t
              const swirlAngle = p.startAngle + (p.angle - p.startAngle) * t + globalRotation * p.speed
              x = cx + Math.cos(swirlAngle) * currentR
              y = cy + Math.sin(swirlAngle) * currentR
              alpha = p.brightness * (0.1 + t * 0.9)
            } else if (el < P_DISSOLVE) {
              const orbitAngle = p.angle + globalRotation * p.speed
              const wobble = Math.sin(el * 0.008 + p.phase) * 2
              x = cx + Math.cos(orbitAngle) * (irisR + wobble)
              y = cy + Math.sin(orbitAngle) * (irisR + wobble)
              alpha = p.brightness * (0.85 + 0.15 * Math.sin(el * 0.012 + p.phase))
            } else {
              const dt = (el - P_DISSOLVE) / T_DISSOLVE
              const orbitAngle = p.angle + globalRotation * p.speed
              const expandR = irisR + dt * dt * 300 * p.speed
              x = cx + Math.cos(orbitAngle) * expandR
              y = cy + Math.sin(orbitAngle) * expandR
              alpha = p.brightness * Math.max(0, 1 - dt * 1.5)
            }

            const flicker = 0.85 + 0.15 * Math.sin(el * 0.01 + p.phase)
            const a = Math.max(0, Math.min(1, alpha * flicker))
            if (a <= 0) continue
            ctx.fillStyle = `rgba(196,255,44,${a})`
            ctx.fillRect(x, y, p.size, p.size)
          }
        }

        // ── Portal ring — persists through HOLD+REVEAL, fades during RING_OUT ──
        if (el >= T_FORM * 0.3) {
          let ra: number
          if (el < P_SPIN) {
            // Forming
            ra = easeOut((el - T_FORM * 0.3) / (T_FORM * 0.7)) * 0.5
          } else if (el < P_RING_OUT) {
            // Full brightness through spin → dissolve → hold → reveal
            ra = 0.5
          } else {
            // Ring fades out — becomes the globe
            ra = 0.5 * Math.max(0, 1 - (el - P_RING_OUT) / T_RING_OUT)
          }

          // After particles dissolve, snap to exact globe radius
          const ringR = (el >= P_DISSOLVE) ? radius : irisR

          // Subtle pulse during hold phase (the cinematic beat)
          let pulse = 0
          if (el >= P_HOLD && el < P_REVEAL) {
            const ht = (el - P_HOLD) / T_HOLD
            pulse = Math.sin(ht * Math.PI * 2) * 0.12
          }

          const mainAlpha = Math.min(1, ra + pulse)
          ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(196,255,44,${mainAlpha})`; ctx.lineWidth = 2.5; ctx.stroke()

          ctx.beginPath(); ctx.arc(cx, cy, ringR - 6, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(196,255,44,${mainAlpha * 0.3})`; ctx.lineWidth = 1; ctx.stroke()

          ctx.beginPath(); ctx.arc(cx, cy, ringR + 6, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(196,255,44,${mainAlpha * 0.2})`; ctx.lineWidth = 1; ctx.stroke()

          // During hold: add a soft radial glow inside the ring
          if (el >= P_HOLD && el < P_RING_OUT) {
            let glowAlpha: number
            if (el < P_REVEAL) {
              glowAlpha = 0.06 + pulse * 0.3
            } else {
              glowAlpha = 0.06 * Math.max(0, 1 - (el - P_REVEAL) / T_REVEAL)
            }
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR)
            g.addColorStop(0, `rgba(196,255,44,${glowAlpha})`)
            g.addColorStop(0.7, `rgba(196,255,44,${glowAlpha * 0.3})`)
            g.addColorStop(1, 'rgba(196,255,44,0)')
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
            ctx.strokeStyle = `rgba(196,255,44,${aa})`; ctx.lineWidth = 3; ctx.stroke()
          }
        }

        // ── Central glow — only during FORM / SPIN / early DISSOLVE ──
        if (el >= T_FORM * 0.5 && el < P_DISSOLVE + T_DISSOLVE * 0.5) {
          let ga: number
          if (el < P_SPIN) ga = easeOut((el - T_FORM * 0.5) / (T_FORM * 0.5)) * 0.12
          else if (el < P_DISSOLVE) ga = 0.12
          else ga = 0.12 * Math.max(0, 1 - (el - P_DISSOLVE) / (T_DISSOLVE * 0.5))

          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.8)
          g.addColorStop(0, `rgba(196,255,44,${ga})`)
          g.addColorStop(0.5, `rgba(196,255,44,${ga * 0.3})`)
          g.addColorStop(1, 'rgba(196,255,44,0)')
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
  }, [onComplete])

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
            WebkitTextStroke: '1.2px #C4FF2C',
            lineHeight: 1,
            textShadow: '0 0 30px rgba(196,255,44,.4)',
          }}
        >
          HADAL
        </span>
        <span
          style={{
            fontFamily: '"Share Tech Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.35em',
            color: 'rgba(196,255,44,.5)',
          }}
        >
          THREAT INTELLIGENCE TERMINAL
        </span>
      </div>
    </div>
  )
}
