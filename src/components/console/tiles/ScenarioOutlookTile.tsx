import { useEffect, useRef } from 'react'
import { G, G2, AMB, BG, PI, stamp, hdSetup } from '@/canvas/canvasKit'

export function ScenarioOutlookTile() {
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

      // Scrolling diagonal bands
      x.save(); x.translate(W / 2, H / 2); x.rotate(-8 * PI / 180)
      const bandTexts = ['ESCALATION', '', 'MISSILE', '', 'BLOCKADE', '', 'PROXY', '', 'DE-ESCAL', '', 'CYBER', '', 'STATUS QUO', '']
      const scroll = (t * 14) % 56
      bandTexts.forEach((b, i) => {
        const y = -H * 0.7 + i * 28 + scroll
        if (!b) { x.fillStyle = G2 + '.03)'; x.fillRect(-W, y, W * 2, 4); return }
        x.fillStyle = G2 + '.015)'; x.fillRect(-W, y, W * 2, 22)
        x.font = '10px "Teko"'; x.fillStyle = G2 + '.05)'
        x.fillText(b, -W * 0.3, y + 15); x.fillText(b, W * 0.1, y + 15)
      })
      x.restore()

      // Left panel
      x.fillStyle = 'rgba(5,7,0,.82)'; x.fillRect(6, 52, W * 0.48, H - 80)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(6, 52, W * 0.48, H - 80)
      x.fillStyle = G2 + '.2)'; x.fillRect(6, 52, W * 0.48, 3)

      x.font = '7px "Teko"'; x.fillStyle = G2 + '.4)'; x.fillText('SCENARIO RESOLUTION', 14, 68)
      const thr = Math.floor(64 + Math.sin(t * 0.4) * 5)
      x.font = 'bold 56px "Teko"'; x.fillStyle = G; x.fillText(String(thr), 14, 126)
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'; x.fillText('THEATRE THREAT', 78, 112)
      x.fillStyle = G2 + '.35)'; x.fillText('DOM:', 14, 142); x.fillStyle = AMB; x.fillText('ESCALATION PATH', 36, 142)
      x.fillStyle = G2 + '.2)'; x.font = '5px "Share Tech Mono"'; x.fillText('P(SEV)34% P(CRIT)12%', 14, 154)

      // Table
      x.fillStyle = G2 + '.05)'; x.fillRect(10, 164, W * 0.46, 14)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'
      x.fillText('SCENARIO', 14, 174); x.fillText('P%', 120, 174); x.fillText('SEV', 140, 174); x.fillText('WIN', 168, 174)
      const scen: [string, number, string, string][] = [['Missile Exch', 34, 'CRIT', '24-72h'], ['Naval Block', 22, 'HIGH', '72h-7d'], ['Proxy Activ', 18, 'MED', '24-72h'], ['Cyber Offn', 14, 'MED', '0-24h'], ['De-escalat', 12, 'LOW', '7d+']]
      const aRow = Math.floor(t * 0.5) % 5
      scen.forEach(([n, p, s, w], i) => {
        const sy = 186 + i * 14; const isA = i === aRow
        if (isA) { x.fillStyle = G2 + '.04)'; x.fillRect(10, sy - 9, W * 0.46, 14) }
        const al = isA ? 0.7 : 0.45 - 0.04 * i
        x.fillStyle = G2 + al.toFixed(2) + ')'; x.font = '5px "Share Tech Mono"'
        x.fillText(n, 14, sy); x.fillText(String(p), 120, sy)
        x.fillStyle = s === 'CRIT' || s === 'HIGH' ? AMB : G2 + al.toFixed(2) + ')'; x.fillText(s, 140, sy)
        x.fillStyle = G2 + al.toFixed(2) + ')'; x.fillText(w, 168, sy)
      })

      // Right panel
      x.fillStyle = 'rgba(5,7,0,.82)'; x.fillRect(W * 0.52, 52, W * 0.46, H - 80)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(W * 0.52, 52, W * 0.46, H - 80)
      x.fillStyle = G2 + '.2)'; x.fillRect(W * 0.52, 52, W * 0.46, 3)
      x.font = '7px "Teko"'; x.fillStyle = G2 + '.4)'; x.fillText('TIME WINDOWS', W * 0.52 + 8, 68)

      ;([{ n: '24H', s: 'ELEVATED', e: 14, k: 6, d: '' }, { n: '72H', s: 'MODERATE', e: 38, k: 0, d: '+22%' }, { n: '7D', s: 'BASELINE', e: 112, k: 0, d: 'STABLE' }] as { n: string; s: string; e: number; k: number; d: string }[]).forEach((w, i) => {
        const wy = 80 + i * 72, wx = W * 0.52 + 8, ww = W * 0.46 - 16
        x.fillStyle = G2 + '.015)'; x.fillRect(wx, wy, ww, 60)
        x.strokeStyle = G2 + '.06)'; x.strokeRect(wx, wy, ww, 60)
        x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.4)'; x.fillText(w.n + ' WINDOW', wx + 6, wy + 14)
        x.fillStyle = w.s === 'ELEVATED' ? AMB : G2 + '.25)'; x.fillText(w.s, wx + ww - 42, wy + 14)
        x.fillStyle = G2 + '.3)'; x.fillText('EVT:' + w.e, wx + 6, wy + 30)
        x.fillStyle = w.k ? AMB : G2 + '.2)'; x.fillText(w.k ? 'KIN:' + w.k : 'TREND:' + w.d, wx + 6, wy + 42)
        const prog = ((t * 0.08 + i * 0.3) % 1)
        x.fillStyle = G2 + '.05)'; x.fillRect(wx + 6, wy + 52, ww - 12, 4)
        x.fillStyle = w.s === 'ELEVATED' ? 'rgba(255,152,20,.35)' : G2 + '.25)'; x.fillRect(wx + 6, wy + 52, (ww - 12) * prog, 4)
      })

      const cp = Math.sin(t * 2) * 0.25 + 0.35
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + cp.toFixed(2) + ')'
      x.fillText('CASCADE:0.62 CONTAGION:3', W * 0.52 + 8, H - 34)

      stamp(x, 4, H - 28, 'SYS:PRED-ENG')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
