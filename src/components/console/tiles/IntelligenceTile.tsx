import { useEffect, useRef } from 'react'
import { G, G2, AMB, BG, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

export function IntelligenceTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      const t = Date.now() / 1000
      rasterBase(x, W, H, 0.06, DPR)

      // Faint grid hints
      x.strokeStyle = G2 + '.03)'; x.lineWidth = 0.5
      for (let gx = 40; gx < W; gx += 50) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke() }
      for (let gy = 40; gy < H; gy += 50) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke() }

      // Central PCB trace strip
      const stripX = W * 0.38, stripW = W * 0.08
      x.fillStyle = 'rgba(218,255,74,.03)'; x.fillRect(stripX, 0, stripW, H)
      x.strokeStyle = G2 + '.12)'; x.lineWidth = 0.5
      x.beginPath(); x.moveTo(stripX, 0); x.lineTo(stripX, H); x.moveTo(stripX + stripW, 0); x.lineTo(stripX + stripW, H); x.stroke()
      x.fillStyle = G2 + '.2)'; x.fillRect(stripX + 4, H * 0.7, stripW - 8, 3)
      x.fillStyle = G2 + '.1)'; x.fillRect(stripX + 3, H * 0.22, stripW - 6, 2)
      for (let i = 0; i < 8; i++) { x.fillStyle = G2 + '.04)'; x.fillRect(stripX + 2, H * 0.1 + i * H * 0.1, stripW - 4, 1) }

      // Outer measurement frame
      x.strokeStyle = G; x.lineWidth = 1.5; x.strokeRect(W * 0.2, H * 0.08, W * 0.62, H * 0.82)
      // Inner measurement box
      x.strokeStyle = G2 + '.4)'; x.lineWidth = 1.2; x.strokeRect(W * 0.34, H * 0.32, W * 0.22, H * 0.22)

      // Corner brackets on outer
      const ox = W * 0.2, oy = H * 0.08, ow = W * 0.62, oh = H * 0.82, tk = 10
      x.strokeStyle = G2 + '.6)'; x.lineWidth = 0.8
      ;([[ox, oy, 1, 1], [ox + ow, oy, -1, 1], [ox, oy + oh, 1, -1], [ox + ow, oy + oh, -1, -1]] as [number, number, number, number][]).forEach(([bx, by, dx, dy]) => {
        x.beginPath(); x.moveTo(bx - dx * tk, by); x.lineTo(bx + dx * tk, by); x.moveTo(bx, by - dy * tk); x.lineTo(bx, by + dy * tk); x.stroke()
      })

      // Circle ring
      x.strokeStyle = G2 + '.5)'; x.lineWidth = 1.5
      x.beginPath(); x.arc(W * 0.26, H * 0.14, W * 0.02, 0, TAU); x.stroke()

      // IC element near top of strip
      const ix = stripX + 2, iy = H * 0.12
      x.strokeStyle = G2 + '.4)'; x.lineWidth = 0.8; x.strokeRect(ix, iy, stripW - 4, H * 0.06)
      x.strokeStyle = G2 + '.2)'; x.lineWidth = 0.5
      for (let p = 0; p < 3; p++) {
        x.beginPath(); x.moveTo(ix - 4, iy + 4 + p * 6); x.lineTo(ix, iy + 4 + p * 6); x.stroke()
        x.beginPath(); x.moveTo(ix + stripW - 4, iy + 4 + p * 6); x.lineTo(ix + stripW, iy + 4 + p * 6); x.stroke()
      }

      // Stat cells as bonding pads
      const cells = [
        { l: 'INCIDENTS', b: 224, wx: W * 0.05, wy: H * 0.18 }, { l: 'VERIFIED', b: 187, wx: W * 0.05, wy: H * 0.34 },
        { l: 'KINETIC', b: 47, wx: W * 0.05, wy: H * 0.50, w: 1 }, { l: 'CRITICAL', b: 8, wx: W * 0.05, wy: H * 0.66, w: 1 },
        { l: 'COUNTRIES', b: 14, wx: W * 0.66, wy: H * 0.18 }, { l: 'SOURCES', b: 5, wx: W * 0.66, wy: H * 0.34 },
        { l: 'THREAT', b: 67, wx: W * 0.66, wy: H * 0.50 }, { l: 'CASCADE', b: 62, wx: W * 0.66, wy: H * 0.66, w: 1 },
      ]
      const activeP = Math.floor(t * 1.2) % cells.length
      cells.forEach((cell, i) => {
        const isA = i === activeP
        const padS = W * 0.04
        x.fillStyle = isA ? G : G2 + '.5)'; x.fillRect(cell.wx, cell.wy, padS, padS * 0.85)
        if (!isA) { x.fillStyle = BG; x.fillRect(cell.wx + padS * 0.2, cell.wy + padS * 0.25, padS * 0.6, padS * 0.35) }
        const jit = isA ? Math.floor(Math.sin(t * 8) * 2) : 0
        x.font = '500 11px "Teko"'; x.fillStyle = (cell as any).w ? AMB : G
        x.fillText(String(cell.b + jit), cell.wx + padS + 6, cell.wy + padS * 0.65)
        x.font = '5px "Rajdhani"'; x.fillStyle = G2 + '.3)'; x.fillText(cell.l, cell.wx + padS + 6, cell.wy + padS * 0.95)
        x.strokeStyle = G2 + '.08)'; x.lineWidth = 0.5
        x.beginPath()
        if (cell.wx < W * 0.5) { x.moveTo(cell.wx + padS, cell.wy + padS * 0.4); x.lineTo(ox, cell.wy + padS * 0.4) }
        else { x.moveTo(cell.wx, cell.wy + padS * 0.4); x.lineTo(ox + ow, cell.wy + padS * 0.4) }
        x.stroke()
      })

      // Checkerboard test pattern
      const ckx = W * 0.62, cky = H * 0.6, ckw = W * 0.12, ckh = H * 0.12, cs = W * 0.02
      for (let row = 0; row < Math.ceil(ckh / cs); row++) for (let cl = 0; cl < Math.ceil(ckw / cs); cl++) {
        x.fillStyle = (row + cl) % 2 === 0 ? G : G2 + '.15)'
        x.fillRect(ckx + cl * cs, cky + row * cs, Math.min(cs, ckw - cl * cs), Math.min(cs, ckh - row * cs))
      }

      // Test-point dots
      x.fillStyle = G2 + '.5)'
      ;([[W * 0.12, H * 0.15], [W * 0.28, H * 0.28], [W * 0.72, H * 0.15], [W * 0.15, H * 0.85], [W * 0.75, H * 0.85], [W * 0.5, H * 0.9]] as [number, number][]).forEach(([dx, dy]) => { x.fillRect(dx, dy, 3, 3) })

      // Timestamps
      x.font = '500 11px "Teko"'; x.fillStyle = G2 + '.5)'
      x.fillText('12:00', W * 0.36, H * 0.55)
      x.fillText('5:40', W * 0.72, H * 0.12)
      x.fillText('13:54', W * 0.1, H * 0.7)

      stamp(x, 4, H - 28, 'SYS:STATS-DRV')
      rafId = requestAnimationFrame(draw)
    }
    document.fonts.ready.then(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
