import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'
import { G, G2, AMB, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

interface IncidentProps {
  incidents: Incident[]
}

function frameStyle(): CSSProperties {
  return {
    width: '100%',
    height: '100%',
    padding: 8,
    position: 'relative',
    overflow: 'hidden',
    background: '#030500',
    border: '1px solid var(--g20)',
  }
}

function microLabelStyle(color = 'var(--g2)'): CSSProperties {
  return {
    fontFamily: 'var(--MONO)',
    fontSize: '9px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color,
  }
}

function groupBy<T extends string>(items: T[]) {
  const counts = new Map<string, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function topCountries(incidents: Incident[], limit = 4) {
  return groupBy(
    incidents
      .map(incident => incident.location?.country?.trim())
      .filter((value): value is string => Boolean(value)),
  ).slice(0, limit)
}

function latestIncidents(incidents: Incident[], limit = 4) {
  return [...incidents]
    .filter(incident => incident.published)
    .sort((a, b) => new Date(b.published ?? 0).getTime() - new Date(a.published ?? 0).getTime())
    .slice(0, limit)
}

function classifySource(incident: Incident) {
  if (incident.is_government) return 'GOV'
  const source = (incident.source ?? '').toLowerCase()
  if (source.includes('times') || source.includes('reuters') || source.includes('jazeera') || source.includes('news')) return 'NEWS'
  if (source.includes('defense') || source.includes('ministry') || source.includes('wam')) return 'STATE'
  return 'OPEN'
}

function topKeywords(incidents: Incident[], limit = 4) {
  const stop = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'have', 'will', 'into',
    'over', 'after', 'their', 'against', 'last', 'more', 'than', 'near', 'says',
    'iran', 'israel', 'uae', 'gulf', 'war', 'attack', 'attacks',
  ])
  const words: string[] = []
  for (const incident of incidents.slice(0, 48)) {
    for (const raw of (incident.title ?? '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)) {
      if (!raw || raw.length < 4 || stop.has(raw)) continue
      words.push(raw)
    }
  }
  return groupBy(words).slice(0, limit)
}

export function ArgusTile({ incidents }: IncidentProps) {
  const countries = topCountries(incidents)
  const verified = incidents.filter(incident => incident.verificationBadge === 'VERIFIED').length
  const avgCred = incidents.length
    ? Math.round(incidents.reduce((sum, incident) => sum + (incident.credibility ?? 0), 0) / incidents.length)
    : 0
  const max = countries[0]?.[1] ?? 1

  return (
    <div style={frameStyle()}>
      <div style={{ ...microLabelStyle(), marginBottom: 6 }}>Argus / entity pressure index</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 10, height: 'calc(100% - 20px)' }}>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          {countries.length === 0 ? (
            <span style={{ ...microLabelStyle('var(--warn)'), fontSize: '10px' }}>NO INCIDENT CLUSTERS</span>
          ) : countries.map(([country, count]) => (
            <div key={country} style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', ...microLabelStyle() }}>
                <span>{country}</span>
                <span style={{ color: 'var(--g)' }}>{count}</span>
              </div>
              <div style={{ height: 7, border: '1px solid var(--g20)', position: 'relative' }}>
                <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: 'var(--g)' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          <div style={{ border: '1px solid var(--g20)', padding: 8 }}>
            <div style={microLabelStyle()}>Derived threat index</div>
            <div style={{ fontFamily: 'var(--C2)', fontSize: '34px', color: 'var(--g)', lineHeight: 1 }}>{avgCred || '---'}</div>
            <div style={{ ...microLabelStyle('var(--g30)'), marginTop: 2 }}>Pipeline proxy</div>
          </div>
          <div style={{ border: '1px solid var(--g20)', padding: 8 }}>
            <div style={microLabelStyle()}>Verified groups</div>
            <div style={{ fontFamily: 'var(--C2)', fontSize: '26px', color: 'var(--g)', lineHeight: 1 }}>{verified}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const _platforms = ['TG', 'X', 'VK', 'FORUM', 'IRC', 'SIGNAL']
const _tags = ['IRGC', 'HORMUZ', 'MISSILE', 'NAVAL', 'DRONE', 'ARMED', 'DEPLOY', 'CHATTER', 'ALERT', 'THREAT']
function _makeMsgs() {
  return Array.from({ length: 40 }, () => ({
    plat: _platforms[Math.random() * 6 | 0],
    tag: _tags[Math.random() * 10 | 0],
    sent: Math.random() > 0.6 ? 1 : Math.random() > 0.4 ? 0 : -1,
    age: Math.random() * 8,
  }))
}

export function ChatterTile() {
  const ref = useRef<HTMLCanvasElement>(null)
  const msgsRef = useRef(_makeMsgs())

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    const msgs = msgsRef.current

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      rasterBase(x, W, H, 0.07, DPR)
      const t = Date.now() / 1000

      // Platform source columns
      const platW = W * 0.28
      x.fillStyle = 'rgba(5,7,0,.7)'; x.fillRect(4, 48, platW, H - 76)
      x.strokeStyle = G2 + '.1)'; x.lineWidth = 1.5; x.strokeRect(4, 48, platW, H - 76)
      x.fillStyle = G2 + '.2)'; x.fillRect(4, 48, platW, 3)
      x.font = 'bold 8px "Teko"'; x.fillStyle = G2 + '.45)'; x.fillText('SOURCES', 10, 64)
      x.font = '6px "Teko"'; x.fillStyle = G2 + '.3)'; x.fillText('UNIFIED MULTI-SOURCE FEED', 10, 76)

      const platCounts: Record<string, number> = {}
      _platforms.forEach(p => platCounts[p] = 0)
      msgs.forEach(m => platCounts[m.plat]++)

      _platforms.forEach((p, i) => {
        const py = 88 + i * 22
        const cnt = platCounts[p]
        const isOn = cnt > 3
        x.fillStyle = G2 + '.03)'; x.fillRect(8, py, platW - 8, 16)
        x.fillStyle = isOn ? G : G2 + '.15)'; x.fillRect(10, py + 5, 5, 5)
        x.font = '5px "Share Tech Mono"'; x.fillStyle = isOn ? G2 + '.5)' : G2 + '.2)'; x.fillText(p, 20, py + 11)
        x.fillStyle = G2 + '.35)'; x.fillText(cnt + 'sig', platW - 28, py + 11)
        const barW = (platW - 50) * (cnt / 12)
        x.fillStyle = G2 + '.06)'; x.fillRect(42, py + 5, platW - 74, 5)
        x.fillStyle = isOn ? G2 + '.4)' : G2 + '.12)'; x.fillRect(42, py + 5, Math.min(barW, platW - 74), 5)
      })

      // Scrolling chatter stream
      const stX = platW + 12, stW = W - platW - 20
      x.fillStyle = 'rgba(5,7,0,.6)'; x.fillRect(stX, 48, stW, H * 0.55)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1; x.strokeRect(stX, 48, stW, H * 0.55)
      x.fillStyle = G2 + '.15)'; x.fillRect(stX, 48, stW, 3)
      x.font = '6px "Teko"'; x.fillStyle = G2 + '.35)'; x.fillText('CHATTER STREAM', stX + 6, 64)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.2)'; x.fillText(msgs.length + ' SIG TRACKED', stX + stW - 68, 64)

      const visH = H * 0.55 - 24, rowH = 11
      const maxRows = Math.floor(visH / rowH)
      const sorted = [...msgs].sort((a, b) => a.age - b.age)
      sorted.slice(0, maxRows).forEach((m, i) => {
        const my = 72 + i * rowH; if (my > 48 + H * 0.55 - 4) return
        const isNew = m.age < 0.8, isThreat = m.sent === 1
        if (isNew) { x.fillStyle = G2 + '.04)'; x.fillRect(stX + 2, my - 6, stW - 4, rowH) }
        if (isThreat) { x.fillStyle = 'rgba(255,152,20,.02)'; x.fillRect(stX + 2, my - 6, stW - 4, rowH) }
        x.font = '4px "Share Tech Mono"'
        x.fillStyle = isNew ? G : G2 + '.3)'; x.fillText(m.plat.padEnd(6), stX + 6, my)
        x.fillStyle = isThreat ? AMB : isNew ? G2 + '.5)' : G2 + '.25)'; x.fillText(m.tag, stX + 36, my)
        const sentC = m.sent === 1 ? 'rgba(255,152,20,.5)' : m.sent === 0 ? G2 + '.2)' : G2 + '.08)'
        x.fillStyle = sentC; x.fillRect(stX + stW - 18, my - 4, 8, 5)
        x.fillStyle = G2 + '.15)'; x.fillText(m.age.toFixed(0) + 'm', stX + stW - 36, my)
      })

      // Sentiment gauge
      const sgX = stX, sgY = 48 + H * 0.55 + 8, sgW = stW, sgH = H - sgY - 34
      x.fillStyle = 'rgba(5,7,0,.75)'; x.fillRect(sgX, sgY, sgW, sgH)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1; x.strokeRect(sgX, sgY, sgW, sgH)
      x.font = '6px "Teko"'; x.fillStyle = G2 + '.35)'; x.fillText('SENTIMENT AGGREGATE', sgX + 6, sgY + 14)
      const sentData = [{ l: 'THREAT', v: 0.34, c: AMB }, { l: 'NEUTRAL', v: 0.48, c: G2 + '.4)' }, { l: 'LOW/CALM', v: 0.18, c: G2 + '.15)' }]
      sentData.forEach((s, i) => {
        const by = sgY + 22 + i * 16
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'; x.fillText(s.l, sgX + 6, by + 6)
        x.fillStyle = G2 + '.04)'; x.fillRect(sgX + 52, by, sgW - 62, 8)
        x.fillStyle = s.c; x.fillRect(sgX + 52, by, (sgW - 62) * s.v, 8)
        x.fillStyle = G2 + '.3)'; x.fillText(Math.floor(s.v * 100) + '%', sgX + sgW - 22, by + 6)
      })

      // Volume sparkline
      x.fillStyle = 'rgba(5,7,0,.75)'; x.fillRect(4, 48 + H * 0.55 + 8, platW, sgH)
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1; x.strokeRect(4, 48 + H * 0.55 + 8, platW, sgH)
      x.font = '6px "Teko"'; x.fillStyle = G2 + '.35)'; x.fillText('VOLUME / 24H', 10, 48 + H * 0.55 + 22)
      const bars = 24, barSpacing = Math.floor((platW - 12) / bars)
      for (let b = 0; b < bars; b++) {
        const bh = (Math.sin(b * 0.5 + t * 0.2) * 0.3 + 0.5) * sgH * 0.5
        const bx = 8 + b * barSpacing, by2 = 48 + H * 0.55 + sgH - 4
        x.fillStyle = b > 20 ? G2 + '.45)' : G2 + '.15)'; x.fillRect(bx, by2 - bh, barSpacing - 1, bh)
      }

      msgs.forEach(m => {
        m.age += 0.008
        if (m.age > 8) { m.age = 0; m.plat = _platforms[Math.random() * 6 | 0]; m.tag = _tags[Math.random() * 10 | 0]; m.sent = Math.random() > 0.6 ? 1 : Math.random() > 0.4 ? 0 : -1 }
      })

      stamp(x, 4, H - 28, 'SYS:CHATTER-SOCL')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}

export function IgniteTile({ incidents }: IncidentProps) {
  const hotspotRows = groupBy(
    incidents
      .filter(incident => ['missile', 'drone', 'attack', 'airstrike', 'ground'].includes((incident.type ?? '').toLowerCase()))
      .map(incident => incident.location?.country?.trim())
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 4)

  return (
    <div style={frameStyle()}>
      <div style={{ ...microLabelStyle(), marginBottom: 6 }}>Ignite / thermal watch</div>
      <div style={{ position: 'absolute', inset: 8, pointerEvents: 'none', background: 'linear-gradient(180deg, transparent, rgba(255,152,20,.05))' }} />
      <div style={{ display: 'grid', gap: 8, height: 'calc(100% - 20px)', alignContent: 'start' }}>
        <div style={{ border: '1px solid var(--g20)', padding: 8 }}>
          <div style={microLabelStyle('var(--warn)')}>NO FIRMS FEED</div>
          <div style={{ ...microLabelStyle('var(--g30)'), marginTop: 2 }}>Using incident heat proxy until upstream ignition map is wired.</div>
        </div>
        {hotspotRows.map(([country, count]) => (
          <div key={country} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 24px', gap: 6, alignItems: 'center' }}>
            <span style={microLabelStyle()}>{country}</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 2 }}>
              {Array.from({ length: 12 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    display: 'block',
                    height: 10,
                    background: index < Math.min(12, count) ? 'var(--warn)' : 'rgba(218,255,74,.12)',
                  }}
                />
              ))}
            </div>
            <span style={{ ...microLabelStyle('var(--warn)'), fontSize: '10px' }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChronosTile({ incidents }: IncidentProps) {
  const now = Date.now()
  const countWindow = (from: number, to: number) =>
    incidents.filter(incident => {
      const published = incident.published ? new Date(incident.published).getTime() : 0
      return published >= from && published < to
    }).length

  const last24 = countWindow(now - 24 * 3600 * 1000, now)
  const prev24 = countWindow(now - 48 * 3600 * 1000, now - 24 * 3600 * 1000)
  const last7 = countWindow(now - 7 * 24 * 3600 * 1000, now)
  const prev7 = countWindow(now - 14 * 24 * 3600 * 1000, now - 7 * 24 * 3600 * 1000)

  const pairs = [
    { label: '24H SHIFT', current: last24, previous: prev24 },
    { label: '7D DELTA', current: last7, previous: prev7 },
  ]

  return (
    <div style={frameStyle()}>
      <div style={{ ...microLabelStyle(), marginBottom: 6 }}>Chronos / change detection</div>
      <div style={{ display: 'grid', gap: 10, height: 'calc(100% - 20px)' }}>
        {pairs.map(pair => {
          const max = Math.max(pair.current, pair.previous, 1)
          const delta = pair.previous === 0 ? pair.current * 100 : Math.round(((pair.current - pair.previous) / pair.previous) * 100)
          return (
            <div key={pair.label} style={{ border: '1px solid var(--g20)', padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={microLabelStyle()}>{pair.label}</span>
                <span style={{ ...microLabelStyle(delta >= 0 ? 'var(--g)' : 'var(--warn)'), fontSize: '10px' }}>
                  {delta >= 0 ? '+' : ''}{delta}%
                </span>
              </div>
              <div style={{ display: 'grid', gap: 5 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 22px', gap: 6, alignItems: 'center' }}>
                  <span style={microLabelStyle('var(--g30)')}>CURRENT</span>
                  <div style={{ height: 7, border: '1px solid var(--g20)' }}>
                    <div style={{ width: `${(pair.current / max) * 100}%`, height: '100%', background: 'var(--g)' }} />
                  </div>
                  <span style={{ ...microLabelStyle('var(--g)'), fontSize: '10px' }}>{pair.current}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '54px 1fr 22px', gap: 6, alignItems: 'center' }}>
                  <span style={microLabelStyle('var(--g30)')}>PREV</span>
                  <div style={{ height: 7, border: '1px solid var(--g20)' }}>
                    <div style={{ width: `${(pair.previous / max) * 100}%`, height: '100%', background: 'rgba(218,255,74,.35)' }} />
                  </div>
                  <span style={{ ...microLabelStyle('var(--g2)'), fontSize: '10px' }}>{pair.previous}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SkylineTile() {
  const rows = ['DRONE', 'AIR', 'MISSILE', 'GROUND']

  return (
    <div style={frameStyle()}>
      <div style={{ ...microLabelStyle(), marginBottom: 6 }}>Skyline / ops weather</div>
      <div style={{ border: '1px solid var(--g20)', padding: 8, marginBottom: 8 }}>
        <div style={microLabelStyle('var(--warn)')}>NO WEATHER DATA</div>
        <div style={{ ...microLabelStyle('var(--g30)'), marginTop: 2 }}>Awaiting upstream Skyline feed. Shell kept live for wrap migration.</div>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {rows.map(label => (
          <div key={label} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 28px', gap: 6, alignItems: 'center' }}>
            <span style={microLabelStyle()}>{label}</span>
            <div style={{ height: 7, border: '1px solid var(--g20)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, transparent 0 8px, rgba(218,255,74,.08) 8px 9px)' }} />
            </div>
            <span style={{ ...microLabelStyle('var(--warn)'), fontSize: '10px' }}>---</span>
          </div>
        ))}
      </div>
    </div>
  )
}
