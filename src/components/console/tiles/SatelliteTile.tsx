import { useEffect, useRef } from 'react'
import { G, G2, PI, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

const art = [
  '         ▓▓         ',
  '        ▓▓▓▓        ',
  '   ░░░░▓▓▓▓▓▓░░░░   ',
  '  ░░░░░▓▓▓▓▓▓░░░░░  ',
  ' ░░░░░░▓▓▓▓▓▓░░░░░░ ',
  '  ░░░░░░▓▓▓▓░░░░░░  ',
  '    ░░░░░░░░░░░░    ',
  '      ▓▓▓▓▓▓▓▓      ',
  '       ▓▓▓▓▓▓       ',
  '        ▓▓▓▓        ',
  '         ▓▓         ',
]

export function SatelliteTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      rasterBase(x, W, H, 0.06, DPR)
      const t = Date.now() / 1000

      // Lock frame
      const fcx = W * 0.36, fcy = H * 0.48, fw = 175, fh = 155
      x.strokeStyle = G2 + '.12)'; x.lineWidth = 1.5; x.strokeRect(fcx - fw / 2, fcy - fh / 2, fw, fh)
      const cm = 16
      ;([[fcx - fw / 2, fcy - fh / 2, 1, 1], [fcx + fw / 2, fcy - fh / 2, -1, 1], [fcx - fw / 2, fcy + fh / 2, 1, -1], [fcx + fw / 2, fcy + fh / 2, -1, -1]] as [number, number, number, number][]).forEach(([bx, by, dx, dy]) => {
        x.strokeStyle = G; x.lineWidth = 3
        x.beginPath(); x.moveTo(bx, by + dy * cm); x.lineTo(bx, by); x.lineTo(bx + dx * cm, by); x.stroke()
      })

      // Char art
      const charW = 7, charH = 10
      const artW = art[0].length * charW, artH = art.length * charH
      const ox = fcx - artW / 2, oy = fcy - artH / 2
      x.font = '9px "Share Tech Mono"'
      art.forEach((line, row) => {
        ;[...line].forEach((ch, col) => {
          if (ch === ' ') return
          const bright = ch === '▓' ? 0.7 : 0.22
          const flick = Math.sin(t * 4 + row * 0.6 + col * 0.5) * 0.2 + Math.sin(t * 7 + col) * 0.05
          x.fillStyle = G2 + (bright + flick).toFixed(2) + ')'
          x.fillText(ch, ox + col * charW, oy + row * charH)
        })
      })

      // Telemetry labels
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.4)'
      x.fillText('NORAD:58247', fcx - fw / 2 + 4, fcy - fh / 2 + 14)
      x.fillText('KH-11 BLK V', fcx - fw / 2 + 4, fcy - fh / 2 + 26)
      x.fillText('RECON:' + (78 + Math.sin(t) * 5).toFixed(1) + '%', fcx - fw / 2 + 4, fcy + fh / 2 - 8)

      // Mission window
      const rx = W * 0.62
      x.fillStyle = 'rgba(5,7,0,.75)'; x.fillRect(rx, 48, W - rx - 4, H - 76)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(rx, 48, W - rx - 4, H - 76)
      x.fillStyle = G2 + '.2)'; x.fillRect(rx, 48, W - rx - 4, 3)
      x.font = '7px "Teko"'; x.fillStyle = G2 + '.45)'; x.fillText('MISSION WINDOW', rx + 6, 66)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.35)'
      ;['INC:97.4°', 'ALT:262KM', 'PER:89.2MIN', 'NEXT:00:14:32', 'LOCK:ACQUIRED', 'DWELL:00:04:12', 'QUAL:HIGH', 'BAND:MSI', 'GSD:0.15M'].forEach((s, i) => x.fillText(s, rx + 6, 82 + i * 16))

      // Orbital arc
      x.save(); x.translate(rx + 50, H - 55)
      x.strokeStyle = G2 + '.15)'; x.lineWidth = 1
      x.beginPath(); x.ellipse(0, 0, 42, 13, 0, 0, PI); x.stroke()
      x.fillStyle = G
      x.fillRect(Math.cos(t * 0.8) * 42 - 3, -Math.sin(t * 0.8) * 13 - 3, 6, 6)
      x.restore()

      stamp(x, 4, H - 28, 'SYS:SAT-ISR')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
