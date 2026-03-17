import { useState, useMemo } from 'react'
import type { Incident } from '../../hooks/useDataPipeline'

/* ── types ── */
interface DayBucket { date: string; count: number }
interface CountryBucket { country: string; count: number }
interface TypeBucket { type: string; count: number }

/* ── tabs ── */
const TABS = ['TIMELINE', 'HEATMAP', 'INTENSITY', 'SOURCES'] as const
type Tab = typeof TABS[number]

export function AnalysisSection({ incidents }: { incidents: Incident[] }) {
  const [tab, setTab] = useState<Tab>('TIMELINE')

  // 14-day timeline
  const [now] = useState(Date.now)
  const timeline = useMemo<DayBucket[]>(() => {
    const map: Record<string, number> = {}
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now - d * 86400000).toISOString().slice(0, 10)
      map[date] = 0
    }
    incidents.forEach(inc => {
      if (!inc.published) return
      const day = new Date(inc.published).toISOString().slice(0, 10)
      if (day in map) map[day]++
    })
    return Object.entries(map).map(([date, count]) => ({ date, count }))
  }, [incidents, now])

  // Country heatmap
  const countryData = useMemo<CountryBucket[]>(() => {
    const map: Record<string, number> = {}
    incidents.forEach(inc => {
      const c = inc.location?.country || 'Unknown'
      map[c] = (map[c] || 0) + 1
    })
    return Object.entries(map)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [incidents])

  // Type breakdown
  const typeData = useMemo<TypeBucket[]>(() => {
    const map: Record<string, number> = {}
    incidents.forEach(inc => { const t = inc.type || 'unknown'; map[t] = (map[t] || 0) + 1 })
    return Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }, [incidents])

  // Sources
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {}
    incidents.forEach(inc => { const s = inc.source || 'unknown'; map[s] = (map[s] || 0) + 1 })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [incidents])

  const maxTimeline = Math.max(...timeline.map(d => d.count), 1)
  const maxCountry = countryData[0]?.count || 1

  return (
    <section className="analysis-section jp-panel">
      <div className="analysis-header jp-panel-header">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 8 }}>
          <rect x="1" y="8" width="2" height="5" fill="var(--g3)" />
          <rect x="5" y="5" width="2" height="8" fill="var(--g7)" />
          <rect x="9" y="2" width="2" height="11" fill="var(--g)" />
        </svg>
        <span className="analysis-title">INCIDENT ANALYTICS</span>
        <span className="analysis-count">{incidents.length} EVENTS</span>
      </div>

      {/* Tabs */}
      <div className="analysis-tabs">
        {TABS.map(t => (
          <button key={t} className={`analysis-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="analysis-body">
        {tab === 'TIMELINE' && (
          <div className="chart-timeline">
            <div className="chart-bars">
              {timeline.map(d => (
                <div key={d.date} className="bar-col">
                  <div className="bar-value">{d.count || ''}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${(d.count / maxTimeline) * 100}%` }} />
                  </div>
                  <div className="bar-label">{d.date.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'HEATMAP' && (
          <div className="chart-heatmap">
            {countryData.map(c => (
              <div key={c.country} className="heatmap-row">
                <span className="hm-country">{c.country}</span>
                <div className="hm-bar-bg">
                  <div className="hm-bar-fill" style={{ width: `${(c.count / maxCountry) * 100}%` }} />
                </div>
                <span className="hm-count">{c.count}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'INTENSITY' && (
          <div className="chart-intensity">
            <div className="intensity-summary">
              <div className="intensity-number">{incidents.length}</div>
              <div className="intensity-label">TOTAL EVENTS (14D)</div>
            </div>
            <div className="intensity-breakdown">
              {typeData.map(t => {
                const pct = Math.round((t.count / incidents.length) * 100)
                return (
                  <div key={t.type} className="intensity-row">
                    <span className="int-type">{t.type.toUpperCase()}</span>
                    <div className="int-bar-bg">
                      <div className="int-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="int-pct">{pct}%</span>
                    <span className="int-count">{t.count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'SOURCES' && (
          <div className="chart-sources">
            {sourceData.map(([name, count]) => (
              <div key={name} className="source-row">
                <span className="src-name">{name}</span>
                <div className="src-bar-bg">
                  <div className="src-bar-fill" style={{ width: `${(count / (sourceData[0]?.[1] || 1)) * 100}%` }} />
                </div>
                <span className="src-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
