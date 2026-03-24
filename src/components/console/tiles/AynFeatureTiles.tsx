import { useEffect, useRef } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'
import { G, G2, AMB, BG, PI, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

// --- ArgusTile: entity/pipeline/corroboration — adapted for lm arrow bay
// lm clip-path: polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)
// Arrow points RIGHT. Content flows: arc (left) → pipeline → factor output (right).
// Factor bars EMANATE from arc right edge — no rectangular panel header.

export function ArgusTile({ incidents }: { incidents: Incident[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number

    const verified = incidents.filter(i => (i as any).verificationBadge === 'VERIFIED').length
    const total = incidents.length || 1
    const resTarget = Math.min(0.96, Math.max(0.42, verified / total * 0.6 + 0.42))
    const actorCount = Math.min(total, 24)

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      rasterBase(x, W, H, 0.12, DPR)
      const t = Date.now() / 1000

      // Dense binary field — substrate texture
      if (Math.floor(t * 60) % 3 === 0) {
        x.font = '6px "Share Tech Mono"'
        for (let row = 0; row < H; row += 7) for (let col = 0; col < W; col += 6) {
          const v = Math.sin(row * 0.1 + col * 0.06 + t * 0.4) > 0.5
          x.fillStyle = G2 + (v ? '.1)' : '.02)')
          x.fillText(v ? '1' : '0', col, row)
        }
      }

      // ── ENTITY RESOLUTION ARC (left anchor) ────────────────────────────────
      const rad = Math.min(72, H * 0.34)
      const cx = W * 0.26, cy = H * 0.46
      const res = Math.min(resTarget, ((t * 0.15) % 1.3) * resTarget / 0.7)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 11
      x.beginPath(); x.arc(cx, cy, rad, -PI * 0.8, PI * 0.8); x.stroke()
      x.strokeStyle = G; x.lineWidth = 11
      x.beginPath(); x.arc(cx, cy, rad, -PI * 0.8, -PI * 0.8 + PI * 1.6 * res); x.stroke()
      x.strokeStyle = G2 + '.14)'; x.lineWidth = 1
      x.beginPath(); x.arc(cx, cy, rad - 9, -PI * 0.8, PI * 0.8); x.stroke()
      for (let i = 0; i <= 20; i++) {
        const a = -PI * 0.8 + PI * 1.6 * (i / 20)
        const i1 = rad + 7, i2 = rad + (i % 5 === 0 ? 14 : 10)
        x.strokeStyle = G2 + (i % 5 === 0 ? '.30)' : '.10)'); x.lineWidth = i % 5 === 0 ? 1.5 : 1
        x.beginPath(); x.moveTo(cx + Math.cos(a) * i1, cy + Math.sin(a) * i1); x.lineTo(cx + Math.cos(a) * i2, cy + Math.sin(a) * i2); x.stroke()
      }
      const tipA = -PI * 0.8 + PI * 1.6 * res
      x.fillStyle = G
      x.beginPath(); x.arc(cx + Math.cos(tipA) * rad, cy + Math.sin(tipA) * rad, 4, 0, TAU); x.fill()
      x.font = 'bold 54px "Teko"'; x.fillStyle = G; x.textAlign = 'center'
      x.fillText(String(Math.floor(res * 100)), cx, cy + 16)
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.28)'
      x.fillText('RESOLUTION', cx, cy + 28); x.textAlign = 'left'

      // ── PIPELINE FLOW CHANNEL — arc right edge → factor zone ──────────────
      const arcRight = cx + rad
      const factorStartX = arcRight + 52   // labels here
      const trackStartX  = arcRight + 98   // bar tracks here
      const trackW       = W * 0.92 - trackStartX

      // Flow corridor from arc to factors (horizontal dashes at cy)
      x.strokeStyle = G2 + '.10)'; x.lineWidth = 1; x.setLineDash([3, 5])
      x.beginPath(); x.moveTo(arcRight + 5, cy); x.lineTo(factorStartX - 4, cy); x.stroke()
      x.setLineDash([])
      // Animated data packet flowing right
      const pktP = (t * 1.4) % 1
      const pktX = arcRight + 5 + (factorStartX - arcRight - 10) * pktP
      x.fillStyle = G; x.fillRect(pktX - 3, cy - 3, 6, 6)

      // ── ENTITY FACTOR BARS — emanate from arc, no panel header ────────────
      // Bars flow rightward from arc edge. Labels left of track, values right.
      const factors: [string, number, number][] = [
        ['ENT GRAPH', 76, 0], ['SRC LINK',  88, 0], ['GEO ANCH', 71, 0],
        ['TEMPORAL',  82, 0], ['CREDIBIL',  79, 0], ['VERIFIED', 65, 0],
        ['CORROB',    88, 0], ['PIPELINE',  72, 0], ['CONTRA',   14, 1],
      ]
      const fh = Math.min(16, (H * 0.85) / factors.length)
      const fyStart = cy - (factors.length * fh) / 2

      factors.forEach(([label, val, warn], i) => {
        const y = fyStart + i * fh
        const fillDelay = i * 0.08
        const fillP = Math.min(1, Math.max(0, ((t * 0.2) % 1.4 - fillDelay) * 2))

        // Label (5px mono, left of track)
        x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.28)'; x.fillText(label, factorStartX, y + 8)
        // Bar track
        x.fillStyle = G2 + '.04)'; x.fillRect(trackStartX, y + 2, trackW, 7)
        // Bar fill
        x.fillStyle = warn ? 'rgba(255,152,20,.55)' : G2 + '.50)'
        x.fillRect(trackStartX, y + 2, trackW * (val / 100) * fillP, 7)
        // Value (right of track)
        x.font = '5px "Share Tech Mono"'
        x.fillStyle = G2 + (fillP > 0.7 ? '.38)' : '.12)')
        x.fillText(String(Math.floor(val * fillP)), trackStartX + trackW + 3, y + 8)
      })

      // ── ARROW FLOW INDICATOR — near canvas right edge → pointing to tip ───
      // lm arrow tip is 72px BEYOND canvas right. These markers suggest momentum.
      const arrowX = W * 0.93
      ;[H * 0.35, H * 0.46, H * 0.57].forEach((ay, i) => {
        const pulse = (Math.sin(t * 1.8 + i * 0.9) + 1) * 0.5
        x.fillStyle = G2 + (0.08 + pulse * 0.14).toFixed(2) + ')'
        x.fillText('→', arrowX, ay)
      })

      // Source glyphs — bottom of arc zone
      x.font = '7px "Share Tech Mono"'; x.fillStyle = G2 + '.14)'
      ;['◆' + actorCount, '◈4', '◇6', '▣3'].forEach((s, i) => x.fillText(s, cx - rad + i * 28, H - 18))

      stamp(x, 4, H - 8, 'SYS:ARGUS-ENT')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [incidents])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

// --- ChatterTile: SatelliteTile visual body — source/indicator/social pulse language ---

const _satArt = [
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

export function ChatterTile() {
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

      // Char art — signal collection platform
      const charW = 7, charH = 10
      const artW = _satArt[0].length * charW, artH = _satArt.length * charH
      const ox = fcx - artW / 2, oy = fcy - artH / 2
      x.font = '9px "Share Tech Mono"'
      _satArt.forEach((line, row) => {
        ;[...line].forEach((ch, col) => {
          if (ch === ' ') return
          const bright = ch === '▓' ? 0.7 : 0.22
          const flick = Math.sin(t * 4 + row * 0.6 + col * 0.5) * 0.2 + Math.sin(t * 7 + col) * 0.05
          x.fillStyle = G2 + (bright + flick).toFixed(2) + ')'
          x.fillText(ch, ox + col * charW, oy + row * charH)
        })
      })

      // In-frame labels
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.4)'
      x.fillText('SRC:6 PLATFORM', fcx - fw / 2 + 4, fcy - fh / 2 + 14)
      x.fillText('TG+X+VK+FORUM', fcx - fw / 2 + 4, fcy - fh / 2 + 26)
      x.fillText('VOL:' + (320 + Math.floor(Math.sin(t * 0.5) * 30)) + ' SIG/H', fcx - fw / 2 + 4, fcy + fh / 2 - 8)

      // Source panel (right)
      const rx = W * 0.62
      x.fillStyle = 'rgba(5,7,0,.75)'; x.fillRect(rx, 48, W - rx - 4, H - 76)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(rx, 48, W - rx - 4, H - 76)
      x.fillStyle = G2 + '.2)'; x.fillRect(rx, 48, W - rx - 4, 3)
      x.font = '7px "Teko"'; x.fillStyle = G2 + '.45)'; x.fillText('SOURCE PANEL', rx + 6, 66)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.35)'
      ;['SRCS:6 ACTIVE', 'TG:HIGH', 'X:MED', 'VK:LOW', 'FORUM:MED', 'IRC:LOW', 'SIGNAL:OFF', 'VOL:ELEVATED', 'THREAT%:34'].forEach((s, i) => x.fillText(s, rx + 6, 82 + i * 16))

      // Signal propagation arc
      x.save(); x.translate(rx + 50, H - 55)
      x.strokeStyle = G2 + '.15)'; x.lineWidth = 1
      x.beginPath(); x.ellipse(0, 0, 42, 13, 0, 0, PI); x.stroke()
      x.fillStyle = G
      x.fillRect(Math.cos(t * 1.2) * 42 - 3, -Math.sin(t * 1.2) * 13 - 3, 6, 6)
      x.restore()

      stamp(x, 4, H - 28, 'SYS:CHATTER-SOCL')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

// --- IgniteTile: ScenarioOutlookTile visual body — thermal/hotspot/scan language ---

export function IgniteTile({ incidents }: { incidents: Incident[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number

    // Compute hotspot proxy from incidents
    const kineticCounts: Record<string, number> = {}
    incidents.forEach(inc => {
      const type = (inc.type || '').toLowerCase()
      if (['missile', 'drone', 'attack', 'airstrike', 'ground'].some(k => type.includes(k))) {
        const country = (inc.location?.country || 'UNKNOWN').trim()
        kineticCounts[country] = (kineticCounts[country] || 0) + 1
      }
    })
    const zones = Object.entries(kineticCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const totalZones = zones.length

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      x.fillStyle = '#030500'; x.fillRect(0, 0, W, H)
      const t = Date.now() / 1000


      // Left panel
      x.fillStyle = 'rgba(5,7,0,.82)'; x.fillRect(18, 52, W * 0.48, H - 80)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(18, 52, W * 0.48, H - 80)
      x.fillStyle = G2 + '.2)'; x.fillRect(18, 52, W * 0.48, 3)

      x.font = '7px "Teko"'; x.fillStyle = G2 + '.4)'; x.fillText('IGNITE SCAN ZONES', 26, 68)
      x.font = 'bold 56px "Teko"'; x.fillStyle = G; x.fillText(String(totalZones || '---'), 26, 126)
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'; x.fillText('ACTIVE HOT ZONES', 90, 112)
      x.fillStyle = G2 + '.35)'; x.fillText('SOURCE:', 26, 142); x.fillStyle = AMB; x.fillText('INCIDENT PROXY', 58, 142)
      x.fillStyle = G2 + '.2)'; x.font = '5px "Share Tech Mono"'; x.fillText('NO FIRMS FEED — UPSTREAM MODULE', 26, 154)

      // Hotspot table
      x.fillStyle = G2 + '.05)'; x.fillRect(22, 164, W * 0.46, 14)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'
      x.fillText('ZONE', 26, 174); x.fillText('EVT', 132, 174); x.fillText('HEAT', 152, 174); x.fillText('SRC', 180, 174)
      const aRow = Math.floor(t * 0.5) % Math.max(zones.length, 1)
      const rows: [string, number, string, string][] = zones.length
        ? zones.map(([c, n]) => [c.slice(0, 11), n, n > 5 ? 'CRIT' : n > 2 ? 'HIGH' : 'MED', 'PROXY'] as [string, number, string, string])
        : [['NO DATA', 0, '---', 'NONE'], ['UPSTREAM', 0, '---', 'NONE'], ['MODULE', 0, '---', 'NONE'], ['AWAITING', 0, '---', 'NONE'], ['FIRMS', 0, '---', 'NONE']]
      rows.forEach(([n, p, s, w], i) => {
        const sy = 186 + i * 14; const isA = i === aRow
        if (isA) { x.fillStyle = G2 + '.04)'; x.fillRect(22, sy - 9, W * 0.46, 14) }
        const al = isA ? 0.7 : 0.45 - 0.04 * i
        x.fillStyle = G2 + al.toFixed(2) + ')'; x.font = '5px "Share Tech Mono"'
        x.fillText(n, 26, sy); x.fillText(String(p || '0'), 132, sy)
        x.fillStyle = s === 'CRIT' || s === 'HIGH' ? AMB : G2 + al.toFixed(2) + ')'; x.fillText(s, 152, sy)
        x.fillStyle = G2 + al.toFixed(2) + ')'; x.fillText(w, 180, sy)
      })

      // Right panel — scan windows
      x.fillStyle = 'rgba(5,7,0,.82)'; x.fillRect(W * 0.52, 52, W * 0.46, H - 80)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(W * 0.52, 52, W * 0.46, H - 80)
      x.fillStyle = G2 + '.2)'; x.fillRect(W * 0.52, 52, W * 0.46, 3)
      x.font = '7px "Teko"'; x.fillStyle = G2 + '.4)'; x.fillText('SCAN WINDOWS', W * 0.52 + 8, 68)

      ;([{ n: '24H', s: 'NO DATA', d: 'UPSTREAM' }, { n: '72H', s: 'NO DATA', d: 'MODULE' }, { n: '7D', s: 'NO DATA', d: 'AWAITING' }]).forEach((w, i) => {
        const wy = 80 + i * 72, wx = W * 0.52 + 8, ww = W * 0.46 - 16
        x.fillStyle = G2 + '.015)'; x.fillRect(wx, wy, ww, 60)
        x.strokeStyle = G2 + '.06)'; x.strokeRect(wx, wy, ww, 60)
        x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.4)'; x.fillText(w.n + ' SCAN', wx + 6, wy + 14)
        x.fillStyle = AMB; x.fillText(w.s, wx + ww - 50, wy + 14)
        x.fillStyle = G2 + '.3)'; x.fillText('EVT:---', wx + 6, wy + 30)
        x.fillStyle = G2 + '.2)'; x.fillText(w.d, wx + 6, wy + 42)
        const prog = ((t * 0.08 + i * 0.3) % 1)
        x.fillStyle = G2 + '.05)'; x.fillRect(wx + 6, wy + 52, ww - 12, 4)
        x.fillStyle = 'rgba(255,152,20,.15)'; x.fillRect(wx + 6, wy + 52, (ww - 12) * prog, 4)
      })

      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.2)'
      x.fillText('FIRMS:OFFLINE SENTINEL:PROXY', W * 0.52 + 8, H - 34)

      stamp(x, 4, H - 28, 'SYS:IGNITE-SCAN')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [incidents])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

// --- ChronosTile: IntelligenceTile visual body — delta/change/comparison language ---

export function ChronosTile({ incidents }: { incidents: Incident[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number

    // Temporal delta computation
    const now = Date.now()
    const countW = (from: number, to: number) => incidents.filter(inc => {
      const pub = inc.published ? new Date(inc.published).getTime() : 0
      return pub >= from && pub < to
    }).length
    const last24 = countW(now - 86400000, now)
    const prev24 = countW(now - 172800000, now - 86400000)
    const last7d = countW(now - 604800000, now)
    const prev7d = countW(now - 1209600000, now - 604800000)
    const delta24 = prev24 === 0 ? last24 * 100 : Math.round((last24 - prev24) / prev24 * 100)
    const delta7d = prev7d === 0 ? last7d * 100 : Math.round((last7d - prev7d) / prev7d * 100)
    const velocity = Math.max(0, last24 - prev24)
    const kinetic = incidents.filter(inc => ['missile', 'drone', 'attack', 'airstrike'].some(k => ((inc.type || '').toLowerCase()).includes(k))).length

    const cellData = [
      { l: '24H EVT', b: last24, w: 0 },
      { l: '24H SHIFT', b: delta24, w: delta24 > 50 ? 1 : 0 },
      { l: '7D DELTA', b: delta7d, w: delta7d > 40 ? 1 : 0 },
      { l: 'VELOCITY', b: velocity, w: 0 },
      { l: 'KINETIC', b: kinetic, w: kinetic > 5 ? 1 : 0 },
      { l: '7D EVT', b: last7d, w: 0 },
      { l: 'BASELINE', b: prev24, w: 0 },
      { l: 'CASCADE', b: 62, w: 1 },
    ]

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
      const ox = W * 0.2, oy = H * 0.08, ow = W * 0.62, oh = H * 0.82
      x.strokeStyle = G; x.lineWidth = 1.5; x.strokeRect(ox, oy, ow, oh)
      x.strokeStyle = G2 + '.4)'; x.lineWidth = 1.2; x.strokeRect(W * 0.34, H * 0.32, W * 0.22, H * 0.22)

      // Corner brackets
      const tk = 10
      x.strokeStyle = G2 + '.6)'; x.lineWidth = 0.8
      ;([[ox, oy, 1, 1], [ox + ow, oy, -1, 1], [ox, oy + oh, 1, -1], [ox + ow, oy + oh, -1, -1]] as [number, number, number, number][]).forEach(([bx, by, dx, dy]) => {
        x.beginPath(); x.moveTo(bx - dx * tk, by); x.lineTo(bx + dx * tk, by); x.moveTo(bx, by - dy * tk); x.lineTo(bx, by + dy * tk); x.stroke()
      })

      // Circle ring
      x.strokeStyle = G2 + '.5)'; x.lineWidth = 1.5
      x.beginPath(); x.arc(W * 0.26, H * 0.14, W * 0.02, 0, TAU); x.stroke()

      // IC element
      const ix = stripX + 2, iy = H * 0.12
      x.strokeStyle = G2 + '.4)'; x.lineWidth = 0.8; x.strokeRect(ix, iy, stripW - 4, H * 0.06)
      x.strokeStyle = G2 + '.2)'; x.lineWidth = 0.5
      for (let p = 0; p < 3; p++) {
        x.beginPath(); x.moveTo(ix - 4, iy + 4 + p * 6); x.lineTo(ix, iy + 4 + p * 6); x.stroke()
        x.beginPath(); x.moveTo(ix + stripW - 4, iy + 4 + p * 6); x.lineTo(ix + stripW, iy + 4 + p * 6); x.stroke()
      }

      // Stat cells — temporal deltas
      const cells = [
        { ...cellData[0], wx: W * 0.05, wy: H * 0.18 },
        { ...cellData[1], wx: W * 0.05, wy: H * 0.34 },
        { ...cellData[2], wx: W * 0.05, wy: H * 0.50 },
        { ...cellData[3], wx: W * 0.05, wy: H * 0.66 },
        { ...cellData[4], wx: W * 0.66, wy: H * 0.18 },
        { ...cellData[5], wx: W * 0.66, wy: H * 0.34 },
        { ...cellData[6], wx: W * 0.66, wy: H * 0.50 },
        { ...cellData[7], wx: W * 0.66, wy: H * 0.66 },
      ]
      const activeP = Math.floor(t * 1.2) % cells.length
      cells.forEach((cell, i) => {
        const isA = i === activeP
        const padS = W * 0.04
        x.fillStyle = isA ? G : G2 + '.5)'; x.fillRect(cell.wx, cell.wy, padS, padS * 0.85)
        if (!isA) { x.fillStyle = BG; x.fillRect(cell.wx + padS * 0.2, cell.wy + padS * 0.25, padS * 0.6, padS * 0.35) }
        const jit = isA ? Math.floor(Math.sin(t * 8) * 2) : 0
        x.font = '500 11px "Teko"'; x.fillStyle = cell.w ? AMB : G
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

      // Temporal labels (replace timestamps)
      x.font = '500 11px "Teko"'; x.fillStyle = G2 + '.5)'
      x.fillText('24H', W * 0.36, H * 0.55)
      x.fillText('7D', W * 0.72, H * 0.12)
      x.fillText('DELTA', W * 0.1, H * 0.7)

      stamp(x, 4, H - 28, 'SYS:CHRONOS-DELTA')
      rafId = requestAnimationFrame(draw)
    }
    document.fonts.ready.then(draw)
    return () => cancelAnimationFrame(rafId)
  }, [incidents])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

// --- SkylineTile: ReportsTile visual body — operational weather/condition language ---

export function SkylineTile() {
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

      // Giant background type — ops weather
      const br = Math.sin(t * 0.3) * 0.015 + 0.035
      x.font = 'bold 130px "Teko"'; x.fillStyle = G2 + br.toFixed(3) + ')'; x.fillText('OPS', W * 0.03, H * 0.38)
      x.strokeStyle = G2 + (br + 0.03).toFixed(3) + ')'; x.lineWidth = 1; x.strokeText('OPS', W * 0.03, H * 0.38)
      x.font = 'bold 70px "Teko"'; x.fillStyle = G2 + (br * 0.7).toFixed(3) + ')'; x.fillText('WEATHER', W * 0.08, H * 0.54)

      // Amber bar — upstream module warning
      const cf = Math.sin(t * 2) > 0.6 ? 0.95 : 0.7
      x.fillStyle = 'rgba(255,152,20,' + cf.toFixed(2) + ')'; x.fillRect(0, 48, W, 22)
      x.fillStyle = BG; x.font = 'bold 11px "Teko"'; x.fillText('⚠ UPSTREAM MODULE — NO WEATHER DATA', 8, 64)
      x.font = '8px "Teko"'; x.fillText('SKYLINE / PENDING', W - 96, 64)

      // Ops condition panel
      x.fillStyle = 'rgba(5,7,0,.85)'; x.fillRect(10, 80, W - 20, H - 110)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(10, 80, W - 20, H - 110)
      x.fillStyle = G2 + '.2)'; x.fillRect(10, 80, W - 20, 3)

      x.font = '12px "Teko"'; x.fillStyle = G2 + '.5)'; x.fillText('SKYLINE — OPS WEATHER FEED', 18, 100)
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.2)'
      x.fillText('MODULE:SKYLINE-OPS', 18, 114)
      const now = new Date(); x.fillText('DTG:' + now.toISOString().slice(0, 19).replace(/[-:T]/g, '') + 'Z', 18, 126)
      x.fillStyle = G2 + '.06)'; x.fillRect(18, 132, W - 40, 1)

      // Typewriter conditions content — honest no-data labeling
      const lines: { f: string; c: string; t2: string; y: number }[] = [
        { f: '7px "Teko"', c: G2 + '.4)', t2: '1. WEATHER STATUS', y: 148 },
        { f: '5px "Share Tech Mono"', c: AMB, t2: 'No upstream feed connected.', y: 162 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: 'Awaiting Skyline module integration.', y: 174 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: 'Shell held live for wrap migration.', y: 186 },
        { f: '7px "Teko"', c: G2 + '.4)', t2: '2. OPS CONDITIONS', y: 206 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• Drone corridor: NO DATA', y: 220 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• Visibility: NO DATA', y: 232 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• Wind vector: NO DATA', y: 244 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: '• Theatre coverage: PROXY ONLY', y: 256 },
        { f: '7px "Teko"', c: G2 + '.4)', t2: '3. INTEGRATION STATUS', y: 276 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: 'METAR/TAF feed: DISCONNECTED', y: 290 },
        { f: '5px "Share Tech Mono"', c: G2 + '.3)', t2: 'Source: SKYLINE-UPSTREAM / PENDING', y: 302 },
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
      x.fillText('DISTRIBUTION: HADAL OPERATORS ONLY — SKYLINE PENDING', 18, H - 28)

      stamp(x, 4, H - 28, 'SYS:SKYLINE-OPS')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
