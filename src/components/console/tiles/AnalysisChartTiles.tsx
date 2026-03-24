import { useMemo, useEffect, useRef, type ReactNode } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import type { Incident } from '@/hooks/useDataPipeline'
import { demoIncidents } from '@/data/demo-incidents'
import { G, G2, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

const TICK = {
  fontFamily: 'var(--MONO)',
  fontSize: 9,
  fill: 'rgba(218,255,74,.38)',
  letterSpacing: '.06em',
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="console-chart-tip">
      <div className="console-chart-tip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="console-chart-tip-row">
          <span className="console-chart-tip-dot" style={{ background: p.color }} />
          <span>{p.name}</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

function useAnalysisData(incidents: Incident[]) {
  const data = incidents.length === 0 ? demoIncidents : incidents
  const now = useMemo(() => Date.now(), [])

  const timeline = useMemo(() => {
    const map: Record<string, { date: string; events: number; kinetic: number }> = {}
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now - d * 86400000).toISOString().slice(5, 10)
      map[date] = { date, events: 0, kinetic: 0 }
    }
    data.forEach(inc => {
      if (!inc.published) return
      const day = new Date(inc.published).toISOString().slice(5, 10)
      if (!(day in map)) return
      map[day].events++
      const t = (inc.type || '').toLowerCase()
      if (['missile', 'airstrike', 'drone'].some(k => t.includes(k))) map[day].kinetic++
    })
    return Object.values(map)
  }, [data, now])

  const geoData = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach(inc => {
      const country = inc.location?.country || 'Unknown'
      map[country] = (map[country] || 0) + 1
    })
    return Object.entries(map)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [data])

  const typeData = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach(inc => {
      const type = (inc.type || 'unknown').toUpperCase()
      map[type] = (map[type] || 0) + 1
    })
    return Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [data])

  const sourceData = useMemo(() => {
    const map: Record<string, { count: number; credSum: number }> = {}
    data.forEach(inc => {
      const source = inc.source || 'Unknown'
      if (!map[source]) map[source] = { count: 0, credSum: 0 }
      map[source].count++
      map[source].credSum += inc.credibility ?? 50
    })
    return Object.entries(map)
      .map(([source, { count, credSum }]) => ({
        source,
        count,
        avgCred: Math.round(credSum / count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [data])

  return { timeline, geoData, typeData, sourceData }
}

function ChartShell({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <div className="console-chart-shell">
      <div className="console-chart-bar">
        <span>{kicker}</span>
        <strong>{title}</strong>
      </div>
      <div className="console-chart-stage">{children}</div>
    </div>
  )
}

export function EventTimelineTile({ incidents }: { incidents: Incident[] }) {
  const { timeline } = useAnalysisData(incidents)
  return (
    <ChartShell kicker="TEMPO" title="EVENT TIMELINE">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timeline} margin={{ top: 6, right: 8, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="console-area-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DAFF4A" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#DAFF4A" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="console-area-w" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,140,0,1)" stopOpacity={0.26} />
              <stop offset="100%" stopColor="rgba(255,140,0,1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(218,255,74,.07)" />
          <XAxis dataKey="date" tick={TICK} axisLine={{ stroke: 'rgba(218,255,74,.15)' }} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTip />} />
          <Area type="monotone" dataKey="events" name="All Events" stroke="#DAFF4A" strokeWidth={1.2} fill="url(#console-area-g)" dot={false} />
          <Area type="monotone" dataKey="kinetic" name="Kinetic" stroke="rgba(255,140,0,.9)" strokeWidth={1.2} fill="url(#console-area-w)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function GeographicConcentrationTile({ incidents }: { incidents: Incident[] }) {
  const { geoData } = useAnalysisData(incidents)
  return (
    <ChartShell kicker="GEOGRAPHY" title="CONCENTRATION">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={geoData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(218,255,74,.07)" horizontal={false} />
          <XAxis type="number" tick={TICK} axisLine={{ stroke: 'rgba(218,255,74,.15)' }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="country" tick={TICK} axisLine={false} tickLine={false} width={76} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="count" name="Events" fill="rgba(218,255,74,.55)" radius={[0, 2, 2, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function TypeProfileTile({ incidents }: { incidents: Incident[] }) {
  const { typeData } = useAnalysisData(incidents)
  return (
    <ChartShell kicker="INTENSITY" title="TYPE PROFILE">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={typeData} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(218,255,74,.12)" />
          <PolarAngleAxis dataKey="type" tick={{ ...TICK, fontSize: 9 }} />
          <Tooltip content={<ChartTip />} />
          <Radar name="Count" dataKey="count" stroke="#DAFF4A" strokeWidth={1.3} fill="rgba(218,255,74,.16)" fillOpacity={1} dot={{ r: 2, fill: '#DAFF4A', strokeWidth: 0 }} />
        </RadarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

const _ingestQueue: { age: number; src: string }[] = []
for (let i = 0; i < 26; i++) _ingestQueue.push({ age: Math.random() * 5, src: ['GOV', 'NEWS', 'CHAT', 'SNSR', 'API', 'UNFD'][Math.random() * 6 | 0] })

export function FeedQualityTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      rasterBase(x, W, H, 0.1, DPR)
      const t = Date.now() / 1000

      // Horizontal data buses
      for (let i = 0; i < 6; i++) {
        const y = 54 + i * (H - 108) / 5
        x.fillStyle = G2 + '.02)'; x.fillRect(W * 0.32, y - 3, W * 0.66, 6)
        x.strokeStyle = G2 + '.08)'; x.lineWidth = 1
        x.beginPath(); x.moveTo(W * 0.32, y); x.lineTo(W * 0.98, y); x.stroke()
        for (let p = 0; p < 3; p++) {
          const px = ((t * 90 + i * 80 + p * 180) % (W * 0.66)) + W * 0.32
          x.fillStyle = G; x.fillRect(px, y - 2, 14, 4)
          x.fillStyle = G2 + '.25)'; x.fillRect(px - 24, y - 1, 24, 2)
        }
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.2)'
        x.fillText(['NORM', 'DEDUP', 'CANON', 'UNIFY', 'ENRICH', 'FUSE'][i], W * 0.33, y - 5)
      }

      // Queue column
      x.font = '5px "Share Tech Mono"'
      _ingestQueue.forEach((q, i) => {
        const y = 48 + i * 13
        const alpha = Math.max(0.06, 1 - q.age / 5)
        const arr = q.age < 0.4
        x.fillStyle = arr ? G : G2 + alpha.toFixed(2) + ')'
        x.fillText('▸' + q.src.padEnd(5) + (arr ? '▮ARR' : 'QUE ').padEnd(5) + q.age.toFixed(1), 4, y)
        q.age += 0.016; if (q.age > 5) { q.age = 0; q.src = ['GOV', 'NEWS', 'CHAT', 'SNSR', 'API', 'UNFD'][Math.random() * 6 | 0] }
      })

      // Stats block
      x.fillStyle = 'rgba(5,7,0,.8)'; x.fillRect(W - 74, 8, 68, 50)
      x.strokeStyle = G2 + '.1)'; x.strokeRect(W - 74, 8, 68, 50)
      const pulse = Math.sin(t * 4) * 0.3 + 0.6
      x.fillStyle = G2 + pulse.toFixed(2) + ')'; x.fillRect(W - 68, 14, 6, 6)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.45)'
      x.fillText('STREAM', W - 58, 19)
      x.fillText((11 + Math.floor(Math.sin(t) * 3)) + ' sig/m', W - 68, 32)
      x.fillText('LAT:<2s', W - 68, 44)

      stamp(x, 4, H - 28, 'SYS:INGEST')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
}
