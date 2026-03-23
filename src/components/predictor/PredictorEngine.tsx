import { useMemo, useState } from 'react'
import type { Incident, AirspaceData, PriceData } from '../../hooks/useDataPipeline'
import { usePrediction } from '../../hooks/usePrediction'
import { demoIncidents } from '@/data/demo-incidents'

const ACTORS = [
  { id: 'houthi', name: 'Houthis (Yemen)' },
  { id: 'israel', name: 'Israel / IDF' },
  { id: 'iran', name: 'Iran / IRGC' },
  { id: 'saudi', name: 'Saudi Arabia' },
  { id: 'uae', name: 'UAE' },
  { id: 'us', name: 'United States' },
  { id: 'uk', name: 'United Kingdom' },
  { id: 'hezbollah', name: 'Hezbollah' },
  { id: 'hamas', name: 'Hamas' },
  { id: 'isis', name: 'ISIS / ISIL' },
]

const ACTIONS = [
  { id: 'strike', name: 'Airstrike / Attack' },
  { id: 'missile', name: 'Missile Launch' },
  { id: 'drone', name: 'Drone Attack' },
  { id: 'naval', name: 'Naval Action' },
  { id: 'intercept', name: 'Intercept / Defense' },
  { id: 'bomb', name: 'Bombing / Explosion' },
  { id: 'deploy', name: 'Troop Deployment' },
  { id: 'sanction', name: 'Sanctions' },
]

const TARGETS = [
  { id: 'oil_facility', name: 'Oil Facility' },
  { id: 'military_base', name: 'Military Base' },
  { id: 'civilian_area', name: 'Civilian Area' },
  { id: 'shipping', name: 'Commercial Shipping' },
  { id: 'naval_vessel', name: 'Naval Vessel' },
  { id: 'infrastructure', name: 'Infrastructure' },
  { id: 'airport', name: 'Airport' },
  { id: 'port', name: 'Port' },
]

const COUNTRIES = [
  { id: 'uae', name: 'UAE' },
  { id: 'saudi', name: 'Saudi Arabia' },
  { id: 'qatar', name: 'Qatar' },
  { id: 'bahrain', name: 'Bahrain' },
  { id: 'kuwait', name: 'Kuwait' },
  { id: 'oman', name: 'Oman' },
  { id: 'israel', name: 'Israel' },
  { id: 'iran', name: 'Iran' },
  { id: 'yemen', name: 'Yemen' },
  { id: 'iraq', name: 'Iraq' },
  { id: 'lebanon', name: 'Lebanon' },
]

interface Scenario {
  actor: string
  action: string
  target: string
  country: string
}

interface Props {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
}

const sevColor = (v: number) =>
  v >= 75 ? 'rgba(255,140,0,.92)' : v >= 45 ? 'rgba(196,255,44,.82)' : 'rgba(136,151,171,.72)'

const sevLabelColor = (v: string) =>
  v === 'CRITICAL' || v === 'HIGH' ? 'rgba(255,140,0,.92)' : 'rgba(196,255,44,.76)'

const trendArrow = (t: string) =>
  t === 'escalating' ? '↑' : t === 'de-escalating' ? '↓' : '→'

export function PredictorEngine({ incidents, airspace, prices }: Props) {
  const [scenario, setScenario] = useState<Scenario>({ actor: 'houthi', action: 'missile', target: 'oil_facility', country: 'uae' })
  const [showScenarios, setShowScenarios] = useState(false)
  const effectiveIncidents = incidents.length >= 5 ? incidents : demoIncidents
  const prediction = usePrediction(effectiveIncidents, airspace, prices)
  const isDemo = incidents.length < 5

  const filteredScenarios = useMemo(() => {
    if (!prediction?.scenarios || !showScenarios) return []
    return prediction.scenarios
      .filter(s => s.actors.includes(scenario.actor) || s.actors.length === 0)
      .slice(0, 6)
  }, [prediction, scenario.actor, showScenarios])

  const categoryRows = useMemo(() => {
    if (!prediction) return []
    return Object.entries(prediction.categories)
      .sort((a, b) => b[1].meanSeverity - a[1].meanSeverity)
      .map(([type, cat]) => ({
        type: type.toUpperCase(),
        count: cat.count,
        mean: Math.round(cat.meanSeverity),
        p10: cat.percentiles.p10,
        p50: cat.percentiles.p50,
        p90: cat.percentiles.p90,
        trend: cat.trend,
      }))
  }, [prediction])

  if (!prediction) return null

  const g = prediction.global
  const regimeClass = prediction.theatreThreatLevel >= 80 ? 'regime-critical'
    : prediction.theatreThreatLevel >= 60 ? 'regime-elevated'
    : prediction.theatreThreatLevel >= 30 ? 'regime-guarded' : 'regime-nominal'

  return (
    <section className="predictor-section jp-panel sev-nominal">
      {/* ── Header + Regime ── */}
      <div className="pe-header">
        <div className="pe-header-left">
          <span className="pe-title section-title">PREDICTION ENGINE</span>
          <span className="pe-provenance">SEQUENCE MODEL · {isDemo ? 'DEMO' : prediction.sufficient ? 'LOCAL' : 'LIMITED'}</span>
        </div>
        <div className={`pe-regime ${regimeClass}`}>
          <span className="pe-regime-label">REGIME</span>
          <span className="pe-regime-value">{prediction.theatreThreatLevel >= 80 ? 'CRITICAL' : prediction.theatreThreatLevel >= 60 ? 'ELEVATED' : prediction.theatreThreatLevel >= 30 ? 'GUARDED' : 'NOMINAL'}</span>
          <span className="pe-regime-score">{prediction.theatreThreatLevel}</span>
        </div>
      </div>

      {/* ── Trend Summary ── */}
      {prediction.trendSummary && (
        <div className="pe-trend">
          <span className="pe-trend-text">{prediction.trendSummary.summary}</span>
          <span className="pe-trend-meta">
            <span>{prediction.trendSummary.dailyAvg} EVENTS/DAY</span>
            <span className="sep">|</span>
            <span>CASCADE {prediction.cascadeRisk.contagionScore}</span>
            <span className="sep">|</span>
            <span>AIRSPACE {prediction.airspacePressure}</span>
          </span>
        </div>
      )}

      {prediction.sufficient && g && (
        <>
          {/* ── Composite Signals ── */}
          <div className="pe-signals">
            <div className="pe-signal-cell">
              <span className="pe-sig-label">MEAN SEV</span>
              <span className="pe-sig-value" style={{ color: sevColor(g.mean) }}>{g.mean.toFixed(1)}</span>
              <div className="pe-sig-bar"><div className="pe-sig-fill" style={{ width: `${g.mean}%`, background: sevColor(g.mean) }} /></div>
            </div>
            <div className="pe-signal-cell">
              <span className="pe-sig-label">P(SEVERE)</span>
              <span className="pe-sig-value" style={{ color: sevColor(g.probSevere) }}>{g.probSevere}%</span>
              <div className="pe-sig-bar"><div className="pe-sig-fill" style={{ width: `${g.probSevere}%`, background: sevColor(g.probSevere) }} /></div>
            </div>
            <div className="pe-signal-cell">
              <span className="pe-sig-label">P(CRITICAL)</span>
              <span className="pe-sig-value" style={{ color: sevColor(g.probCritical) }}>{g.probCritical}%</span>
              <div className="pe-sig-bar"><div className="pe-sig-fill" style={{ width: `${g.probCritical}%`, background: sevColor(g.probCritical) }} /></div>
            </div>
            <div className="pe-signal-cell">
              <span className="pe-sig-label">CASCADE</span>
              <span className="pe-sig-value" style={{ color: sevColor(prediction.cascadeRisk.contagionScore) }}>{prediction.cascadeRisk.contagionScore}</span>
              <div className="pe-sig-bar"><div className="pe-sig-fill" style={{ width: `${prediction.cascadeRisk.contagionScore}%`, background: sevColor(prediction.cascadeRisk.contagionScore) }} /></div>
            </div>
            <div className="pe-signal-cell">
              <span className="pe-sig-label">AIRSPACE</span>
              <span className="pe-sig-value" style={{ color: sevColor(prediction.airspacePressure) }}>{prediction.airspacePressure}</span>
              <div className="pe-sig-bar"><div className="pe-sig-fill" style={{ width: `${prediction.airspacePressure}%`, background: sevColor(prediction.airspacePressure) }} /></div>
            </div>
          </div>

          {/* ── Percentile Distribution Fan ── */}
          <div className="pe-distribution">
            <div className="pe-dist-header">
              <span className="pe-dist-title">SEVERITY DISTRIBUTION</span>
              <span className="pe-dist-stats">σ {g.stdDev.toFixed(1)} · 5K RESAMPLES</span>
            </div>
            <div className="pe-dist-fan">
              <div className="pe-fan-track">
                <div className="pe-fan-range pe-fan-outer" style={{ left: `${g.percentiles.p5}%`, width: `${g.percentiles.p95 - g.percentiles.p5}%` }} />
                <div className="pe-fan-range pe-fan-inner" style={{ left: `${g.percentiles.p25}%`, width: `${g.percentiles.p75 - g.percentiles.p25}%` }} />
                <div className="pe-fan-median" style={{ left: `${g.percentiles.p50}%` }} />
                <div className="pe-fan-zone-mark" style={{ left: '70%' }} />
                <div className="pe-fan-zone-mark pe-zone-warn" style={{ left: '90%' }} />
              </div>
              <div className="pe-fan-labels pe-fan-labels-full">
                <span style={{ left: `${g.percentiles.p5}%` }}>P5</span>
                <span style={{ left: `${g.percentiles.p25}%` }}>P25</span>
                <span style={{ left: `${g.percentiles.p50}%` }} className="pe-fan-label-med">P50</span>
                <span style={{ left: `${g.percentiles.p75}%` }}>P75</span>
                <span style={{ left: `${g.percentiles.p95}%` }}>P95</span>
              </div>
              <div className="pe-fan-values pe-fan-values-full">
                <span style={{ left: `${g.percentiles.p5}%` }}>{g.percentiles.p5}</span>
                <span style={{ left: `${g.percentiles.p25}%` }}>{g.percentiles.p25}</span>
                <span style={{ left: `${g.percentiles.p50}%` }} className="pe-fan-val-med">{g.percentiles.p50}</span>
                <span style={{ left: `${g.percentiles.p75}%` }}>{g.percentiles.p75}</span>
                <span style={{ left: `${g.percentiles.p95}%` }}>{g.percentiles.p95}</span>
              </div>
              <div className="pe-fan-inline-compact">
                <span>P5 <b>{g.percentiles.p5}</b></span>
                <span>P25 <b>{g.percentiles.p25}</b></span>
                <span className="pe-fan-label-med">P50 <b>{g.percentiles.p50}</b></span>
                <span>P75 <b>{g.percentiles.p75}</b></span>
                <span>P95 <b>{g.percentiles.p95}</b></span>
              </div>
            </div>
          </div>

          {/* ── Time Horizons ── */}
          <div className="pe-horizons">
            {([
              { label: '24H', data: prediction.timeWindows.h24 },
              { label: '72H', data: prediction.timeWindows.h72 },
              { label: '7D', data: prediction.timeWindows.d7 },
            ] as const).map(h => {
              const maxCount = Math.max(prediction.timeWindows.h24.count, prediction.timeWindows.h72.count, prediction.timeWindows.d7.count, 1)
              return (
                <div key={h.label} className="pe-horizon-cell">
                  <span className="pe-hz-label">{h.label}</span>
                  <div className="pe-hz-bar-row">
                    <div className="pe-hz-bar"><div className="pe-hz-sev-fill" style={{ width: `${h.data.meanSeverity}%`, background: sevColor(h.data.meanSeverity) }} /></div>
                    <span className="pe-hz-value" style={{ color: sevColor(h.data.meanSeverity) }}>{h.data.meanSeverity.toFixed(0)}</span>
                  </div>
                  <div className="pe-hz-count-row">
                    <div className="pe-hz-count-bar"><div className="pe-hz-count-fill" style={{ width: `${(h.data.count / maxCount) * 100}%` }} /></div>
                    <span className="pe-hz-count">{h.data.count} EV</span>
                  </div>
                </div>
              )
            })}
            {prediction.reactionWindow && (
              <div className="pe-horizon-cell pe-reaction">
                <span className="pe-hz-label">REACTION</span>
                <div className="pe-hz-bar-row">
                  <div className="pe-hz-bar"><div className="pe-hz-sev-fill" style={{ width: `${Math.min(prediction.reactionWindow.medianResponseHours * 2, 100)}%`, background: 'var(--g3)' }} /></div>
                  <span className="pe-hz-value">{prediction.reactionWindow.medianResponseHours}h</span>
                </div>
                <span className="pe-hz-sub">FAST {prediction.reactionWindow.fastResponseImpact} · SLOW {prediction.reactionWindow.slowResponseImpact}</span>
              </div>
            )}
          </div>

          {/* ── Category Severity Ranges ── */}
          <div className="pe-categories">
            <div className="pe-cat-header">
              <span>TYPE</span><span>RANGE</span><span>N</span><span></span>
            </div>
            {categoryRows.map(row => (
              <div key={row.type} className="pe-cat-row">
                <span className="pe-cat-name">{row.type}</span>
                <div className="pe-cat-range">
                  <div className="pe-cat-track">
                    <div className="pe-cat-bar" style={{ left: `${row.p10}%`, width: `${row.p90 - row.p10}%`, background: 'rgba(218,255,74,.12)' }} />
                    <div className="pe-cat-median" style={{ left: `${row.p50}%`, background: sevColor(row.mean) }} />
                  </div>
                </div>
                <span className="pe-cat-n">{row.count}</span>
                <span className="pe-cat-trend" style={{ color: row.trend === 'escalating' ? 'var(--warn)' : 'var(--g3)' }}>{trendArrow(row.trend)}</span>
              </div>
            ))}
          </div>

          {/* ── Cascade & Response Board ── */}
          <div className="pe-cascade-board">
            <div className="pe-cascade-col">
              <span className="pe-cb-title">CASCADE RISK</span>
              <div className="pe-cb-row">
                <span className="pe-cb-label">CONTAGION</span>
                <span className="pe-cb-val" style={{ color: sevColor(prediction.cascadeRisk.contagionScore) }}>{prediction.cascadeRisk.contagionScore}</span>
              </div>
              <div className="pe-cb-bar"><div className="pe-cb-fill" style={{ width: `${prediction.cascadeRisk.contagionScore}%`, background: sevColor(prediction.cascadeRisk.contagionScore) }} /></div>
              <div className="pe-cb-row" style={{ marginTop: 8 }}>
                <span className="pe-cb-label">CLUSTERS</span>
                <span className="pe-cb-val">{prediction.cascadeRisk.clusterCount}</span>
              </div>
              <div className="pe-cb-row">
                <span className="pe-cb-label">MAX CHAIN</span>
                <span className="pe-cb-val">{prediction.cascadeRisk.maxClusterSize}</span>
              </div>
            </div>
            <div className="pe-cascade-col">
              <span className="pe-cb-title">RESPONSE LATENCY</span>
              {prediction.reactionWindow ? (
                <>
                  <div className="pe-cb-row">
                    <span className="pe-cb-label">MEDIAN</span>
                    <span className="pe-cb-val">{prediction.reactionWindow.medianResponseHours}h</span>
                  </div>
                  <div className="pe-response-compare">
                    <div className="pe-resp-bar-group">
                      <span className="pe-resp-label">FAST</span>
                      <div className="pe-resp-bar"><div className="pe-resp-fill" style={{ width: `${prediction.reactionWindow.fastResponseImpact}%`, background: sevColor(prediction.reactionWindow.fastResponseImpact) }} /></div>
                      <span className="pe-resp-val">{prediction.reactionWindow.fastResponseImpact}</span>
                    </div>
                    <div className="pe-resp-bar-group">
                      <span className="pe-resp-label">SLOW</span>
                      <div className="pe-resp-bar"><div className="pe-resp-fill" style={{ width: `${prediction.reactionWindow.slowResponseImpact}%`, background: sevColor(prediction.reactionWindow.slowResponseImpact) }} /></div>
                      <span className="pe-resp-val">{prediction.reactionWindow.slowResponseImpact}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="pe-cb-row"><span className="pe-cb-label">NO DATA</span></div>
              )}
              <div className="pe-cb-row" style={{ marginTop: 8 }}>
                <span className="pe-cb-label">DOMINANT</span>
                <span className="pe-cb-val" style={{ fontSize: 'var(--fs-micro)', letterSpacing: '.06em' }}>{prediction.dominantScenario}</span>
              </div>
            </div>
          </div>

          {/* ── Scenario Ledger ── */}
          <div className="pe-scenario-ledger">
            <div className="pe-sl-header">
              <span className="pe-sl-title">SCENARIO PROJECTION</span>
              <div className="pe-sl-filters">
                <div className="scenario-grid" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <select value={scenario.actor} onChange={e => setScenario(s => ({ ...s, actor: e.target.value }))} className="pe-sl-filter">
                    {ACTORS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select value={scenario.action} onChange={e => setScenario(s => ({ ...s, action: e.target.value }))} className="pe-sl-filter">
                    {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <select value={scenario.target} onChange={e => setScenario(s => ({ ...s, target: e.target.value }))} className="pe-sl-filter">
                    {TARGETS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select value={scenario.country} onChange={e => setScenario(s => ({ ...s, country: e.target.value }))} className="pe-sl-filter">
                    {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <button className="pe-sl-filter" onClick={() => setShowScenarios(true)}>BUILD →</button>
              </div>
            </div>
            {showScenarios && filteredScenarios.length > 0 && (
              <>
                <div className="pe-sl-col-header">
                  <span>CATEGORY</span><span>OUTCOME</span><span>PROBABILITY</span><span>WINDOW</span><span>SEVERITY</span>
                </div>
                {filteredScenarios.map((p, i) => (
                  <div key={i} className="pe-sl-row">
                    <span className="pe-sl-cat">{p.category}</span>
                    <span className="pe-sl-outcome">{p.outcome}{p.actors.length > 0 && <span className="pe-sl-basis"> — {p.actors.join(', ')}</span>}</span>
                    <span className="pe-sl-prob">
                      <span className="pe-sl-prob-bar"><span className="pe-sl-prob-fill" style={{ width: `${p.probability}%`, background: sevColor(p.probability) }} /></span>
                      <span className="pe-sl-prob-val" style={{ color: sevColor(p.probability) }}>{p.probability}%</span>
                    </span>
                    <span className="pe-sl-tf">{p.timeframe}</span>
                    <span className="pe-sl-sev" style={{ color: sevLabelColor(p.severity) }}>{p.severity}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {!prediction.sufficient && (
        <div className="pe-insufficient">
          INSUFFICIENT DATA — NEED 5+ EVENTS IN 14-DAY WINDOW
        </div>
      )}
    </section>
  )
}
