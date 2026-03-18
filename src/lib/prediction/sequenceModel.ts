/* ══════════════════════════════════════════════════════════
   STAGE 3 — SEQUENCE MODEL
   Follow-on prediction from Gulf Watch legacy.
   Given actor+action patterns, what follows within 24h/72h/7d?
   ══════════════════════════════════════════════════════════ */

import type { NormalizedEvent, ScenarioPrediction, EventType, SeverityLabel, Timeframe } from './types'

const TIMEFRAMES: { label: Timeframe; ms: number }[] = [
  { label: '24H', ms: 24 * 3600000 },
  { label: '72H', ms: 72 * 3600000 },
  { label: '7D', ms: 7 * 86400000 },
]

// ── Build outcome patterns: after event_type in country, what follows? ──

interface OutcomeMap {
  [key: string]: {
    total: number
    followUps: Record<Timeframe, Record<string, number>>
  }
}

function buildOutcomePatterns(events: NormalizedEvent[]): OutcomeMap {
  const byCountry: Record<string, NormalizedEvent[]> = {}
  for (const e of events) {
    if (!byCountry[e.country]) byCountry[e.country] = []
    byCountry[e.country].push(e)
  }

  const outcomes: OutcomeMap = {}

  for (const [country, countryEvents] of Object.entries(byCountry)) {
    const sorted = [...countryEvents].sort((a, b) => a.timestamp - b.timestamp)

    for (let i = 0; i < sorted.length; i++) {
      const key = `${sorted[i].type}_${country}`
      if (!outcomes[key]) {
        outcomes[key] = { total: 0, followUps: { '24H': {}, '72H': {}, '7D': {} } }
      }
      outcomes[key].total++

      for (let j = i + 1; j < sorted.length; j++) {
        const dt = sorted[j].timestamp - sorted[i].timestamp
        for (const tf of TIMEFRAMES) {
          if (dt <= tf.ms) {
            const ftype = sorted[j].type
            outcomes[key].followUps[tf.label][ftype] = (outcomes[key].followUps[tf.label][ftype] || 0) + 1
          }
        }
      }
    }
  }

  return outcomes
}

// ── Escalation rate: last 3 days vs prior 3 days ──

function computeEscalation(events: NormalizedEvent[]): number {
  const byDay: Record<string, number> = {}
  for (const e of events) {
    const day = new Date(e.timestamp).toISOString().slice(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
  }
  const sorted = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]))
  if (sorted.length < 6) return 0
  const early = sorted.slice(0, 3).reduce((s, d) => s + d[1], 0)
  const late = sorted.slice(-3).reduce((s, d) => s + d[1], 0)
  return early > 0 ? +((late - early) / early * 100).toFixed(1) : 0
}

// ── Actor frequency ranking ──

function topActors(events: NormalizedEvent[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const e of events) {
    if (e.actor !== 'unknown') counts[e.actor] = (counts[e.actor] || 0) + 1
  }
  return counts
}

// ── Severity label ──

function severityLabel(prob: number): SeverityLabel {
  if (prob >= 80) return 'CRITICAL'
  if (prob >= 60) return 'HIGH'
  if (prob >= 35) return 'MEDIUM'
  return 'LOW'
}

// ── Main sequence prediction ──

export function predictSequences(events: NormalizedEvent[]): ScenarioPrediction[] {
  if (events.length < 5) return []

  const outcomes = buildOutcomePatterns(events)
  const escalation = computeEscalation(events)
  const actors = topActors(events)
  const topActorList = Object.entries(actors).sort((a, b) => b[1] - a[1]).slice(0, 3).map(a => a[0])

  const predictions: ScenarioPrediction[] = []
  const seen = new Set<string>()

  // Escalation alert
  if (escalation > 10) {
    predictions.push({
      category: 'ESCALATION ALERT',
      outcome: `Activity up ${escalation}% in last 3 days vs prior 3`,
      probability: Math.min(40 + escalation, 75),
      timeframe: '72H',
      severity: severityLabel(Math.min(40 + escalation, 75)),
      actors: topActorList,
      confidence: `Based on ${events.length} recent incidents`,
    })
  }

  // Base rates: how often each type appears overall (for lift calculation)
  const totalEvents = events.length
  const typeFreq: Record<string, number> = {}
  for (const e of events) typeFreq[e.type] = (typeFreq[e.type] || 0) + 1

  // Type-based follow-on predictions from outcome patterns
  for (const [key, data] of Object.entries(outcomes)) {
    if (data.total < 2) continue

    for (const tf of TIMEFRAMES) {
      const followUps = Object.entries(data.followUps[tf.label])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)

      for (const [followType, count] of followUps) {
        const rawProb = count / data.total
        // Base-rate discount: only meaningful if observed rate exceeds what
        // you'd expect from the overall type frequency. This prevents dense
        // data from trivially producing 95% on everything.
        const baseRate = (typeFreq[followType] || 1) / totalEvents
        const lift = rawProb / Math.max(baseRate, 0.01)
        if (lift < 1.3) continue // follow-on rate must be 30%+ above base rate

        // Density discount: with dense data, raw count/total trivially → 1.0.
        // Scale down by inverse-sqrt of total AND by timeframe length.
        const density = Math.min(1, 3 / Math.sqrt(data.total))
        // Longer windows are less meaningful (7D follow-on is nearly guaranteed)
        const tfDiscount = tf.label === '7D' ? 0.5 : tf.label === '72H' ? 0.7 : 1.0
        const prob = Math.round(rawProb * density * tfDiscount * 100)
        if (prob < 10) continue

        const dedup = `${followType}_${key}_${tf.label}`
        if (seen.has(dedup)) continue
        seen.add(dedup)

        const [srcType, country] = key.split('_')
        const relevantActors = events
          .filter(e => e.type === srcType as EventType && e.country === country && e.actor !== 'unknown')
          .map(e => e.actor)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 3)

        const cappedProb = Math.min(prob, 75)
        predictions.push({
          category: 'FOLLOW-ON EVENT',
          outcome: `${formatType(followType)} activity in ${(country || 'REGION').toUpperCase()} after ${formatType(srcType)}`,
          probability: cappedProb,
          timeframe: tf.label,
          severity: severityLabel(cappedProb),
          actors: relevantActors.length ? relevantActors : topActorList,
          confidence: `${count}/${data.total} events · lift ${lift.toFixed(1)}x`,
        })
      }
    }
  }

  // Default doctrine predictions based on dominant event types (enriched from Gulf Watch upstream)
  const typeCounts: Record<string, number> = {}
  for (const e of events) typeCounts[e.type] = (typeCounts[e.type] || 0) + 1
  const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0]

  const kineticCount = (typeCounts['missile'] || 0) + (typeCounts['drone'] || 0) + (typeCounts['airstrike'] || 0)
  if (kineticCount >= 3) {
    if (!seen.has('MILITARY_RESPONSE')) {
      predictions.push({
        category: 'MILITARY RESPONSE',
        outcome: 'Retaliatory strikes or defense activation',
        probability: 65,
        timeframe: '72H',
        severity: 'HIGH',
        actors: topActorList,
        confidence: 'Standard military doctrine',
      })
    }
    if (!seen.has('MARKET_IMPACT')) {
      predictions.push({
        category: 'MARKET IMPACT',
        outcome: 'Oil price volatility (+2-5%)',
        probability: 45,
        timeframe: '24H',
        severity: 'MEDIUM',
        actors: [],
        confidence: 'Historical commodity response',
      })
    }
    if (!seen.has('DIPLOMATIC_RESPONSE')) {
      predictions.push({
        category: 'DIPLOMATIC RESPONSE',
        outcome: 'Emergency consultations or condemnations',
        probability: 30,
        timeframe: '72H',
        severity: 'LOW',
        actors: [],
        confidence: 'Standard diplomatic protocol',
      })
    }
  }

  // Naval action patterns (from Gulf Watch upstream)
  if (dominantType === 'naval') {
    if (!seen.has('MARITIME_SECURITY')) {
      predictions.push({
        category: 'MARITIME SECURITY',
        outcome: 'Increased naval patrols in region',
        probability: 55,
        timeframe: '72H',
        severity: 'MEDIUM',
        actors: topActorList,
        confidence: 'Standard naval response',
      })
    }
    if (!seen.has('SHIPPING_IMPACT')) {
      predictions.push({
        category: 'SHIPPING IMPACT',
        outcome: 'Insurance premiums rise, route changes',
        probability: 55,
        timeframe: '7D',
        severity: 'MEDIUM',
        actors: [],
        confidence: 'Market response pattern',
      })
    }
  }

  // Intercept patterns (from Gulf Watch upstream)
  const interceptCount = typeCounts['missile'] || 0
  const hasIntercepts = events.some(e => e.type === 'missile' && e.target.toLowerCase().includes('intercept'))
  if (hasIntercepts || (interceptCount >= 3 && dominantType === 'missile')) {
    if (!seen.has('ESCALATION_RISK')) {
      predictions.push({
        category: 'ESCALATION RISK',
        outcome: 'Attacker may attempt follow-up strikes',
        probability: 55,
        timeframe: '24H',
        severity: 'MEDIUM',
        actors: topActorList,
        confidence: 'Post-interception patterns',
      })
    }
    if (!seen.has('DEFENSE_POSTURE')) {
      predictions.push({
        category: 'DEFENSE POSTURE',
        outcome: 'Heightened alert status maintained',
        probability: 60,
        timeframe: '7D',
        severity: 'HIGH',
        actors: [],
        confidence: 'Standard defense protocol',
      })
    }
  }

  // Regional response prediction from actor-action patterns (from Gulf Watch upstream)
  const actorCountryMap: Record<string, Record<string, number>> = {}
  for (const e of events) {
    if (e.actor === 'unknown') continue
    const key = `${e.actor}_${e.type}`
    if (!actorCountryMap[key]) actorCountryMap[key] = {}
    actorCountryMap[key][e.country] = (actorCountryMap[key][e.country] || 0) + 1
  }
  for (const [patternKey, countries] of Object.entries(actorCountryMap)) {
    const sorted = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 3)
    if (sorted.length === 0 || sorted[0][1] < 2) continue
    const dedupKey = `REGIONAL_${patternKey}`
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)
    const [actor] = patternKey.split('_')
    const prob = Math.min(25 + sorted[0][1] * 3, 55)
    predictions.push({
      category: 'REGIONAL RESPONSE',
      outcome: `Escalation likely in ${sorted.map(c => c[0].toUpperCase()).join(', ')}`,
      probability: prob,
      timeframe: '72H',
      severity: severityLabel(prob),
      actors: [actor],
      confidence: 'Based on historical patterns',
    })
  }

  // Balanced output: up to 4 follow-on + remaining from other categories
  // This prevents dense data from flooding the ledger with identical follow-ons.
  const followOns = predictions
    .filter(p => p.category === 'FOLLOW-ON EVENT')
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 4)
  const others = predictions
    .filter(p => p.category !== 'FOLLOW-ON EVENT')
    .sort((a, b) => b.probability - a.probability)
  return [...others, ...followOns]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 8)
}

function formatType(type: string): string {
  const formats: Record<string, string> = {
    missile: 'Missile', airstrike: 'Airstrike', drone: 'Drone',
    ground: 'Ground Op', naval: 'Naval', cyber: 'Cyber',
    diplomatic: 'Diplomatic', general: 'Security',
  }
  return formats[type] || type.charAt(0).toUpperCase() + type.slice(1)
}
