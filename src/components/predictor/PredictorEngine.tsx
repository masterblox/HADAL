import { useState, useMemo } from 'react'
import type { Incident, AirspaceData, PriceData } from '../../hooks/useDataPipeline'
import { usePrediction } from '../../hooks/usePrediction'
import { demoIncidents } from '@/data/demo-incidents'

/* ── static options (from Gulf Watch) ── */
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

/* ── helpers ── */

const probColor = (p: number) =>
  p >= 70 ? 'var(--warn)' : p >= 40 ? 'var(--g)' : 'var(--g3)'

const trendIcon = (t: string) =>
  t === 'escalating' ? '▲' : t === 'de-escalating' ? '▼' : '—'

const trendColor = (t: string) =>
  t === 'escalating' ? 'var(--warn)' : t === 'de-escalating' ? 'var(--g)' : 'var(--g3)'

/* ── Component ── */

interface Props {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
}

export function PredictorEngine({ incidents, airspace, prices }: Props) {
  const [scenario, setScenario] = useState<Scenario>({ actor: 'houthi', action: 'missile', target: 'oil_facility', country: 'uae' })
  const [showScenarios, setShowScenarios] = useState(false)
  const effectiveIncidents = incidents.length >= 5 ? incidents : demoIncidents
  const prediction = usePrediction(effectiveIncidents, airspace, prices)
  const isDemo = incidents.length < 5

  // Filter scenario predictions by selected actor
  const filteredScenarios = useMemo(() => {
    if (!prediction?.scenarios) return []
    if (!showScenarios) return []
    return prediction.scenarios.filter(s =>
      s.actors.includes(scenario.actor) || s.actors.length === 0
    ).slice(0, 6)
  }, [prediction, scenario.actor, showScenarios])

  if (!prediction) return null

  return (
    <section className="predictor-section jp-panel jp-corners sev-nominal">
      {/* Header */}
      <div className="predictor-header jp-panel-header">
        <div className="predictor-title-row">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 8 }}>
            <circle cx="8" cy="8" r="7" stroke="var(--g3)" strokeWidth="1" />
            <path d="M8 3v5l3 3" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="predictor-title">PREDICTION ENGINE</span>
          <span className="predictor-subtitle">BOOTSTRAP · {isDemo ? 'DEMO MODE' : prediction.sufficient ? 'ACTIVE' : 'INSUFFICIENT DATA'}</span>
        </div>
        <div className="predictor-trend">
          <span>THREAT: {prediction.theatreThreatLevel}</span>
          <span className="sep">|</span>
          <span>AIRSPACE: {prediction.airspacePressure}</span>
          <span className="sep">|</span>
          <span>CASCADE: {prediction.cascadeRisk.contagionScore}</span>
        </div>
      </div>

      {prediction.sufficient && (
        <>
          {/* Bootstrap Profile Strip */}
          <div className="pred-profile-strip">
            <ProfileCard label="THEATRE THREAT" value={prediction.theatreThreatLevel} max={100} warn={prediction.theatreThreatLevel >= 60} />
            <ProfileCard label="P50 SEVERITY" value={prediction.global?.percentiles.p50 ?? 0} max={100} />
            <ProfileCard label="P90 SEVERITY" value={prediction.global?.percentiles.p90 ?? 0} max={100} warn={(prediction.global?.percentiles.p90 ?? 0) >= 70} />
            <ProfileCard label="PROB SEVERE" value={prediction.global?.probSevere ?? 0} max={100} warn={(prediction.global?.probSevere ?? 0) >= 40} unit="%" />
            <ProfileCard label="CONTAGION" value={prediction.cascadeRisk.contagionScore} max={100} warn={prediction.cascadeRisk.contagionScore >= 50} />
            <ProfileCard label="AIRSPACE" value={prediction.airspacePressure} max={100} warn={prediction.airspacePressure >= 40} />
          </div>

          {/* Severity Depth Strip */}
          <div className="jp-depth" style={{height:'6px',margin:'0 0 16px',border:'none'}}>
            <div className="jp-depth-surface" style={{width:'40%',height:'100%',display:'inline-block'}} />
            <div className="jp-depth-sub" style={{width:'60%',height:'100%',display:'inline-block'}} />
          </div>

          {/* Time Windows */}
          <div className="pred-time-windows">
            <TimeWindow label="24H" data={prediction.timeWindows.h24} />
            <TimeWindow label="72H" data={prediction.timeWindows.h72} />
            <TimeWindow label="7D" data={prediction.timeWindows.d7} />
            {prediction.reactionWindow && (
              <div className="pred-tw-cell">
                <div className="jp-intel-lbl">REACTION</div>
                <div className="pred-tw-val">{prediction.reactionWindow.medianResponseHours}h</div>
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="jp-breakdown">
            {Object.entries(prediction.categories)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([type, cat]) => (
                <div key={type} className="jp-brow">
                  <span className="jp-bname">{type.toUpperCase()}</span>
                  <div className="jp-bbar">
                    <div className="jp-bfill" style={{
                      width: `${Math.min(100, cat.meanSeverity)}%`,
                      background: cat.meanSeverity >= 70 ? 'var(--warn)' : 'var(--g)',
                    }} />
                  </div>
                  <span className="jp-bval">{cat.count}</span>
                  <span className="pred-sev-dots" style={{display:'flex',gap:'2px',marginLeft:'4px'}}>
                    {[0,1,2].map(d => <span key={d} style={{width:'4px',height:'4px',borderRadius:'50%',background: d < (cat.meanSeverity >= 70 ? 3 : cat.meanSeverity >= 40 ? 2 : 1) ? (cat.meanSeverity >= 70 ? 'var(--warn)' : 'var(--g)') : 'var(--g07)'}} />)}
                  </span>
                  <span className="pred-trend-icon" style={{ color: trendColor(cat.trend) }}>{trendIcon(cat.trend)}</span>
                </div>
              ))}
          </div>

          {/* Scenario Builder */}
          <div className="scenario-builder">
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
              RUN SCENARIOS
            </button>
          </div>

          {/* Scenario Predictions */}
          {showScenarios && filteredScenarios.length > 0 && (
            <div className="predictions-grid">
              {filteredScenarios.map((p, i) => (
                <div key={i} className="prediction-card jp-panel" style={{ '--delay': `${i * 60}ms` } as React.CSSProperties}>
                  <div className="pred-category jp-intel-lbl">{p.category}</div>
                  <div className="pred-outcome">{p.outcome}</div>
                  <div className="pred-prob-row">
                    <div className="pred-bar-bg jp-intel-bar">
                      <div className="pred-bar-fill jp-intel-fill" style={{ width: `${p.probability}%`, background: probColor(p.probability) }} />
                    </div>
                    <span className="pred-pct" style={{ color: probColor(p.probability) }}>{p.probability}%</span>
                  </div>
                  <div className="pred-meta">
                    <span>{p.timeframe}</span>
                    <span className="pred-sev" style={{ color: p.severity === 'CRITICAL' || p.severity === 'HIGH' ? 'var(--warn)' : 'var(--g3)' }}>{p.severity}</span>
                    {p.actors.length > 0 && <span className="pred-actors">{p.actors.join(', ')}</span>}
                  </div>
                </div>
              ))}
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

/* ── Sub-components ── */

function ProfileCard({ label, value, max, warn, unit }: { label: string; value: number; max: number; warn?: boolean; unit?: string }) {
  return (
    <div className="pred-profile-card">
      <div className="jp-intel-lbl">{label}</div>
      <div className="pred-profile-val" style={{ color: warn ? 'var(--warn)' : 'var(--g7)' }}>
        {value}{unit || ''}
      </div>
      <div className="jp-intel-bar">
        <div className="jp-intel-fill" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: warn ? 'var(--warn)' : 'var(--g)' }} />
      </div>
    </div>
  )
}

function TimeWindow({ label, data }: { label: string; data: { meanSeverity: number; count: number } }) {
  return (
    <div className="pred-tw-cell">
      <div className="jp-intel-lbl">{label}</div>
      <div className="pred-tw-val">{data.count > 0 ? data.meanSeverity : '—'}</div>
      <div className="pred-tw-ct">{data.count} events</div>
    </div>
  )
}
