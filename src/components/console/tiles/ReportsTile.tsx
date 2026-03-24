import { useEffect, useRef } from 'react'
import { G, G2, BG, stamp, hdSetup } from '@/canvas/canvasKit'

export function ReportsTile() {
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

      // Giant background type — breathing
      const br = Math.sin(t * 0.3) * 0.015 + 0.035
      x.font = 'bold 130px "Teko"'; x.fillStyle = G2 + br.toFixed(3) + ')'; x.fillText('BRIEF', W * 0.03, H * 0.38)
      x.strokeStyle = G2 + (br + 0.03).toFixed(3) + ')'; x.lineWidth = 1; x.strokeText('BRIEF', W * 0.03, H * 0.38)
      x.font = 'bold 70px "Teko"'; x.fillStyle = G2 + (br * 0.7).toFixed(3) + ')'; x.fillText('INTEL', W * 0.08, H * 0.54)

      // Amber bar
      const cf = Math.sin(t * 2) > 0.6 ? 0.95 : 0.7
      x.fillStyle = 'rgba(255,152,20,' + cf.toFixed(2) + ')'; x.fillRect(0, 48, W, 22)
      x.fillStyle = BG; x.font = 'bold 11px "Teko"'; x.fillText('⚠ CLASSIFIED — INTELLIGENCE ASSESSMENT', 8, 64)
      x.font = '8px "Teko"'; x.fillText('TS//SI//NOFORN', W - 84, 64)

      // Report content
      x.fillStyle = 'rgba(5,7,0,.85)'; x.fillRect(10, 80, W - 20, H - 110)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(10, 80, W - 20, H - 110)
      x.fillStyle = G2 + '.2)'; x.fillRect(10, 80, W - 20, 3)

      x.font = '12px "Teko"'; x.fillStyle = G2 + '.5)'; x.fillText('HADAL INTELLIGENCE ASSESSMENT', 18, 100)
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.2)'
      x.fillText('SERIAL:HADAL-2026-0322-001', 18, 114)
      const now = new Date(); x.fillText('DTG:' + now.toISOString().slice(0, 19).replace(/[-:T]/g, '') + 'Z', 18, 126)
      x.fillStyle = G2 + '.06)'; x.fillRect(18, 132, W - 40, 1)

      // Typewriter content
      const lines: { f: string; c: string; t2: string; y: number }[] = [
        { f: '7px "Teko"', c: G2 + '.4)', t2: '1. SITUATION', y: 148 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: 'Theatre threat: ORANGE (67/100).', y: 162 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: 'Primary driver: IRGC posture shift.', y: 174 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '4 kinetic events in 24h window.', y: 186 },
        { f: '7px "Teko"', c: G2 + '.4)', t2: '2. KEY JUDGMENTS', y: 206 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• Escalation dominant (P=34%)', y: 220 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• Naval blockade risk +4%', y: 232 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• ADS-B anomalies correlate SAM', y: 244 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• Social chatter spike (3 platforms)', y: 256 },
        { f: '7px "Teko"', c: G2 + '.4)', t2: '3. OUTLOOK (UNIFIED FEED)', y: 276 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '72h: DETERIORATING. Cascade 0.62.', y: 290 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: 'Sources: GOV+NEWS+CHATTER+SNSR', y: 302 },
      ]
      const totalC = lines.reduce((s, l) => s + l.t2.length, 0)
      const charP = Math.floor((t * 20) % totalC)
      let drawn = 0
      lines.forEach(line => {
        const vis = Math.min(line.t2.length, Math.max(0, charP - drawn)); drawn += line.t2.length
        if (vis <= 0) return
        x.font = line.f; x.fillStyle = line.c; x.fillText(line.t2.slice(0, vis), 18, line.y)
        if (vis < line.t2.length && vis > 0 && Math.sin(t * 6) > 0) {
          const tw = x.measureText(line.t2.slice(0, vis)).width
          x.fillStyle = G; x.fillRect(18 + tw + 1, line.y - 6, 4, 8)
        }
      })

      // Amber footer
      const fb = Math.sin(t * 1.5) > 0.2
      x.fillStyle = 'rgba(255,152,20,.05)'; x.fillRect(10, H - 38, W - 20, 16)
      x.strokeStyle = 'rgba(255,152,20,.15)'; x.strokeRect(10, H - 38, W - 20, 16)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = fb ? 'rgba(255,152,20,.45)' : 'rgba(255,152,20,.12)'
      x.fillText('DISTRIBUTION: HADAL OPERATORS ONLY', 18, H - 28)

      stamp(x, 4, H - 28, 'SYS:REPORT-GEN')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
