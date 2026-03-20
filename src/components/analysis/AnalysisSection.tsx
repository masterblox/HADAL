import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'
import type { Incident } from '../../hooks/useDataPipeline'
import { demoIncidents } from '@/data/demo-incidents'

/* ── Shared axis tick style ── */
const TICK = {
  fontFamily: 'var(--MONO)',
  fontSize: 10,
  fill: 'rgba(218,255,74,.4)',
  letterSpacing: '.06em',
}

/* ── Custom tooltip ── */
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="analysis-tooltip">
      <div className="analysis-tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="analysis-tooltip-row">
          <span className="analysis-tooltip-dot" style={{ background: p.color, color: p.color }} />
          <span>{p.name}</span>
          <span style={{ color: 'var(--g)', fontWeight: 400}}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Source tooltip with credibility ── */
function SourceTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="analysis-tooltip">
      <div className="analysis-tooltip-label">{label}</div>
      <div className="analysis-tooltip-row">
        <span className="analysis-tooltip-dot" style={{ background: '#DAFF4A', color: '#DAFF4A' }} />
        <span>Events</span>
        <span style={{ color: 'var(--g)', fontWeight: 400}}>{d?.count}</span>
      </div>
      <div className="analysis-tooltip-row">
        <span className="analysis-tooltip-dot" style={{ background: 'rgba(255,140,0,.9)', color: 'rgba(255,140,0,.9)' }} />
        <span>Avg Credibility</span>
        <span style={{ color: 'var(--warn)', fontWeight: 400}}>{d?.avgCred}%</span>
      </div>
    </div>
  )
}

export function AnalysisSection({ incidents }: { incidents: Incident[] }) {
  const data = incidents.length === 0 ? demoIncidents : incidents
  const isDemo = incidents.length === 0

  /* ── Summary metrics ── */
  const stats = useMemo(() => {
    let kinetic = 0, mil = 0, civ = 0
    const countries = new Set<string>()
    for (const inc of data) {
      const t = (inc.type || '').toLowerCase()
      if (['missile', 'airstrike', 'drone'].some(k => t.includes(k))) kinetic++
      mil += inc.casualties?.military ?? 0
      civ += inc.casualties?.civilian ?? 0
      if (inc.location?.country) countries.add(inc.location.country)
    }
    return { total: data.length, kinetic, casualties: mil + civ, countries: countries.size }
  }, [data])

  /* ── 14-day timeline ── */
  const now = useMemo(() => Date.now(), [])
  const timeline = useMemo(() => {
    const map: Record<string, { date: string; events: number; kinetic: number }> = {}
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now - d * 86400000).toISOString().slice(0, 10)
      map[date] = { date, events: 0, kinetic: 0 }
    }
    data.forEach(inc => {
      if (!inc.published) return
      const day = new Date(inc.published).toISOString().slice(0, 10)
      if (!(day in map)) return
      map[day].events++
      const t = (inc.type || '').toLowerCase()
      if (['missile', 'airstrike', 'drone'].some(k => t.includes(k))) map[day].kinetic++
    })
    return Object.values(map)
  }, [data, now])

  /* ── Geographic concentration ── */
  const geoData = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach(inc => {
      const c = inc.location?.country || 'Unknown'
      map[c] = (map[c] || 0) + 1
    })
    return Object.entries(map)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [data])

  /* ── Incident type radar ── */
  const typeData = useMemo(() => {
    const map: Record<string, number> = {}
    data.forEach(inc => {
      const t = (inc.type || 'unknown').toUpperCase()
      map[t] = (map[t] || 0) + 1
    })
    return Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }, [data])

  /* ── Source credibility ── */
  const sourceData = useMemo(() => {
    const map: Record<string, { count: number; credSum: number }> = {}
    data.forEach(inc => {
      const s = inc.source || 'Unknown'
      if (!map[s]) map[s] = { count: 0, credSum: 0 }
      map[s].count++
      map[s].credSum += inc.credibility ?? 50
    })
    return Object.entries(map)
      .map(([source, { count, credSum }]) => ({
        source,
        count,
        avgCred: Math.round(credSum / count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [data])

  return (
    <section className="analysis-section jp-panel sev-nominal">
      <div className="analysis-header jp-panel-header">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 8 }}>
          <rect x="1" y="8" width="2" height="5" fill="var(--g3)" />
          <rect x="5" y="5" width="2" height="8" fill="var(--g7)" />
          <rect x="9" y="2" width="2" height="11" fill="var(--g)" />
        </svg>
        <span className="analysis-title section-title">THREAT ANALYSIS</span>
        <span className="analysis-count">{data.length} EVENTS{isDemo ? ' · DEMO' : ''}</span>
      </div>

      {/* ── Summary strip ── */}
      <div className="analysis-overview-strip">
        <div className="analysis-overview-card">
          <div className="analysis-overview-label">TOTAL EVENTS</div>
          <div className="analysis-overview-value">{stats.total}</div>
          <div className="analysis-overview-sub">14-DAY WINDOW</div>
        </div>
        <div className="analysis-overview-card">
          <div className="analysis-overview-label">KINETIC</div>
          <div className="analysis-overview-value warn">{stats.kinetic}</div>
          <div className="analysis-overview-sub">{stats.total > 0 ? Math.round((stats.kinetic / stats.total) * 100) : 0}% OF TOTAL</div>
        </div>
        <div className="analysis-overview-card">
          <div className="analysis-overview-label">CASUALTIES</div>
          <div className="analysis-overview-value warn">{stats.casualties}</div>
          <div className="analysis-overview-sub">MIL + CIV COMBINED</div>
        </div>
        <div className="analysis-overview-card">
          <div className="analysis-overview-label">COUNTRIES</div>
          <div className="analysis-overview-value">{stats.countries}</div>
          <div className="analysis-overview-sub">AFFECTED NATIONS</div>
        </div>
      </div>

      {/* ── All charts visible — 2x2 grid ── */}
      <div className="analysis-body">

        {/* Row 1 */}
        <div className="analysis-intensity-grid">

          {/* Timeline / Tempo */}
          <div className="analysis-chart-shell">
            <div className="analysis-chart-bar">
              <span className="analysis-chart-kicker">TEMPO</span>
              <span className="analysis-chart-title">Event Timeline</span>
            </div>
            <div className="analysis-chart-stage">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="hadal-area-g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#DAFF4A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#DAFF4A" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="hadal-area-w" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(255,140,0,1)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="rgba(255,140,0,1)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(218,255,74,.07)" />
                  <XAxis
                    dataKey="date"
                    tick={TICK}
                    tickFormatter={(v: string) => v.slice(5)}
                    axisLine={{ stroke: 'rgba(218,255,74,.15)' }}
                    tickLine={false}
                  />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<Tip />} />
                  <Area
                    type="monotone"
                    dataKey="events"
                    name="All Events"
                    stroke="#DAFF4A"
                    strokeWidth={1.5}
                    fill="url(#hadal-area-g)"
                    dot={false}
                    activeDot={{ r: 3, fill: '#DAFF4A', strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kinetic"
                    name="Kinetic"
                    stroke="rgba(255,140,0,.9)"
                    strokeWidth={1.5}
                    fill="url(#hadal-area-w)"
                    dot={false}
                    activeDot={{ r: 3, fill: 'rgba(255,140,0,1)', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geographic concentration */}
          <div className="analysis-chart-shell">
            <div className="analysis-chart-bar">
              <span className="analysis-chart-kicker">GEOGRAPHY</span>
              <span className="analysis-chart-title">Concentration</span>
            </div>
            <div className="analysis-chart-stage">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={geoData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(218,255,74,.07)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={TICK}
                    axisLine={{ stroke: 'rgba(218,255,74,.15)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="country"
                    tick={TICK}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<Tip />} />
                  <Bar
                    dataKey="count"
                    name="Events"
                    fill="rgba(218,255,74,.55)"
                    radius={[0, 2, 2, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="analysis-intensity-grid" style={{ marginTop: 6 }}>

          {/* Incident type radar */}
          <div className="analysis-chart-shell">
            <div className="analysis-chart-bar">
              <span className="analysis-chart-kicker">INTENSITY</span>
              <span className="analysis-chart-title">Type Profile</span>
            </div>
            <div className="analysis-chart-stage radar">
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={typeData} cx="50%" cy="50%" outerRadius="72%">
                  <PolarGrid stroke="rgba(218,255,74,.12)" />
                  <PolarAngleAxis dataKey="type" tick={{ ...TICK, fontSize: 10 }} />
                  <Tooltip content={<Tip />} />
                  <Radar
                    name="Count"
                    dataKey="count"
                    stroke="#DAFF4A"
                    strokeWidth={1.5}
                    fill="rgba(218,255,74,.18)"
                    fillOpacity={1}
                    dot={{ r: 2.5, fill: '#DAFF4A', strokeWidth: 0 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Source credibility */}
          <div className="analysis-chart-shell">
            <div className="analysis-chart-bar">
              <span className="analysis-chart-kicker">SOURCES</span>
              <span className="analysis-chart-title">Feed Quality</span>
            </div>
            <div className="analysis-chart-stage">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={sourceData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="2 6" stroke="rgba(218,255,74,.07)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={TICK}
                    axisLine={{ stroke: 'rgba(218,255,74,.15)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="source"
                    tick={TICK}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip content={<SourceTip />} />
                  <Bar
                    dataKey="count"
                    name="Events"
                    fill="rgba(218,255,74,.55)"
                    radius={[0, 2, 2, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
