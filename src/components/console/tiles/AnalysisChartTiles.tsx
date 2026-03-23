import { useMemo, type ReactNode } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import type { Incident } from '@/hooks/useDataPipeline'
import { demoIncidents } from '@/data/demo-incidents'

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

export function FeedQualityTile({ incidents }: { incidents: Incident[] }) {
  const { sourceData } = useAnalysisData(incidents)
  return (
    <ChartShell kicker="SOURCES" title="FEED QUALITY">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sourceData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="2 6" stroke="rgba(218,255,74,.07)" horizontal={false} />
          <XAxis type="number" tick={TICK} axisLine={{ stroke: 'rgba(218,255,74,.15)' }} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="source" tick={TICK} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="count" name="Events" fill="rgba(218,255,74,.55)" radius={[0, 2, 2, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}
