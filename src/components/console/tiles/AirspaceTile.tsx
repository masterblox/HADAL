import { useEffect, useRef } from 'react'
import { G2, AMB, BG, PI, stamp, hdSetup } from '@/canvas/canvasKit'

export function AirspaceTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      x.fillStyle = '#030500'; x.fillRect(0, 0, W, H)
      const t = Date.now() / 1000

      // Hex mesh
      const hexR = 16, hexH = hexR * Math.sqrt(3)
      for (let row = -1; row < H / hexH + 1; row++) {
        for (let col = -1; col < W / (hexR * 3) + 1; col++) {
          const hx = col * hexR * 3 + (row % 2) * hexR * 1.5, hy = row * hexH * 0.5
          const isR = hx > W * 0.12 && hx < W * 0.42 && hy > H * 0.15 && hy < H * 0.65
          const isD = hx > W * 0.22 && hx < W * 0.38 && hy > H * 0.25 && hy < H * 0.55
          x.beginPath()
          for (let i = 0; i < 6; i++) {
            const a = PI / 6 + i * PI / 3
            i === 0 ? x.moveTo(hx + Math.cos(a) * hexR * 0.87, hy + Math.sin(a) * hexR * 0.87) : x.lineTo(hx + Math.cos(a) * hexR * 0.87, hy + Math.sin(a) * hexR * 0.87)
          }
          x.closePath()
          const dp = isD ? Math.sin(t * 2) * 0.03 + 0.06 : 0.06
          if (isD) { x.fillStyle = 'rgba(255,152,20,' + dp.toFixed(3) + ')'; x.fill(); x.strokeStyle = 'rgba(255,152,20,.2)' }
          else if (isR) { x.fillStyle = G2 + '.015)'; x.fill(); x.strokeStyle = G2 + '.07)' }
          else { x.strokeStyle = G2 + '.035)' }
          x.lineWidth = 0.5; x.stroke()
        }
      }

      // Altitude bands
      ;([['FL200-UNL', 'rgba(255,152,20,.3)', H * 0.2], ['FL100-FL200', G2 + '.2)', H * 0.42], ['SFC-FL100', G2 + '.12)', H * 0.65]] as [string, string, number][]).forEach(([lbl, col, y]) => {
        x.fillStyle = col; x.font = '5px "Share Tech Mono"'; x.fillText(lbl, 4, y)
        x.strokeStyle = col; x.setLineDash([2, 8]); x.lineWidth = 0.5
        x.beginPath(); x.moveTo(0, y + 4); x.lineTo(W * 0.52, y + 4); x.stroke(); x.setLineDash([])
      })

      x.font = 'bold 8px "Teko"'; x.fillStyle = 'rgba(255,152,20,.45)'; x.fillText('DANGER', W * 0.25, H * 0.3)
      x.fillStyle = G2 + '.25)'; x.fillText('RESTRICTED', W * 0.14, H * 0.17)

      // NOTAM panel
      const nx = W * 0.54, nw = W * 0.44
      x.fillStyle = 'rgba(5,7,0,.88)'; x.fillRect(nx, 48, nw, H - 76)
      x.strokeStyle = G2 + '.12)'; x.lineWidth = 1.5; x.strokeRect(nx, 48, nw, H - 76)
      x.fillStyle = G2 + '.2)'; x.fillRect(nx, 48, nw, 3)

      const critF = Math.sin(t * 3) > 0.3 ? 1 : 0.55
      x.fillStyle = 'rgba(255,152,20,' + critF.toFixed(2) + ')'; x.fillRect(nx + 4, 58, nw - 8, 18)
      x.fillStyle = BG; x.font = 'bold 9px "Teko"'; x.fillText('⚠ NOTAM A0847/26', nx + 8, 72)
      x.font = '7px "Teko"'; x.fillText('CRIT', nx + nw - 30, 72)

      x.fillStyle = 'rgba(255,152,20,.06)'; x.fillRect(nx + 4, 78, nw - 8, 48)
      x.strokeStyle = 'rgba(255,152,20,.15)'; x.strokeRect(nx + 4, 78, nw - 8, 48)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = 'rgba(255,152,20,.55)'
      x.fillText('OMAE FIR — FL200-UNL', nx + 8, 92)
      x.fillText('DANGER AREA ACTIVE', nx + 8, 104)
      x.fillText('22/1400Z-22/2200Z', nx + 8, 116)

      ;[{ id: 'B1204', s: 'HIGH', d: 'OIIX TMA — CLOSED' }, { id: 'C0392', s: 'ELEV', d: 'OKBK CTR — RESTRICTED' }, { id: 'D0188', s: 'MOD', d: 'OMDB APP — MODIFIED' }].forEach((n, i) => {
        const ny = 134 + i * 40
        x.fillStyle = G2 + '.02)'; x.fillRect(nx + 4, ny, nw - 8, 34)
        x.strokeStyle = G2 + '.06)'; x.strokeRect(nx + 4, ny, nw - 8, 34)
        x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.35)'; x.fillText('NOTAM ' + n.id, nx + 8, ny + 12)
        x.fillStyle = n.s === 'HIGH' ? AMB : G2 + '.25)'; x.fillText(n.s, nx + nw - 32, ny + 12)
        x.fillStyle = G2 + '.25)'; x.fillText(n.d, nx + 8, ny + 26)
      })

      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.2)'
      x.fillText('47 NOTAMS · 12 CRIT/HIGH · 23 AIRPORTS', nx + 8, H - 34)

      stamp(x, 4, H - 28, 'SYS:AIRSP-MON')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
