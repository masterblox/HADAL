import { useState, useMemo } from 'react'
import type { Incident } from '../../hooks/useDataPipeline'
import { demoIncidents } from '@/data/demo-incidents'

/* ── types ── */
interface DayBucket { date: string; count: number }
interface CountryBucket { country: string; count: number }
interface TypeBucket { type: string; count: number }

/* ── tabs ── */
const TABS = ['TIMELINE', 'HEATMAP', 'INTENSITY', 'SOURCES'] as const
type Tab = typeof TABS[number]

export function AnalysisSection({ incidents }: { incidents: Incident[] }) {
  const [tab, setTab] = useState<Tab>('TIMELINE')
  const effectiveIncidents = incidents.length === 0 ? demoIncidents : incidents

  // 14-day timeline
  const [now] = useState(Date.now)
  const timeline = useMemo<DayBucket[]>(() => {
    const map: Record<string, number> = {}
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now - d * 86400000).toISOString().slice(0, 10)
      map[date] = 0
    }
    effectiveIncidents.forEach(inc => {
      if (!inc.published) return
      const day = new Date(inc.published).toISOString().slice(0, 10)
      if (day in map) map[day]++
    })
    return Object.entries(map).map(([date, count]) => ({ date, count }))
  }, [effectiveIncidents, now])

  // Country heatmap
  const countryData = useMemo<CountryBucket[]>(() => {
    const map: Record<string, number> = {}
    effectiveIncidents.forEach(inc => {
      const c = inc.location?.country || 'Unknown'
      map[c] = (map[c] || 0) + 1
    })
    return Object.entries(map)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [effectiveIncidents])

  // Type breakdown
  const typeData = useMemo<TypeBucket[]>(() => {
    const map: Record<string, number> = {}
    effectiveIncidents.forEach(inc => { const t = inc.type || 'unknown'; map[t] = (map[t] || 0) + 1 })
    return Object.entries(map)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
  }, [effectiveIncidents])

  // Sources
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {}
    effectiveIncidents.forEach(inc => { const s = inc.source || 'unknown'; map[s] = (map[s] || 0) + 1 })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [effectiveIncidents])

  const maxTimeline = Math.max(...timeline.map(d => d.count), 1)
  const maxCountry = countryData[0]?.count || 1

  return (
    <section className="analysis-section jp-panel sev-nominal">
      <div className="analysis-header jp-panel-header">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 8 }}>
          <rect x="1" y="8" width="2" height="5" fill="var(--g3)" />
          <rect x="5" y="5" width="2" height="8" fill="var(--g7)" />
          <rect x="9" y="2" width="2" height="11" fill="var(--g)" />
        </svg>
        <span className="analysis-title">INCIDENT ANALYTICS</span>
        <span className="analysis-count">{effectiveIncidents.length} EVENTS{incidents.length === 0 ? ' · DEMO' : ''}</span>
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
          <div className="chart-timeline" style={{position:'relative'}}>
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',justifyContent:'space-between',paddingBottom:'24px',pointerEvents:'none'}}>
              {[0,1,2,3].map(i => <div key={i} style={{height:'1px',background:'var(--g07)'}} />)}
            </div>
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
          <div className="chart-heatmap heatmap-grid">
            {countryData.map(c => {
              const intensity = c.count / maxCountry
              const bg = intensity >= 0.7 ? 'rgba(255,140,0,.12)' : intensity >= 0.4 ? 'rgba(196,255,44,.08)' : 'rgba(196,255,44,.03)'
              return (
                <div key={c.country} className="heatmap-row" style={{background: bg, border:'1px solid var(--g07)', padding:'6px 10px'}}>
                  <span className="hm-country">{c.country}</span>
                  <div className="hm-bar-bg">
                    <div className="hm-bar-fill" style={{ width: `${(c.count / maxCountry) * 100}%`, background: intensity >= 0.7 ? 'var(--warn)' : 'var(--g3)' }} />
                  </div>
                  <span className="hm-count" style={{color: intensity >= 0.7 ? 'var(--warn)' : 'var(--g)'}}>{c.count}</span>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'INTENSITY' && (
          <div className="chart-intensity">
            <div className="intensity-summary">
              <div className="intensity-number">{effectiveIncidents.length}</div>
              <div className="intensity-label">TOTAL EVENTS (14D)</div>
            </div>
            <div className="intensity-breakdown">
              {typeData.map(t => {
                const pct = Math.round((t.count / effectiveIncidents.length) * 100)
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
            {sourceData.map(([name, count]) => {
              const conf = Math.min(5, Math.ceil((count / (sourceData[0]?.[1] || 1)) * 5))
              return (
                <div key={name} className="source-row" style={{border:'1px solid var(--g07)',padding:'6px 10px',background:'var(--bg1)'}}>
                  <span className="src-name">{name}</span>
                  <span style={{display:'flex',gap:'3px',marginRight:'8px',alignItems:'center'}}>
                    {[0,1,2,3,4].map(d => <span key={d} style={{width:'5px',height:'5px',borderRadius:'50%',background: d < conf ? 'var(--g)' : 'var(--g07)'}} />)}
                  </span>
                  <div className="src-bar-bg">
                    <div className="src-bar-fill" style={{ width: `${(count / (sourceData[0]?.[1] || 1)) * 100}%` }} />
                  </div>
                  <span className="src-count">{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
