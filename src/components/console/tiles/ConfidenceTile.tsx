import { useEffect, useRef } from 'react'
import { G, G2, PI, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

export function ConfidenceTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      rasterBase(x, W, H, 0.12, DPR)
      const t = Date.now() / 1000

      // Dense binary character field (every 3rd frame)
      if (Math.floor(t * 60) % 3 === 0) {
        x.font = '6px "Share Tech Mono"'
        for (let row = 0; row < H; row += 7) for (let col = 0; col < W; col += 6) {
          const v = Math.sin(row * 0.1 + col * 0.06 + t * 0.4) > 0.5
          x.fillStyle = G2 + (v ? '.1)' : '.02)')
          x.fillText(v ? '1' : '0', col, row)
        }
      }

      // Fat confidence arc
      const cx = W * 0.3, cy = H * 0.42, rad = 75
      const confTarget = 0.84, conf = Math.min(confTarget, ((t * 0.15) % 1.3) * confTarget / 0.7)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 12
      x.beginPath(); x.arc(cx, cy, rad, -PI * 0.8, PI * 0.8); x.stroke()
      x.strokeStyle = G; x.lineWidth = 12
      x.beginPath(); x.arc(cx, cy, rad, -PI * 0.8, -PI * 0.8 + PI * 1.6 * conf); x.stroke()
      x.strokeStyle = G2 + '.15)'; x.lineWidth = 1
      x.beginPath(); x.arc(cx, cy, rad - 10, -PI * 0.8, PI * 0.8); x.stroke()
      for (let i = 0; i <= 20; i++) {
        const a = -PI * 0.8 + PI * 1.6 * (i / 20)
        const i1 = rad + 8, i2 = rad + (i % 5 === 0 ? 16 : 12)
        x.strokeStyle = G2 + (i % 5 === 0 ? '.3)' : '.1)'); x.lineWidth = i % 5 === 0 ? 1.5 : 1
        x.beginPath(); x.moveTo(cx + Math.cos(a) * i1, cy + Math.sin(a) * i1); x.lineTo(cx + Math.cos(a) * i2, cy + Math.sin(a) * i2); x.stroke()
      }
      const tipA = -PI * 0.8 + PI * 1.6 * conf
      x.fillStyle = G
      x.beginPath(); x.arc(cx + Math.cos(tipA) * rad, cy + Math.sin(tipA) * rad, 5, 0, TAU); x.fill()
      x.font = 'bold 52px "Teko"'; x.fillStyle = G; x.textAlign = 'center'
      x.fillText(String(Math.floor(conf * 100)), cx, cy + 16)
      x.font = '7px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'
      x.fillText('CONFIDENCE', cx, cy + 30); x.textAlign = 'left'

      // Factor bars
      const factors: [string, number, number][] = [['SRC RELI', 78, 0], ['SRC INDEP', 91, 0], ['CROSS AGR', 85, 0], ['GEO CONF', 72, 0], ['TEMPORAL', 80, 0], ['ENTITY', 65, 0], ['SENSOR', 88, 0], ['AGE ADJ', 70, 0], ['CONTRA', 12, 1]]
      const fx = W * 0.56, fy = 58, fh = 16, fw = W * 0.4
      x.fillStyle = G2 + '.04)'; x.fillRect(fx - 4, fy - 12, fw + 8, factors.length * fh + 20)
      x.strokeStyle = G2 + '.08)'; x.strokeRect(fx - 4, fy - 12, fw + 8, factors.length * fh + 20)
      x.font = '6px "Teko"'; x.fillStyle = G2 + '.4)'; x.fillText('9-FACTOR BREAKDOWN', fx, fy - 2)
      factors.forEach(([label, val, warn], i) => {
        const y = fy + 8 + i * fh
        const fillDelay = i * 0.1
        const fillP = Math.min(1, Math.max(0, ((t * 0.2) % 1.4 - fillDelay) * 2))
        x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'; x.fillText(label, fx, y + 8)
        x.fillStyle = G2 + '.04)'; x.fillRect(fx + 46, y + 2, fw - 62, 7)
        x.fillStyle = warn ? 'rgba(255,152,20,.55)' : G2 + '.5)'; x.fillRect(fx + 46, y + 2, (fw - 62) * (val / 100) * fillP, 7)
        x.fillStyle = G2 + (fillP > 0.7 ? '.4)' : '.1)'); x.fillText(String(Math.floor(val * fillP)), fx + fw - 14, y + 8)
      })

      x.font = '8px "Share Tech Mono"'; x.fillStyle = G2 + '.15)'
      ;['◆GOV:3', '◈NEWS:4', '◇SOCL:2', '▣SNSR:1'].forEach((s, i) => x.fillText(s, fx + i * 36, H - 34))

      stamp(x, 4, H - 28, 'SYS:CONF-9F')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
