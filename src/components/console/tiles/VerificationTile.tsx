import { useEffect, useRef } from 'react'
import { G, G2, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

export function VerificationTile() {
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

      const families = [
        { name: 'GOVERNMENT', sigs: 3, rel: 0.95, glyph: '◆' },
        { name: 'NEWS WIRE', sigs: 4, rel: 0.82, glyph: '◈' },
        { name: 'CHATTER/SOCIAL', sigs: 3, rel: 0.48, glyph: '◬' },
        { name: 'SENSOR/SIGINT', sigs: 1, rel: 0.98, glyph: '▣' },
        { name: 'COMMERCIAL', sigs: 1, rel: 0.72, glyph: '▤' },
        { name: 'UNIFIED FEED', sigs: 5, rel: 0.74, glyph: '⊞' },
      ]

      const mx = 6, mw = W * 0.48, mh = H * 0.14
      families.forEach((f, i) => {
        const my = 52 + i * (mh + 4)
        x.fillStyle = G2 + '.025)'; x.fillRect(mx, my, mw, mh)
        x.strokeStyle = G2 + '.12)'; x.lineWidth = 2; x.strokeRect(mx, my, mw, mh)
        x.fillStyle = G2 + (f.rel > 0.9 ? '.4)' : f.rel > 0.7 ? '.2)' : '.1)'); x.fillRect(mx, my, 4, mh)
        x.font = '18px "Share Tech Mono"'; x.fillStyle = G2 + '.15)'; x.fillText(f.glyph, mw - 14, my + mh - 6)
        x.font = 'bold 9px "Teko"'; x.fillStyle = G2 + '.55)'; x.fillText(f.name, mx + 10, my + 14)
        for (let s = 0; s < f.sigs; s++) {
          x.fillStyle = G2 + '.55)'; x.fillRect(mx + 10 + s * 14, my + 20, 10, 10)
          x.strokeStyle = G2 + '.2)'; x.strokeRect(mx + 10 + s * 14, my + 20, 10, 10)
        }
        x.fillStyle = G2 + '.05)'; x.fillRect(mx + 10, my + mh - 14, mw - 24, 6)
        x.fillStyle = G2 + '.45)'; x.fillRect(mx + 10, my + mh - 14, (mw - 24) * f.rel, 6)
        x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'; x.fillText(String(f.rel * 100 | 0), mx + mw - 16, my + mh - 8)
        const cy2 = my + mh / 2
        x.strokeStyle = G2 + '.08)'; x.lineWidth = 1.5
        x.beginPath(); x.moveTo(mx + mw + 2, cy2); x.lineTo(W * 0.58, cy2); x.stroke()
        const pp = ((t * 0.5 + i * 0.18) % 1)
        x.fillStyle = G; x.fillRect(mx + mw + 2 + (W * 0.58 - mx - mw - 2) * pp - 4, cy2 - 2.5, 8, 5)
      })

      const rx = W * 0.6, rw = W * 0.38
      x.fillStyle = 'rgba(5,7,0,.7)'; x.fillRect(rx, 48, rw, H - 76)
      x.strokeStyle = G2 + '.15)'; x.lineWidth = 2; x.strokeRect(rx, 48, rw, H - 76)
      x.fillStyle = G2 + '.2)'; x.fillRect(rx, 48, rw, 3)
      x.font = 'bold 9px "Teko"'; x.fillStyle = G2 + '.5)'; x.fillText('CORROBORATION', rx + 8, 66)
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.35)'
      ;['AGREE:  5/6', 'XSRC:   0.78', 'CONTR:  0', 'INDEP:  0.88', 'CONV:   7MIN', 'UNIFIED:YES'].forEach((s, i) => x.fillText(s, rx + 8, 84 + i * 14))

      x.font = '6px "Teko"'; x.fillStyle = G2 + '.35)'; x.fillText('PROVENANCE', rx + 8, 178)
      ;[{ t2: '14:32Z', src: 'GOV', d: 0 }, { t2: '14:33Z', src: 'CHAT', d: 1 }, { t2: '14:34Z', src: 'NEWS', d: 2 }, { t2: '14:35Z', src: 'SNSR', d: 3 }, { t2: '14:38Z', src: 'UNFD', d: 6 }, { t2: '14:41Z', src: 'COMM', d: 9 }].forEach((ev, i) => {
        const ey = 178 + i * 16
        x.fillStyle = G2 + '.04)'; x.fillRect(rx + 8, ey, rw - 16, 10)
        x.fillStyle = G2 + (0.45 - 0.05 * i).toFixed(2) + ')'; x.fillRect(rx + 8 + (ev.d / 9) * 50, ey, 8, 10)
        x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'; x.fillText(ev.t2 + ' ' + ev.src, rx + 12, ey + 7)
      })

      const vp = Math.sin(t * 2) * 0.12 + 0.2
      x.fillStyle = G2 + vp.toFixed(2) + ')'; x.fillRect(rx + 8, H - 64, rw - 16, 20)
      x.strokeStyle = G2 + (vp + 0.15).toFixed(2) + ')'; x.strokeRect(rx + 8, H - 64, rw - 16, 20)
      x.font = 'bold 8px "Share Tech Mono"'; x.fillStyle = G; x.textAlign = 'center'
      x.fillText('VERIFIED — 6 FAMILIES (UNIFIED)', rx + rw / 2, H - 50); x.textAlign = 'left'

      stamp(x, 4, H - 28, 'SYS:XSRC-V')
      rafId = requestAnimationFrame(draw)
    }
    document.fonts.ready.then(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
