import { useEffect, useRef } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'
import { G, G2, AMB, BG, PI, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'
import { DevTag } from '@/components/shared/DevTag'

// --- ArgusTile: entity/pipeline/corroboration — adapted for lm arrow bay
// lm clip-path: polygon(0 0, 80% 0, 100% 50%, 80% 100%, 0 100%)
// Arrow points RIGHT. Content flows: arc (left) → pipeline → factor output (right).
// Factor bars EMANATE from arc right edge — no rectangular panel header.

export function ArgusTile({ incidents }: { incidents: Incident[] }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number

    const total       = incidents.length || 1
    const verified    = incidents.filter(i => (i as any).verificationBadge === 'VERIFIED').length
    const likely      = incidents.filter(i => (i as any).verificationBadge === 'LIKELY').length
    const unconfirmed = incidents.filter(i => (i as any).verificationBadge === 'UNCONFIRMED' || i.status === 'unconfirmed').length
    const credAvg     = Math.round(incidents.reduce((s, i) => s + (i.credibility ?? 50), 0) / total)
    const geoTagged   = incidents.filter(i => i.location?.country).length
    const withTs      = incidents.filter(i => i.published).length
    const srcCount    = new Set(incidents.map(i => i.source).filter(Boolean)).size
    const multiSrc    = incidents.filter(i => ((i as any).numSources ?? 1) > 1 || (i as any).verificationBadge === 'VERIFIED').length
    const govSrc      = incidents.filter(i => i.is_government).length
    const resTarget   = Math.min(0.96, Math.max(0.42, verified / total * 0.6 + 0.42))
    const actorCount  = Math.min(total, 24)

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

      // ── ENTITY FACTOR BARS — computed from live incident data ─────────────
      const srcDivPct   = Math.min(98, Math.round(srcCount / Math.max(10, total) * 200))
      const geoPct      = Math.round(geoTagged / total * 100)
      const tsPct       = Math.round(withTs / total * 100)
      const vfyPct      = Math.round((verified + likely) / total * 100)
      const corrobPct   = Math.round(multiSrc / total * 100)
      const contraPct   = Math.round(unconfirmed / total * 100)
      const pipelinePct = Math.min(96, 65 + Math.round(verified / total * 30))
      const entPct      = Math.min(98, actorCount * 4)
      // Groups: identity | geo-temporal | verification | system (sep after indices 1, 3, 6)
      const factors: [string, number, number, boolean][] = [
        ['ENT GRAPH', entPct,      0, false],
        ['SRC LINK',  srcDivPct,   0, true],   // sep after
        ['GEO ANCH',  geoPct,      0, false],
        ['TEMPORAL',  tsPct,       0, true],   // sep after
        ['CREDIBIL',  credAvg,     credAvg < 60 ? 1 : 0, false],
        ['VERIFIED',  vfyPct,      0, false],
        ['CORROB',    corrobPct,   0, true],   // sep after
        ['PIPELINE',  pipelinePct, 0, false],
        ['CONTRA',    contraPct,   contraPct > 30 ? 1 : 0, false],
      ]
      const fh = Math.min(14, (H * 0.78) / factors.length)
      const fyStart = cy - (factors.length * fh) / 2 - 8

      // Section header
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.18)'
      x.fillText('RESOLUTION FACTORS', factorStartX, fyStart - 4)

      factors.forEach(([label, val, warn, sepAfter], i) => {
        const y = fyStart + i * fh
        const fillDelay = i * 0.08
        const fillP = Math.min(1, Math.max(0, ((t * 0.2) % 1.4 - fillDelay) * 2))

        x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.28)'; x.fillText(label, factorStartX, y + 8)
        x.fillStyle = G2 + '.04)'; x.fillRect(trackStartX, y + 2, trackW, 6)
        x.fillStyle = warn ? 'rgba(255,152,20,.55)' : G2 + '.50)'
        x.fillRect(trackStartX, y + 2, trackW * (val / 100) * fillP, 6)
        x.font = '5px "Share Tech Mono"'
        x.fillStyle = G2 + (fillP > 0.7 ? '.38)' : '.12)')
        x.fillText(String(Math.floor(val * fillP)), trackStartX + trackW + 3, y + 8)

        // Group separator
        if (sepAfter) {
          const sepY = y + fh - 1
          x.strokeStyle = G2 + '.06)'; x.lineWidth = 0.5
          x.beginPath(); x.moveTo(factorStartX, sepY); x.lineTo(trackStartX + trackW, sepY); x.stroke()
        }
      })

      // ── ARROW FLOW INDICATOR — near canvas right edge → pointing to tip ───
      // lm arrow tip is 72px BEYOND canvas right. These markers suggest momentum.
      const arrowX = W * 0.93
      ;[H * 0.35, H * 0.46, H * 0.57].forEach((ay, i) => {
        const pulse = (Math.sin(t * 1.8 + i * 0.9) + 1) * 0.5
        x.fillStyle = G2 + (0.08 + pulse * 0.14).toFixed(2) + ')'
        x.fillText('→', arrowX, ay)
      })

      // Source glyphs — bottom of arc zone with labels (ENTITIES/GOV/NON-GOV/VERIF)
      const glyphs = [
        { icon: '◆', val: actorCount,       lbl: 'ENT' },
        { icon: '◈', val: govSrc,            lbl: 'GOV' },
        { icon: '◇', val: total - govSrc,    lbl: 'NGV' },
        { icon: '▣', val: verified,          lbl: 'VFD' },
      ]
      glyphs.forEach(({ icon, val, lbl }, i) => {
        const gx = cx - rad + i * 28
        x.font = '7px "Share Tech Mono"'; x.fillStyle = G2 + '.22)'
        x.fillText(icon, gx, H - 26)
        x.font = '500 9px "Teko"'; x.fillStyle = G2 + '.55)'
        x.fillText(String(val), gx, H - 17)
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.18)'
        x.fillText(lbl, gx, H - 9)
      })

      stamp(x, 4, H - 8, 'SYS:ARGUS-ENT')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [incidents])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <DevTag id="D" />
    </div>
  )
}

// --- ChatterTile: honest offline state — DOM layout ---

const CHATTER_SOURCES = [
  { name: 'Telegram',       status: 'planned' },
  { name: 'X / Twitter',    status: 'planned' },
  { name: 'VK',             status: 'planned' },
  { name: 'Forum Monitor',  status: 'planned' },
  { name: 'IRC',            status: 'off',     label: '---' },
  { name: 'Signal Intercept', status: 'off',  label: 'OFFLINE' },
]

export function ChatterTile() {
  return (
    <div className="chatter-body">
      <div className="chatter-left">
        <div className="chatter-offline-icon">☰</div>
        <div className="chatter-offline-label">CHATTER</div>
        <div className="chatter-offline-badge">NO SOURCES LIVE</div>
        <div className="chatter-purpose">
          Social signal monitoring<br />
          across open-source<br />
          platform channels
        </div>
        <div className="chatter-proxy">
          PIPELINE SOURCES<br />
          0 CONNECTED
        </div>
      </div>
      <div className="chatter-right">
        <div className="chatter-panel-title">PLANNED INTEGRATIONS</div>
        {CHATTER_SOURCES.map(src => (
          <div key={src.name} className="chatter-src-row">
            <span className="csr-name">{src.name}</span>
            <span className={`csr-status ${src.status}`}>{src.label ?? 'PLANNED'}</span>
          </div>
        ))}
        <div className="chatter-total">
          <span className="ct-num">0</span>
          <span className="ct-label">LIVE PIPELINE SOURCES</span>
        </div>
      </div>
      <DevTag id="F" />
    </div>
  )
}

// --- IgniteTile: kinetic hotspot scan — DOM layout ---

const IGNITE_KINETIC = ['missile', 'drone', 'attack', 'airstrike', 'ground']
const isKineticInc = (inc: Incident) => IGNITE_KINETIC.some(k => (inc.type || '').toLowerCase().includes(k))

function heatClass(heat: string) {
  if (heat === 'ELEVATED') return 'elevated'
  if (heat === 'ACTIVE') return 'active'
  if (heat === 'NORMAL') return 'normal'
  return 'quiet'
}
function zoneHeatClass(n: number) {
  if (n > 10) return 'crit'
  if (n > 5) return 'high'
  if (n > 2) return 'med'
  return 'low'
}
function zoneHeatLabel(n: number) {
  if (n > 10) return 'CRIT'
  if (n > 5) return 'HIGH'
  if (n > 2) return 'MED'
  return 'LOW'
}

export function IgniteTile({ incidents }: { incidents: Incident[] }) {
  const kineticCounts: Record<string, number> = {}
  incidents.forEach(inc => {
    if (isKineticInc(inc)) {
      const country = (inc.location?.country || 'UNKNOWN').trim()
      kineticCounts[country] = (kineticCounts[country] || 0) + 1
    }
  })
  const zones = Object.entries(kineticCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const totalZones = zones.length

  const nowMs = Date.now()
  const inWindow = (ms: number) => (inc: Incident) =>
    isKineticInc(inc) && !!inc.published && (nowMs - new Date(inc.published).getTime()) < ms
  const scan24H = incidents.filter(inWindow(86400000)).length
  const scan72H = incidents.filter(inWindow(259200000)).length
  const scan7D  = incidents.filter(inWindow(604800000)).length
  const scanWindows = [
    { n: '24H', evt: scan24H, heat: scan24H > 8 ? 'ELEVATED' : scan24H > 3 ? 'ACTIVE' : scan24H > 0 ? 'NORMAL' : 'QUIET', max: 20 },
    { n: '72H', evt: scan72H, heat: scan72H > 20 ? 'ELEVATED' : scan72H > 8 ? 'ACTIVE' : scan72H > 0 ? 'NORMAL' : 'QUIET', max: 50 },
    { n: '7D',  evt: scan7D,  heat: scan7D  > 40 ? 'ELEVATED' : scan7D  > 15 ? 'ACTIVE' : scan7D  > 0 ? 'NORMAL' : 'QUIET', max: 100 },
  ]

  return (
    <div className="ignite-body">
      <div className="ignite-left">
        <div className="ignite-zones-title">ACTIVE HOT ZONES</div>
        <div className="ignite-zones-hero">
          <span className="ignite-hero-num">{totalZones || '---'}</span>
          <span className="ignite-hero-sub">countries<br />with kinetic<br />activity</span>
        </div>
        <div className="ignite-proxy-tag">▲ INCIDENT PROXY — NO FIRMS FEED</div>
        <div className="ignite-zone-table">
          <div className="ignite-zone-head">
            <span className="izh">COUNTRY</span>
            <span className="izh">EVT</span>
            <span className="izh">HEAT</span>
          </div>
          {zones.length > 0 ? zones.map(([country, count]) => (
            <div key={country} className="ignite-zone-row">
              <span className="izr-name">{country.slice(0, 12)}</span>
              <span className="izr-evt">{count}</span>
              <span className={`izr-heat ${zoneHeatClass(count)}`}>{zoneHeatLabel(count)}</span>
            </div>
          )) : (
            <div className="ignite-zone-row">
              <span className="izr-name" style={{ color: 'rgba(218,255,74,.20)' }}>NO DATA</span>
              <span className="izr-evt">—</span>
              <span className="izr-heat quiet">---</span>
            </div>
          )}
        </div>
      </div>
      <div className="ignite-right">
        <div className="ignite-scan-title">SCAN WINDOWS</div>
        {scanWindows.map(w => (
          <div key={w.n} className={`scan-window${w.evt > 0 ? ' has-data' : ''}`}>
            <div className="scan-win-head">
              <span className="scan-win-period">{w.n}</span>
              <span className={`scan-win-heat ${heatClass(w.heat)}`}>{w.heat}</span>
            </div>
            <div className={`scan-win-evt${w.evt === 0 ? ' no-data' : ''}`}>
              {w.evt > 0 ? w.evt : '---'}
            </div>
            <div className="scan-win-sub">KINETIC EVENTS</div>
            <div className="scan-win-bar">
              <div
                className={`scan-win-bar-fill${w.heat === 'ELEVATED' ? ' elevated' : ''}`}
                style={{ width: `${Math.min(100, Math.round(w.evt / w.max * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <DevTag id="G" />
    </div>
  )
}

// --- ChronosTile: temporal delta grid — DOM layout ---

export function ChronosTile({ incidents }: { incidents: Incident[] }) {
  const now = Date.now()
  const countW = (from: number, to: number) => incidents.filter(inc => {
    const pub = inc.published ? new Date(inc.published).getTime() : 0
    return pub >= from && pub < to
  }).length
  const last24  = countW(now - 86400000, now)
  const prev24  = countW(now - 172800000, now - 86400000)
  const last7d  = countW(now - 604800000, now)
  const prev7d  = countW(now - 1209600000, now - 604800000)
  const delta24 = prev24 === 0 ? (last24 > 0 ? 100 : 0) : Math.round((last24 - prev24) / prev24 * 100)
  const delta7d = prev7d === 0 ? (last7d > 0 ? 100 : 0) : Math.round((last7d - prev7d) / prev7d * 100)
  const velocity = Math.max(0, last24 - prev24)
  const kinetic  = incidents.filter(inc => ['missile', 'drone', 'attack', 'airstrike'].some(k => (inc.type || '').toLowerCase().includes(k))).length
  const hotZones = new Set(
    incidents
      .filter(inc => ['missile', 'drone', 'attack', 'airstrike'].some(k => (inc.type || '').toLowerCase().includes(k))
        && !!inc.published && (now - new Date(inc.published).getTime()) < 86400000)
      .map(inc => inc.location?.country)
      .filter(Boolean)
  ).size

  function fmtDelta(v: number) { return v === 0 ? '0%' : (v > 0 ? '+' : '') + v + '%' }
  function dCls(v: number) { return v > 0 ? 'up' : v < 0 ? 'dn' : 'flat' }

  const cells: { label: string; val: number | string; warn: boolean; dim: boolean; hero: boolean; delta: string; dCls: string }[] = [
    { label: '24H EVENTS', val: last24,          warn: false,           dim: false, hero: true,  delta: '',                                  dCls: '' },
    { label: '24H SHIFT',  val: fmtDelta(delta24),warn: delta24 > 50,  dim: false, hero: false, delta: delta24 > 0 ? '↑ ACCEL' : delta24 < 0 ? '↓ DECLINE' : '→ STABLE', dCls: dCls(delta24) },
    { label: '7D EVENTS',  val: last7d,           warn: false,          dim: true,  hero: false, delta: '',                                  dCls: '' },
    { label: '7D DELTA',   val: fmtDelta(delta7d),warn: delta7d > 40,  dim: false, hero: false, delta: delta7d > 0 ? '↑ TREND UP' : delta7d < 0 ? '↓ TREND DN' : '→ STABLE', dCls: dCls(delta7d) },
    { label: 'BASELINE',   val: prev24,           warn: false,          dim: true,  hero: false, delta: 'PREV 24H',                          dCls: 'flat' },
    { label: 'VELOCITY',   val: velocity,         warn: false,          dim: true,  hero: false, delta: velocity > 0 ? '↑ EVT/DAY' : '→ NONE', dCls: velocity > 0 ? 'up' : 'flat' },
    { label: 'KINETIC',    val: kinetic,          warn: kinetic > 5,    dim: false, hero: false, delta: 'TOTAL IN FEED',                     dCls: 'flat' },
    { label: 'HOT ZONES',  val: hotZones,         warn: hotZones > 4,  dim: false, hero: false, delta: '↑ COUNTRIES / 24H',                 dCls: hotZones > 0 ? 'up' : 'flat' },
  ]

  return (
    <div className="chronos-body">
      <div className="chronos-cells">
        {cells.map((cell, i) => (
          <div key={i} className={`chron-cell${cell.hero ? ' hero' : cell.warn ? ' warn' : ''}`}>
            <span className={`cc-label${cell.warn ? ' warn' : ''}`}>{cell.label}</span>
            <span className={`cc-val${cell.warn ? ' warn' : cell.dim ? ' dim' : ''}`}>{cell.val}</span>
            {cell.delta && <span className={`cc-delta ${cell.dCls}`}>{cell.delta}</span>}
          </div>
        ))}
      </div>
      <div className="chronos-footer">
        <span className="cf-item">WINDOW: <b>7D LOOKBACK</b></span>
        <span className="cf-item">SOURCE: <b>INCIDENT PIPELINE</b></span>
        <span className="cf-item">DERIVED: <b>CLIENT-SIDE</b></span>
      </div>
      <DevTag id="A.18" />
    </div>
  )
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

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <DevTag id="A.19" />
    </div>
  )
}
