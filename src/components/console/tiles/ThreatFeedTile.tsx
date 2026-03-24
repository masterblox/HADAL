import { useEffect, useRef } from 'react'
import { G, G2, BG, PI, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

export function ThreatFeedTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      const t = Date.now() / 1000
      rasterBase(x, W, H, 0.05, DPR)

      // Measurement frame
      x.strokeStyle = G; x.lineWidth = 1.5; x.strokeRect(W * 0.12, H * 0.06, W * 0.76, H * 0.86)
      const ox2 = W * 0.12, oy2 = H * 0.06, ow2 = W * 0.76, oh2 = H * 0.86
      ;([[ox2, oy2, 1, 1], [ox2 + ow2, oy2, -1, 1], [ox2, oy2 + oh2, 1, -1], [ox2 + ow2, oy2 + oh2, -1, -1]] as [number, number, number, number][]).forEach(([bx, by, dx, dy]) => {
        x.strokeStyle = G; x.lineWidth = 2
        x.beginPath(); x.moveTo(bx, by + dy * 14); x.lineTo(bx, by); x.lineTo(bx + dx * 14, by); x.stroke()
      })

      // Two vertical PCB bus traces
      const bus1X = W * 0.38, bus2X = W * 0.62, busW = W * 0.04
      ;[bus1X, bus2X].forEach(bx => {
        x.fillStyle = G2 + '.03)'; x.fillRect(bx, H * 0.08, busW, H * 0.82)
        x.strokeStyle = G2 + '.12)'; x.lineWidth = 0.5
        x.beginPath(); x.moveTo(bx, H * 0.08); x.lineTo(bx, H * 0.9); x.moveTo(bx + busW, H * 0.08); x.lineTo(bx + busW, H * 0.9); x.stroke()
        for (let f = 0; f < 6; f++) { x.fillStyle = G2 + '.08)'; x.fillRect(bx + 2, H * 0.12 + f * (H * 0.12), busW - 4, 2) }
        for (let p = 0; p < 3; p++) {
          const py = ((t * 50 + p * 120) % (H * 0.82)) + H * 0.08
          x.fillStyle = G; x.fillRect(bx + 1, py, busW - 2, 6)
        }
      })

      // Service IC packages
      const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'IDLE', 'ACTIVE', 'IDLE']
      const cycleIdx = Math.floor(t * 0.5) % 6
      const svcs = [
        { sx: W * 0.22, sy: H * 0.2, l: 'GEOCODER' }, { sx: W * 0.72, sy: H * 0.2, l: 'NER' },
        { sx: W * 0.22, sy: H * 0.48, l: 'DEDUP' }, { sx: W * 0.72, sy: H * 0.48, l: 'CLASSIFY' },
        { sx: W * 0.22, sy: H * 0.76, l: 'ENRICH' }, { sx: W * 0.72, sy: H * 0.76, l: 'VALIDATE' },
      ]
      svcs.forEach((s, i) => {
        const isP = i === cycleIdx
        const isA = statuses[i] === 'ACTIVE' || isP
        const cw2 = W * 0.12, ch2 = H * 0.08
        x.fillStyle = isP ? G : G2 + '.35)'; x.fillRect(s.sx - cw2 / 2, s.sy - ch2 / 2, cw2, ch2)
        x.fillStyle = BG; x.fillRect(s.sx - cw2 / 2 + cw2 * 0.15, s.sy - ch2 / 2 + ch2 * 0.2, cw2 * 0.7, ch2 * 0.6)
        x.font = '600 7px "Teko"'; x.fillStyle = isP ? G : G2 + '.6)'; x.textAlign = 'center'; x.fillText(s.l, s.sx, s.sy + 2); x.textAlign = 'left'
        const dotOn = isP ? (Math.sin(t * 8) > 0) : isA
        x.fillStyle = dotOn ? G : G2 + '.1)'; x.fillRect(s.sx + cw2 / 2 - 6, s.sy - ch2 / 2 + 2, 4, 4)
        x.strokeStyle = G2 + '.15)'; x.lineWidth = 0.5
        for (let p = 0; p < 3; p++) {
          const py = s.sy - ch2 / 2 + ch2 * 0.2 + p * (ch2 * 0.3)
          x.beginPath(); x.moveTo(s.sx - cw2 / 2 - W * 0.02, py); x.lineTo(s.sx - cw2 / 2, py); x.stroke()
          x.fillStyle = G2 + '.3)'; x.fillRect(s.sx - cw2 / 2 - W * 0.02 - 1, py - 1, 3, 3)
          x.beginPath(); x.moveTo(s.sx + cw2 / 2, py); x.lineTo(s.sx + cw2 / 2 + W * 0.02, py); x.stroke()
          x.fillRect(s.sx + cw2 / 2 + W * 0.02 - 1, py - 1, 3, 3)
        }
        x.font = '500 9px "Teko"'; x.fillStyle = G2 + '.4)'
        const ts2 = ['5:40', '11:04', '12:00', '13:54', '8:22', '16:05'][i]
        x.fillText(ts2, s.sx + cw2 / 2 + W * 0.03, s.sy + 3)
      })

      // Horizontal traces to buses
      svcs.forEach(s => {
        const nearBus = s.sx < W * 0.5 ? bus1X : bus2X
        x.strokeStyle = G2 + '.06)'; x.lineWidth = 1
        x.beginPath()
        if (s.sx < W * 0.5) { x.moveTo(s.sx + W * 0.06, s.sy); x.lineTo(nearBus, s.sy) }
        else { x.moveTo(nearBus + busW, s.sy); x.lineTo(s.sx - W * 0.06, s.sy) }
        x.stroke()
      })

      // Test points
      x.fillStyle = G2 + '.5)'
      ;([[W * 0.15, H * 0.12], [W * 0.85, H * 0.12], [W * 0.5, H * 0.5], [W * 0.15, H * 0.9], [W * 0.85, H * 0.9], [W * 0.5, H * 0.15]] as [number, number][]).forEach(([dx, dy]) => { x.fillRect(dx, dy, 3, 3) })

      // Circle alignment mark
      x.strokeStyle = G2 + '.4)'; x.lineWidth = 1.2
      x.beginPath(); x.arc(W * 0.5, H * 0.06 + 8, 6, 0, TAU); x.stroke()

      // Bus labels
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.15)'
      x.save(); x.translate(bus1X - 5, H * 0.5); x.rotate(-PI / 2); x.fillText('SERVICE BUS A', 0, 0); x.restore()
      x.save(); x.translate(bus2X + busW + 8, H * 0.5); x.rotate(-PI / 2); x.fillText('SERVICE BUS B', 0, 0); x.restore()
      x.fillStyle = G2 + '.25)'; x.fillText((7 + Math.floor(Math.sin(t) * 2)) + ' ops/s', W * 0.41 - 18, H * 0.92)

      stamp(x, 4, H - 28, 'SYS:MICROSVC')
      rafId = requestAnimationFrame(draw)
    }
    document.fonts.ready.then(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
