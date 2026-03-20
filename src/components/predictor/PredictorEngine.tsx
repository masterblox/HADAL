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

const probColor = (p: number) =>
  p >= 70 ? 'rgba(255,140,0,.9)' : p >= 45 ? 'rgba(196,255,44,.82)' : 'rgba(136,151,171,.8)'

const severityTone = (value: number) =>
  value >= 75 ? 'rgba(255,140,0,.92)' : value >= 45 ? 'rgba(196,255,44,.82)' : 'rgba(136,151,171,.72)'

const labelTone = (value: string) =>
  value === 'CRITICAL' || value === 'HIGH' ? 'rgba(255,140,0,.92)' : 'rgba(196,255,44,.76)'

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
        mean: cat.meanSeverity,
        p10: cat.percentiles.p10,
        p50: cat.percentiles.p50,
        p90: cat.percentiles.p90,
        trend: cat.trend,
      }))
  }, [prediction])

  if (!prediction) return null

  const g = prediction.global

  return (
    <section className="predictor-section jp-panel sev-nominal">
      <div className="predictor-header">
        <div className="predictor-title-row">
          <span className="predictor-title section-title">PREDICTION ENGINE</span>
          <span className="predictor-subtitle">BOOTSTRAP PROFILE · SEQUENCE MODEL · THEATRE RESPONSE</span>
        </div>
        <div className="predictor-trend">
          <span>MODE {isDemo ? 'DEMO' : prediction.sufficient ? 'LOCAL' : 'LIMITED'}</span>
          <span className="sep">|</span>
          <span>THREAT {prediction.theatreThreatLevel}</span>
          <span className="sep">|</span>
          <span>CASCADE {prediction.cascadeRisk.contagionScore}</span>
          <span className="sep">|</span>
          <span>AIRSPACE {prediction.airspacePressure}</span>
        </div>
      </div>

      {prediction.sufficient && (
        <>
          {/* Row 1: Severity Distribution + Regime Board — inline tables */}
          <div className="pred-signal-grid">
            <div className="pred-stage-card">
              <div className="pred-stage-head">
                <span className="pred-stage-kicker">SEVERITY DISTRIBUTION</span>
                <span className="pred-stage-meta">5K RESAMPLES</span>
              </div>
              <div className="pred-compact-stats">
                <div className="pred-stat-row">
                  <span className="pred-stat-label">MEAN</span>
                  <span className="pred-stat-value" style={{ color: severityTone(g?.mean ?? 0) }}>{g?.mean.toFixed(1)}</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">SD</span>
                  <span className="pred-stat-value">{g?.stdDev.toFixed(1)}</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">P(SEVERE)</span>
                  <span className="pred-stat-value" style={{ color: severityTone(g?.probSevere ?? 0) }}>{g?.probSevere}%</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">P(CRITICAL)</span>
                  <span className="pred-stat-value" style={{ color: severityTone(g?.probCritical ?? 0) }}>{g?.probCritical}%</span>
                </div>
              </div>
              <div className="pred-percentile-strip">
                <span>P5 {g?.percentiles.p5}</span>
                <span>P10 {g?.percentiles.p10}</span>
                <span>P25 {g?.percentiles.p25}</span>
                <span style={{ color: 'var(--g)' }}>P50 {g?.percentiles.p50}</span>
                <span>P75 {g?.percentiles.p75}</span>
                <span>P90 {g?.percentiles.p90}</span>
                <span>P95 {g?.percentiles.p95}</span>
              </div>
            </div>

            <div className="pred-stage-card">
              <div className="pred-stage-head">
                <span className="pred-stage-kicker">REGIME BOARD</span>
                <span className="pred-stage-meta">STATE VECTOR</span>
              </div>
              <div className="pred-compact-stats">
                <div className="pred-stat-row">
                  <span className="pred-stat-label">THREAT</span>
                  <span className="pred-stat-value" style={{ color: severityTone(prediction.theatreThreatLevel) }}>{prediction.theatreThreatLevel}</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">SEVERE P</span>
                  <span className="pred-stat-value" style={{ color: severityTone(g?.probSevere ?? 0) }}>{g?.probSevere}</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">CRITICAL P</span>
                  <span className="pred-stat-value" style={{ color: severityTone(g?.probCritical ?? 0) }}>{g?.probCritical}</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">CASCADE</span>
                  <span className="pred-stat-value" style={{ color: severityTone(prediction.cascadeRisk.contagionScore) }}>{prediction.cascadeRisk.contagionScore}</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">AIRSPACE</span>
                  <span className="pred-stat-value" style={{ color: severityTone(prediction.airspacePressure) }}>{prediction.airspacePressure}</span>
                </div>
              </div>
              <div className="pred-regime-caption">
                <span>CLUSTERS {prediction.cascadeRisk.clusterCount}</span>
                <span>MAX CHAIN {prediction.cascadeRisk.maxClusterSize}</span>
                <span>DOMINANT {prediction.dominantScenario}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Category Envelope + Window Pressure — tables */}
          <div className="pred-analysis-grid">
            <div className="pred-stage-card">
              <div className="pred-stage-head">
                <span className="pred-stage-kicker">CATEGORY ENVELOPE</span>
                <span className="pred-stage-meta">P10 / P50 / P90</span>
              </div>
              <div className="pred-cat-table-head" style={{ display: 'grid', gridTemplateColumns: '80px 36px 40px 36px 36px 36px 48px', gap: 0, padding: '2px 6px' }}>
                <span>TYPE</span><span>CT</span><span>MEAN</span><span>P10</span><span>P50</span><span>P90</span><span>TREND</span>
              </div>
              {categoryRows.map(row => (
                <div key={row.type} className="pred-cat-table-row" style={{ display: 'grid', gridTemplateColumns: '80px 36px 40px 36px 36px 36px 48px', gap: 0, padding: '2px 6px' }}>
                  <span style={{ color: 'var(--g7)' }}>{row.type}</span>
                  <span>{row.count}</span>
                  <span style={{ color: severityTone(row.mean) }}>{row.mean}</span>
                  <span>{row.p10}</span>
                  <span style={{ color: 'var(--g)' }}>{row.p50}</span>
                  <span style={{ color: severityTone(row.p90) }}>{row.p90}</span>
                  <span>{row.trend}</span>
                </div>
              ))}
            </div>

            <div className="pred-stage-card">
              <div className="pred-stage-head">
                <span className="pred-stage-kicker">WINDOW PRESSURE</span>
                <span className="pred-stage-meta">BY HORIZON</span>
              </div>
              <div className="pred-compact-stats">
                <div className="pred-stat-row">
                  <span className="pred-stat-label">24H SEV</span>
                  <span className="pred-stat-value" style={{ color: severityTone(prediction.timeWindows.h24.meanSeverity) }}>{prediction.timeWindows.h24.meanSeverity.toFixed(1)}</span>
                  <span className="pred-stat-count">{prediction.timeWindows.h24.count} EV</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">72H SEV</span>
                  <span className="pred-stat-value" style={{ color: severityTone(prediction.timeWindows.h72.meanSeverity) }}>{prediction.timeWindows.h72.meanSeverity.toFixed(1)}</span>
                  <span className="pred-stat-count">{prediction.timeWindows.h72.count} EV</span>
                </div>
                <div className="pred-stat-row">
                  <span className="pred-stat-label">7D SEV</span>
                  <span className="pred-stat-value" style={{ color: severityTone(prediction.timeWindows.d7.meanSeverity) }}>{prediction.timeWindows.d7.meanSeverity.toFixed(1)}</span>
                  <span className="pred-stat-count">{prediction.timeWindows.d7.count} EV</span>
                </div>
              </div>
              {prediction.reactionWindow && (
                <div className="pred-compact-stats" style={{ marginTop: 6, borderTop: '1px solid rgba(196,255,44,.1)', paddingTop: 6 }}>
                  <div className="pred-stage-head" style={{ marginBottom: 4 }}>
                    <span className="pred-stage-kicker">RESPONSE LATENCY</span>
                    <span className="pred-stage-meta">MEDIAN {prediction.reactionWindow.medianResponseHours}H</span>
                  </div>
                  <div className="pred-stat-row">
                    <span className="pred-stat-label">FAST IMPACT</span>
                    <span className="pred-stat-value" style={{ color: severityTone(prediction.reactionWindow.fastResponseImpact) }}>{prediction.reactionWindow.fastResponseImpact}</span>
                  </div>
                  <div className="pred-stat-row">
                    <span className="pred-stat-label">SLOW IMPACT</span>
                    <span className="pred-stat-value" style={{ color: severityTone(prediction.reactionWindow.slowResponseImpact) }}>{prediction.reactionWindow.slowResponseImpact}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="scenario-builder pred-controls">
            <div className="pred-stage-head">
              <span className="pred-stage-kicker">SEQUENCE FILTER</span>
              <span className="pred-stage-meta">SCENARIO PROJECTION BY ACTOR / ACTION / TARGET / COUNTRY</span>
            </div>
            <div className="scenario-grid">
              <label>
                <span className="sc-label">ACTOR</span>
                <select value={scenario.actor} onChange={e => setScenario(s => ({ ...s, actor: e.target.value }))}>
                  {ACTORS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label>
                <span className="sc-label">ACTION</span>
                <select value={scenario.action} onChange={e => setScenario(s => ({ ...s, action: e.target.value }))}>
                  {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>
              <label>
                <span className="sc-label">TARGET</span>
                <select value={scenario.target} onChange={e => setScenario(s => ({ ...s, target: e.target.value }))}>
                  {TARGETS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
              <label>
                <span className="sc-label">COUNTRY</span>
                <select value={scenario.country} onChange={e => setScenario(s => ({ ...s, country: e.target.value }))}>
                  {COUNTRIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>
            <button className="predict-btn" onClick={() => setShowScenarios(true)}>
              BUILD FOLLOW-ON SCENARIOS
            </button>
          </div>

          {showScenarios && filteredScenarios.length > 0 && (
            <div className="pred-scenario-shell">
              <div className="pred-stage-head">
                <span className="pred-stage-kicker">SCENARIO LEDGER</span>
                <span className="pred-stage-meta">SEQUENCE-DRIVEN FOLLOW-ON PATHS</span>
              </div>
              <div className="predictions-grid pred-ledger">
                {filteredScenarios.map((p, i) => (
                  <div key={i} className="prediction-card">
                    <div className="pred-ledger-top">
                      <div>
                        <div className="pred-category">{p.category}</div>
                        <div className="pred-outcome">{p.outcome}</div>
                      </div>
                      <div className="pred-ledger-prob" style={{ color: probColor(p.probability) }}>{p.probability}%</div>
                    </div>
                    <div className="pred-ledger-row">
                      <span>{p.timeframe}</span>
                      <span style={{ color: labelTone(p.severity) }}>{p.severity}</span>
                      <span>{p.actors.length > 0 ? p.actors.join(' · ') : 'SYSTEMIC'}</span>
                    </div>
                    <div className="pred-ledger-gauge">
                      <div className="pred-ledger-fill" style={{ width: `${p.probability}%`, background: probColor(p.probability) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!prediction.sufficient && (
        <div className="pred-insufficient">
          <span className="jp-intel-lbl">INSUFFICIENT DATA — NEED 5+ EVENTS IN 14-DAY WINDOW</span>
        </div>
      )}
    </section>
  )
}
