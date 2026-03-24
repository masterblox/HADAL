import { useEffect, useRef } from 'react'
import { G, G2, AMB, BG, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

export function ThreatSignalTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      rasterBase(x, W, H, 0.08, DPR)
      const t = Date.now() / 1000
      x.strokeStyle = G2 + '.04)'; x.lineWidth = 1
      for (let i = 0; i < W; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke() }
      for (let i = 0; i < H; i += 10) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke() }
      const buses = [{ y: H * 0.2, label: 'SIG', n: 7 }, { y: H * 0.5, label: 'EVT', n: 1 }, { y: H * 0.8, label: 'ENT', n: 4 }]
      buses.forEach((b, bi) => {
        x.fillStyle = G2 + '.03)'; x.fillRect(0, b.y - 6, W, 12)
        x.strokeStyle = G2 + '.25)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, b.y); x.lineTo(W, b.y); x.stroke()
        x.strokeStyle = G2 + '.08)'; x.lineWidth = 1
        x.beginPath(); x.moveTo(0, b.y - 4); x.lineTo(W, b.y - 4); x.stroke()
        x.beginPath(); x.moveTo(0, b.y + 4); x.lineTo(W, b.y + 4); x.stroke()
        x.fillStyle = G2 + '.06)'; x.fillRect(2, b.y - 14, 30, 10)
        x.font = 'bold 9px "Teko"'; x.fillStyle = G2 + '.5)'; x.fillText(b.label + ' ×' + b.n, 4, b.y - 6)
        for (let p = 0; p < 5; p++) {
          const px = ((t * 80 + p * 65 + bi * 50) % W)
          x.fillStyle = G; x.fillRect(px - 8, b.y - 2.5, 16, 5)
          x.fillStyle = G2 + '.3)'; x.fillRect(px - 32, b.y - 1.5, 24, 3)
          x.fillStyle = G2 + '.1)'; x.fillRect(px - 56, b.y - 1, 24, 2)
        }
      });
      [W * 0.18, W * 0.32, W * 0.48, W * 0.62, W * 0.78].forEach((vx, i) => {
        x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5
        x.beginPath(); x.moveTo(vx, H * 0.2); x.lineTo(vx, H * 0.5); x.stroke()
        x.beginPath(); x.moveTo(vx, H * 0.5); x.lineTo(vx, H * 0.8); x.stroke()
        ;[H * 0.2, H * 0.5, H * 0.8].forEach(py => {
          x.fillStyle = G2 + '.6)'; x.fillRect(vx - 4, py - 4, 8, 8)
          x.fillStyle = BG; x.fillRect(vx - 1.5, py - 1.5, 3, 3)
        })
        const p1 = ((t * 0.5 + i * 0.13) % 1)
        x.fillStyle = G; x.fillRect(vx - 3, H * 0.2 + H * 0.3 * p1 - 3, 6, 6)
        const p2 = ((t * 0.4 + i * 0.17 + 0.5) % 1)
        x.fillRect(vx - 3, H * 0.5 + H * 0.3 * p2 - 3, 6, 6)
      });
      [{ px: W * 0.25, py: H * 0.35, label: 'FUSE' }, { px: W * 0.55, py: H * 0.35, label: 'DEDUP' }, { px: W * 0.4, py: H * 0.65, label: 'GRAPH' }, { px: W * 0.7, py: H * 0.65, label: 'NORM' }].forEach(ic => {
        const iw = 52, ih = 26
        x.fillStyle = G2 + '.06)'; x.fillRect(ic.px - iw / 2, ic.py - ih / 2, iw, ih)
        x.strokeStyle = G2 + '.4)'; x.lineWidth = 2; x.strokeRect(ic.px - iw / 2, ic.py - ih / 2, iw, ih)
        for (let p = 0; p < 5; p++) {
          x.fillStyle = G2 + '.35)'
          x.fillRect(ic.px - iw / 2 - 4, ic.py - ih / 2 + 3 + p * 4, 3, 2)
          x.fillRect(ic.px + iw / 2 + 1, ic.py - ih / 2 + 3 + p * 4, 3, 2)
        }
        x.font = 'bold 8px "Teko"'; x.fillStyle = G; x.textAlign = 'center'
        x.fillText(ic.label, ic.px, ic.py + 3); x.textAlign = 'left'
      })
      x.fillStyle = 'rgba(5,7,0,.7)'; x.fillRect(W - 100, 54, 94, H - 80)
      x.strokeStyle = G2 + '.12)'; x.strokeRect(W - 100, 54, 94, H - 80)
      x.font = '6px "Teko"'; x.fillStyle = G2 + '.4)'; x.fillText('EVT RECORD', W - 94, 68)
      const rows = ['ID:EVT-03847', 'TYPE:MISSILE', 'SEV:CRITICAL', 'SIG:7 FUSED', 'ENT:4 LINKED', '', 'SIG-001:GOV', 'SIG-002:SNSR', 'SIG-003:NEWS', 'SIG-004:OSINT', '', 'ENT-A:IRGC', 'ENT-B:SHAHAB', 'ENT-C:TABRIZ']
      x.font = '5px "Share Tech Mono"'
      rows.forEach((row, i) => {
        if (!row) return
        const [k, v] = row.split(':')
        x.fillStyle = G2 + '.2)'; x.fillText(k, W - 94, 80 + i * 13)
        x.fillStyle = v === 'CRITICAL' ? AMB : G2 + '.45)'; x.fillText(v || '', W - 58, 80 + i * 13)
      })
      stamp(x, 4, H - 28, 'SYS:ESE-ARCH')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
