import { useEffect, useRef } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'
import { G, G2, AMB, BG, PI, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'
import { DevTag } from '@/components/shared/DevTag'

// ThreatSignalTile — ESE circuit board adapted for ul chamfered bay
// ul clip-path: polygon(0 0, 100% 0, 100% 65%, 82% 100%, 0 100%)
// The backplane diagonal (right edge → 82% at bottom) is drawn as a circuit edge
// No rectangular overlay panel — data is embedded in the circuit diagram

export function ThreatSignalTile({ incidents }: { incidents: Incident[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number

    // Derive from real incident pipeline — computed once per incidents change
    const kineticTypes = ['missile', 'drone', 'attack', 'airstrike', 'strike']
    const kinetic = incidents.filter(i => kineticTypes.some(k => (i.type || '').toLowerCase().includes(k)))
    const latest = kinetic[0] ?? incidents[0]
    const evtId = latest
      ? 'EVT-' + String(latest.circuitBreaker?.eventId ?? incidents.indexOf(latest)).slice(-5).padStart(5, '0')
      : 'EVT-STATIC'
    const evtType = (latest?.type ?? 'COMPOSITE').toUpperCase().slice(0, 11)
    const sigN = Math.max(1, Math.min(incidents.length, 12))
    const entN = Math.max(1, Math.min(new Set(incidents.map(i => i.location?.country).filter(Boolean)).size, 8))
    const isCrit = kinetic.length > 3
    const pulseSpeed = 50 + Math.min(incidents.length, 80)

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      rasterBase(x, W, H, 0.08, DPR)
      const t = Date.now() / 1000

      // PCB substrate grid — 10px chip grid, full tile
      x.strokeStyle = G2 + '.04)'; x.lineWidth = 1
      for (let i = 0; i < W; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke() }
      for (let i = 0; i < H; i += 10) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke() }

      // ── BACKPLANE CHAMFER ────────────────────────────────────────────────────
      // ul bay: chamfer on bottom-right — polygon(100%,65% → 82%,100%).
      // In body coords (body-right=90px) the diagonal maps to (W, 0.65H)→(0.86W, H).
      // Only the bottom-right corner is cut — no fault above chamferY.
      const chamferY = H * 0.65   // y where bay diagonal begins
      const fltXBot  = W * 0.86   // x at bottom of chamfer (~82% element in body coords)
      const busEnd   = W * 0.70   // buses and IC blocks terminate here (unchanged)

      // Chamfer fill — bottom-right triangle only
      x.fillStyle = G2 + '.012)'
      x.beginPath()
      x.moveTo(W, chamferY); x.lineTo(W, H); x.lineTo(fltXBot, H)
      x.closePath(); x.fill()

      // Chamfer edge — dashed, representing the new bay geometry
      x.strokeStyle = G2 + '.22)'; x.lineWidth = 1; x.setLineDash([3, 6])
      x.beginPath(); x.moveTo(W, chamferY); x.lineTo(fltXBot, H); x.stroke()
      x.setLineDash([])

      // ── THREE SIGNAL BUSES ───────────────────────────────────────────────────
      const buses = [
        { y: H * 0.20, label: 'SIG', n: sigN, hot: false },
        { y: H * 0.50, label: 'EVT', n: 1,    hot: isCrit },
        { y: H * 0.80, label: 'ENT', n: entN,  hot: false },
      ]

      buses.forEach((b, bi) => {
        const busColor = b.hot ? 'rgba(255,152,20,' : G2

        // Bus background band
        x.fillStyle = busColor + '.02)'; x.fillRect(0, b.y - 6, busEnd, 12)
        // Main bus conductor
        x.strokeStyle = busColor + '.28)'; x.lineWidth = 3
        x.beginPath(); x.moveTo(0, b.y); x.lineTo(busEnd, b.y); x.stroke()
        // Guide rails
        x.strokeStyle = busColor + '.07)'; x.lineWidth = 1
        x.beginPath(); x.moveTo(0, b.y - 4); x.lineTo(busEnd, b.y - 4); x.stroke()
        x.beginPath(); x.moveTo(0, b.y + 4); x.lineTo(busEnd, b.y + 4); x.stroke()
        // Bus label stamp
        x.fillStyle = G2 + '.06)'; x.fillRect(2, b.y - 14, 32, 10)
        x.font = 'bold 8px "Teko"'; x.fillStyle = G2 + '.55)'
        x.fillText(b.label + ' ×' + b.n, 4, b.y - 6)
        // Bus terminus at backplane edge
        x.strokeStyle = busColor + '.40)'; x.lineWidth = 2
        x.beginPath(); x.moveTo(busEnd, b.y - 9); x.lineTo(busEnd, b.y + 9); x.stroke()

        // Animated pulses — speed from incident count
        for (let p = 0; p < 5; p++) {
          const px = ((t * pulseSpeed + p * 60 + bi * 48) % busEnd)
          x.fillStyle = b.hot ? AMB : G
          x.fillRect(px - 8, b.y - 2.5, 16, 5)
          x.fillStyle = busColor + '.28)'; x.fillRect(px - 30, b.y - 1.5, 22, 3)
          x.fillStyle = busColor + '.09)'; x.fillRect(px - 52, b.y - 1, 22, 2)
        }
      })

      // ── VERTICAL CONNECTORS ──────────────────────────────────────────────────
      ;[W * 0.18, W * 0.30, W * 0.44, W * 0.57, W * 0.68].forEach((vx, i) => {
        if (vx > busEnd) return
        x.strokeStyle = G2 + '.10)'; x.lineWidth = 1.5
        x.beginPath(); x.moveTo(vx, H * 0.20); x.lineTo(vx, H * 0.50); x.stroke()
        x.beginPath(); x.moveTo(vx, H * 0.50); x.lineTo(vx, H * 0.80); x.stroke()
        ;[H * 0.20, H * 0.50, H * 0.80].forEach(py => {
          x.fillStyle = G2 + '.58)'; x.fillRect(vx - 4, py - 4, 8, 8)
          x.fillStyle = BG;         x.fillRect(vx - 1.5, py - 1.5, 3, 3)
        })
        const p1 = ((t * 0.5 + i * 0.13) % 1)
        x.fillStyle = G; x.fillRect(vx - 3, H * 0.20 + H * 0.30 * p1 - 3, 6, 6)
        const p2 = ((t * 0.4 + i * 0.17 + 0.5) % 1)
        x.fillStyle = G; x.fillRect(vx - 3, H * 0.50 + H * 0.30 * p2 - 3, 6, 6)
      })

      // ── IC BLOCKS — confined to left-center zone (x < 0.68W) ────────────────
      ;[
        { px: W * 0.22, py: H * 0.35, label: 'FUSE',  sub: 'SIG→EVT' },
        { px: W * 0.38, py: H * 0.35, label: 'DEDUP', sub: 'HASH·CHK' },
        { px: W * 0.30, py: H * 0.65, label: 'GRAPH', sub: 'ENT→LINK' },
        { px: W * 0.52, py: H * 0.65, label: 'NORM',  sub: 'CANON' },
      ].forEach(ic => {
        if (ic.px > W * 0.68) return
        const iw = 52, ih = 24
        x.fillStyle = G2 + '.05)'; x.fillRect(ic.px - iw / 2, ic.py - ih / 2, iw, ih)
        x.strokeStyle = G2 + '.40)'; x.lineWidth = 1.5; x.strokeRect(ic.px - iw / 2, ic.py - ih / 2, iw, ih)
        // IC pins
        for (let p = 0; p < 4; p++) {
          x.fillStyle = G2 + '.30)'
          x.fillRect(ic.px - iw / 2 - 3, ic.py - ih / 2 + 3 + p * 4, 2, 2)
          x.fillRect(ic.px + iw / 2 + 1,  ic.py - ih / 2 + 3 + p * 4, 2, 2)
        }
        x.font = 'bold 7px "Teko"'; x.fillStyle = G; x.textAlign = 'center'
        x.fillText(ic.label, ic.px, ic.py + 2)
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.28)'
        x.fillText(ic.sub, ic.px, ic.py + 9)
        x.textAlign = 'left'
      })

      // ── EVT RECORD — inline in right zone, no box ───────────────────────────
      const rx = busEnd + 5
      x.font = '5px "Share Tech Mono"'
      x.fillStyle = isCrit ? 'rgba(255,152,20,.70)' : G2 + '.48)'
      x.fillText(evtId,   rx, H * 0.22)
      x.fillStyle = isCrit ? 'rgba(255,152,20,.52)' : G2 + '.38)'
      x.fillText(evtType, rx, H * 0.38)
      x.fillStyle = G2 + '.28)'
      x.fillText('SIG:' + sigN, rx, H * 0.56)
      x.fillText('ENT:' + entN, rx, H * 0.72)

      stamp(x, 4, H - 8, 'SYS:ESE-ARCH')
      rafId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafId)
  }, [incidents])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <DevTag id="C" />
    </div>
  )
}
