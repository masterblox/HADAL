import { useState, useMemo } from 'react'
import type { Incident } from '../../hooks/useDataPipeline'

/* ── types ── */
interface Prediction {
  category: string
  outcome: string
  probability: number
  timeframe: string
  confidence: string
}

interface Scenario {
  actor: string
  action: string
  target: string
  country: string
}

/* ── static options ── */
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

/* ── prediction logic (ported from GulfWatch GulfPredictor) ── */

const ACTOR_KEYWORDS: Record<string, string[]> = {
  houthi: ['houthi', 'houthis'],
  israel: ['israel', 'israeli', 'idf'],
  iran: ['iran', 'iranian', 'irgc'],
  saudi: ['saudi', 'arabia', 'ksa'],
  uae: ['uae', 'emirates', 'emirati'],
  us: ['us', 'usa', 'american', 'pentagon'],
  uk: ['uk', 'british', 'britain'],
  hezbollah: ['hezbollah', 'hizbullah'],
  hamas: ['hamas'],
  isis: ['isis', 'islamic state', 'daesh'],
}

const ACTION_KEYWORDS: Record<string, string[]> = {
  strike: ['strike', 'strikes', 'struck', 'attack', 'attacks', 'attacked'],
  drone: ['drone', 'drones', 'uav'],
  missile: ['missile', 'missiles', 'rocket', 'rockets', 'ballistic'],
  intercept: ['intercept', 'intercepted', 'shot down', 'destroyed'],
  bomb: ['bomb', 'bombing', 'explosion', 'explosive'],
  naval: ['naval', 'ship', 'ships', 'vessel'],
  sanction: ['sanction', 'sanctions', 'embargo'],
  deploy: ['deploy', 'deployment', 'deployed', 'troops', 'forces'],
}

function extractActorAction(title: string) {
  const lower = title.toLowerCase()
  let actor: string | null = null
  let action: string | null = null
  for (const [a, kw] of Object.entries(ACTOR_KEYWORDS)) {
    if (kw.some(k => lower.includes(k))) { actor = a; break }
  }
  for (const [a, kw] of Object.entries(ACTION_KEYWORDS)) {
    if (kw.some(k => lower.includes(k))) { action = a; break }
  }
  return actor && action ? { actor, action } : null
}

function predict(incidents: Incident[], scenario: Scenario): Prediction[] {
  const cutoff = Date.now() - 14 * 86400000
  const recent = incidents.filter(i => i.published && new Date(i.published).getTime() >= cutoff)

  // Build actor-action patterns
  const actorActions: Record<string, { count: number; countries: Record<string, number> }> = {}
  recent.forEach(inc => {
    if (!inc.title) return
    const ex = extractActorAction(inc.title)
    if (ex) {
      const key = `${ex.actor}_${ex.action}`
      if (!actorActions[key]) actorActions[key] = { count: 0, countries: {} }
      actorActions[key].count++
      const c = inc.location?.country || 'unknown'
      actorActions[key].countries[c] = (actorActions[key].countries[c] || 0) + 1
    }
  })

  // Escalation rate
  const byDay: Record<string, number> = {}
  recent.forEach(inc => {
    if (!inc.published) return
    const day = new Date(inc.published).toISOString().slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  })
  const sorted = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  let escalation = 0
  if (sorted.length >= 6) {
    const early = sorted.slice(0, 3).reduce((s, d) => s + d[1], 0)
    const late = sorted.slice(-3).reduce((s, d) => s + d[1], 0)
    if (early > 0) escalation = +((late - early) / early * 100).toFixed(1)
  }

  const preds: Prediction[] = []

  // Escalation alert
  if (escalation > 10) {
    preds.push({
      category: 'ESCALATION ALERT',
      outcome: `Activity up ${escalation}% in last 3 days vs prior 3`,
      probability: Math.min(50 + escalation, 90),
      timeframe: '48–72 HRS',
      confidence: `${recent.length} incidents analyzed`,
    })
  }

  // Pattern-based
  const patternKey = `${scenario.actor}_${scenario.action}`
  const ap = actorActions[patternKey]
  if (ap) {
    const countries = Object.entries(ap.countries).sort((a, b) => b[1] - a[1]).slice(0, 3)
    if (countries.length) {
      preds.push({
        category: 'REGIONAL RESPONSE',
        outcome: `Escalation likely in ${countries.map(c => c[0].toUpperCase()).join(', ')}`,
        probability: Math.min(60 + countries[0][1] * 5, 95),
        timeframe: '24–72 HRS',
        confidence: 'Historical pattern match',
      })
    }
  }

  // Default predictions based on action
  if (['missile', 'drone', 'strike'].includes(scenario.action)) {
    preds.push(
      { category: 'MILITARY RESPONSE', outcome: 'Retaliatory strikes or defense activation', probability: 75, timeframe: '< 48 HRS', confidence: 'Standard military doctrine' },
      { category: 'MARKET IMPACT', outcome: 'Oil price volatility (+2–5%)', probability: 60, timeframe: '24 HRS', confidence: 'Historical commodity response' },
      { category: 'DIPLOMATIC RESPONSE', outcome: 'Emergency consultations or condemnations', probability: 45, timeframe: '24–72 HRS', confidence: 'Standard diplomatic protocol' },
    )
  } else if (['naval'].includes(scenario.action)) {
    preds.push(
      { category: 'MARITIME SECURITY', outcome: 'Increased naval patrols in region', probability: 70, timeframe: '48–96 HRS', confidence: 'Standard naval response' },
      { category: 'SHIPPING IMPACT', outcome: 'Insurance premiums rise, route changes', probability: 55, timeframe: '1–2 WEEKS', confidence: 'Market response pattern' },
    )
  } else if (['intercept'].includes(scenario.action)) {
    preds.push(
      { category: 'ESCALATION RISK', outcome: 'Attacker may attempt follow-up strikes', probability: 65, timeframe: '24–48 HRS', confidence: 'Post-interception patterns' },
      { category: 'DEFENSE POSTURE', outcome: 'Heightened alert status maintained', probability: 80, timeframe: '7+ DAYS', confidence: 'Standard defense protocol' },
    )
  } else {
    preds.push(
      { category: 'MONITORING', outcome: 'Continued surveillance and analysis', probability: 90, timeframe: 'ONGOING', confidence: 'Standard procedure' },
      { category: 'DIPLOMATIC', outcome: 'Official statements from involved parties', probability: 70, timeframe: '24 HRS', confidence: 'Standard protocol' },
    )
  }

  // Deduplicate, sort, limit
  const seen = new Set<string>()
  return preds.filter(p => {
    const k = `${p.category}_${p.outcome}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).sort((a, b) => b.probability - a.probability).slice(0, 6)
}

/* ── Component ── */

export function PredictorEngine({ incidents }: { incidents: Incident[] }) {
  const [scenario, setScenario] = useState<Scenario>({ actor: 'houthi', action: 'missile', target: 'oil_facility', country: 'uae' })
  const [active, setActive] = useState(false)

  const predictions = useMemo(() => active ? predict(incidents, scenario) : [], [incidents, scenario, active])

  // Trend summary
  const [predNow] = useState(Date.now)
  const trendSummary = useMemo(() => {
    const cutoff = predNow - 14 * 86400000
    const recent = incidents.filter(i => i.published && new Date(i.published).getTime() >= cutoff)
    const byActor: Record<string, number> = {}
    recent.forEach(inc => {
      if (!inc.title) return
      const ex = extractActorAction(inc.title)
      if (ex) byActor[ex.actor] = (byActor[ex.actor] || 0) + 1
    })
    const top = Object.entries(byActor).sort((a, b) => b[1] - a[1])[0]
    return {
      total: recent.length,
      dailyAvg: (recent.length / 14).toFixed(1),
      topActor: top ? top[0].toUpperCase() : '—',
    }
  }, [incidents, predNow])

  const probColor = (p: number) =>
    p >= 70 ? 'var(--warn)' : p >= 40 ? 'var(--g)' : 'var(--g3)'

  return (
    <section className="predictor-section">
      {/* Header */}
      <div className="predictor-header">
        <div className="predictor-title-row">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 8 }}>
            <circle cx="8" cy="8" r="7" stroke="var(--g3)" strokeWidth="1" />
            <path d="M8 3v5l3 3" stroke="var(--g)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="predictor-title">SCENARIO PREDICTOR</span>
          <span className="predictor-subtitle">RULE-BASED · 14-DAY WINDOW</span>
        </div>
        <div className="predictor-trend">
          <span>{trendSummary.total} incidents</span>
          <span className="sep">|</span>
          <span>{trendSummary.dailyAvg}/day avg</span>
          <span className="sep">|</span>
          <span>TOP: {trendSummary.topActor}</span>
        </div>
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
        <button className="predict-btn" onClick={() => setActive(true)}>
          RUN PREDICTION
        </button>
      </div>

      {/* Predictions */}
      {active && predictions.length > 0 && (
        <div className="predictions-grid">
          {predictions.map((p, i) => (
            <div key={i} className="prediction-card" style={{ '--delay': `${i * 60}ms` } as React.CSSProperties}>
              <div className="pred-category">{p.category}</div>
              <div className="pred-outcome">{p.outcome}</div>
              <div className="pred-prob-row">
                <div className="pred-bar-bg">
                  <div className="pred-bar-fill" style={{ width: `${p.probability}%`, background: probColor(p.probability) }} />
                </div>
                <span className="pred-pct" style={{ color: probColor(p.probability) }}>{p.probability}%</span>
              </div>
              <div className="pred-meta">
                <span>{p.timeframe}</span>
                <span className="pred-conf">{p.confidence}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
