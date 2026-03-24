import { useEffect, useRef } from 'react'
import { G, G2, AMB, PI, TAU, stamp, hdSetup } from '@/canvas/canvasKit'

export function GlobeTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      x.fillStyle = '#020400'; x.fillRect(0, 0, W, H)
      const t = Date.now() / 1000
      const gcx = W * 0.36, gcy = H * 0.5, R = Math.min(W * 0.3, H * 0.38)

      // Globe outline
      x.strokeStyle = G2 + '.12)'; x.lineWidth = 1
      x.beginPath(); x.arc(gcx, gcy, R, 0, TAU); x.stroke()

      // Grid
      x.strokeStyle = G2 + '.04)'; x.lineWidth = 0.5
      for (let lat = -60; lat <= 60; lat += 20) {
        const r2 = R * Math.cos(lat * PI / 180), y = gcy - R * Math.sin(lat * PI / 180)
        x.beginPath(); x.ellipse(gcx, y, r2, r2 * 0.12, 0, 0, TAU); x.stroke()
      }
      for (let lon = 0; lon < 180; lon += 30) {
        x.save(); x.translate(gcx, gcy); x.rotate((lon + t * 12) * PI / 180)
        x.beginPath(); x.ellipse(0, 0, R * 0.12, R, 0, 0, TAU); x.stroke()
        x.restore()
      }

      // Land dots
      const step = 4.5
      for (let dy = -R; dy <= R; dy += step) for (let dx = -R; dx <= R; dx += step) {
        if (dx * dx + dy * dy > R * R) continue
        const sq = Math.max(0, R * R - dx * dx - dy * dy)
        const lon2 = (Math.atan2(dx, Math.sqrt(sq)) * 180 / PI + t * 12) % 360
        const lat2 = Math.asin(Math.max(-1, Math.min(1, dy / R))) * 180 / PI
        const v = Math.sin(lon2 * 0.05) * Math.cos(lat2 * 0.08) + Math.sin(lon2 * 0.03 + lat2 * 0.04) * 0.5
        if (v > 0.15 && Math.abs(lat2) < 70) { x.fillStyle = G2 + (0.1 + v * 0.15).toFixed(3) + ')'; x.fillRect(gcx + dx - 1, gcy + dy - 1, 2, 2) }
      }

      // Radar sweep
      x.save(); x.translate(gcx, gcy); x.rotate(t * 0.8)
      try {
        const grad = x.createConicGradient(0, 0, 0)
        grad.addColorStop(0, G2 + '.15)'); grad.addColorStop(0.08, 'transparent'); grad.addColorStop(1, 'transparent')
        x.fillStyle = grad; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill()
      } catch (_) {}
      x.strokeStyle = G2 + '.3)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 0); x.lineTo(R, 0); x.stroke()
      x.restore()

      // Incident markers
      ;([{ ix: gcx + R * 0.3, iy: gcy - R * 0.1, s: 'c' }, { ix: gcx - R * 0.2, iy: gcy + R * 0.15, s: 'h' }, { ix: gcx + R * 0.1, iy: gcy + R * 0.3, s: 'm' }, { ix: gcx - R * 0.35, iy: gcy - R * 0.2, s: 'h' }, { ix: gcx + R * 0.25, iy: gcy - R * 0.3, s: 'c' }] as { ix: number; iy: number; s: string }[]).forEach(inc => {
        x.fillStyle = inc.s === 'c' ? 'rgba(255,152,20,.8)' : inc.s === 'h' ? 'rgba(255,152,20,.45)' : G2 + '.4)'
        x.fillRect(inc.ix - 2.5, inc.iy - 2.5, 5, 5)
        if (inc.s === 'c') { x.strokeStyle = 'rgba(255,152,20,.3)'; x.lineWidth = 1; x.beginPath(); x.arc(inc.ix, inc.iy, 8 + Math.sin(t * 3) * 3, 0, TAU); x.stroke() }
      })

      // Globe rim
      x.strokeStyle = G2 + '.25)'; x.lineWidth = 2; x.beginPath(); x.arc(gcx, gcy, R, 0, TAU); x.stroke()

      // Telemetry islands
      const ix = W * 0.7, iw = W * 0.28
      x.fillStyle = 'rgba(5,7,0,.8)'; x.fillRect(ix, 48, iw, H - 76)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1.5; x.strokeRect(ix, 48, iw, H - 76)
      x.fillStyle = G2 + '.2)'; x.fillRect(ix, 48, iw, 3)
      const metrics = [{ l: 'EVENTS', b: 224 }, { l: 'ACTIVE', b: 47 }, { l: 'CRIT', b: 8, w: 1 }, { l: 'AIRCRAFT', b: 12 }, { l: 'VESSELS', b: 31 }, { l: 'HOTSPOT', b: 6, w: 1 }, { l: 'COUNTRY', b: 14 }, { l: 'SOURCES', b: 5 }]
      const activeM = Math.floor(t * 1.5) % metrics.length
      metrics.forEach((m, i) => {
        const my = 56 + i * ((H - 84) / 8), mh = (H - 84) / 8 - 2
        const isA = i === activeM
        x.fillStyle = isA ? G2 + '.04)' : G2 + '.015)'; x.fillRect(ix + 3, my, iw - 6, mh)
        x.strokeStyle = isA ? G2 + '.15)' : G2 + '.05)'; x.strokeRect(ix + 3, my, iw - 6, mh)
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'; x.fillText(m.l, ix + 6, my + 10)
        const jit = isA ? Math.floor(Math.sin(t * 6) * 2) : 0
        x.font = 'bold 16px "Teko"'; x.fillStyle = (m as any).w ? AMB : G; x.fillText(String(m.b + jit), ix + 6, my + mh - 3)
      })

      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'; x.fillText('GULF THEATRE', 6, 18)
      stamp(x, 4, H - 28, 'SYS:MAP-OPS')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
