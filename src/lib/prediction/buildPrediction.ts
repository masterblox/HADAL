/* ══════════════════════════════════════════════════════════
   STAGE 4 — BUILD PREDICTION
   Merges bootstrap profile + sequence model.
   Adds airspace pressure + price sensitivity.
   Returns final PredictionResult.
   ══════════════════════════════════════════════════════════ */

import type { AirspaceData, PriceData } from '../../hooks/useDataPipeline'
import type { NormalizedEvent, PredictionResult } from './types'
import { profileGlobal, profileByCategory, profileByTimeWindow, analyzeCascadeRisk, analyzeResponseImpact } from './impactProfiler'
import { predictSequences } from './sequenceModel'

const MIN_EVENTS = 5

// ── Airspace pressure from NOTAMs ──

function computeAirspacePressure(airspace: AirspaceData | null): number {
  if (!airspace?.notams?.length) return 0
  const sevWeights: Record<string, number> = {
    CRITICAL: 30, WARNING: 20, ELEVATED: 10, INFORMATION: 3,
  }
  let score = 0
  for (const notam of airspace.notams) {
    score += sevWeights[notam.severity || ''] || 3
  }
  return Math.min(100, score)
}

// ── Theatre threat level: composite score ──

function computeThreatLevel(
  global: PredictionResult['global'],
  cascade: PredictionResult['cascadeRisk'],
  airspacePressure: number,
  priceSignal: number,
): number {
  if (!global) return 0
  const severityComponent = global.mean * 0.4
  const volatilityComponent = global.probSevere * 0.2
  const cascadeComponent = cascade.contagionScore * 0.15
  const airspaceComponent = airspacePressure * 0.15
  const priceComponent = priceSignal * 0.1
  return Math.min(100, Math.round(severityComponent + volatilityComponent + cascadeComponent + airspaceComponent + priceComponent))
}

// ── Price sensitivity signal ──

function priceSignal(prices: PriceData | null): number {
  if (!prices?.brent) return 0
  const change = Math.abs(prices.brent.change || 0)
  // >3% move = high signal, >1% = moderate
  return Math.min(100, Math.round(change * 25))
}

// ── Main build ──

export function buildPrediction(
  events: NormalizedEvent[],
  airspace: AirspaceData | null,
  prices: PriceData | null,
): PredictionResult {
  const generated = Date.now()

  if (events.length < MIN_EVENTS) {
    return {
      sufficient: false,
      generated,
      global: null,
      categories: {},
      timeWindows: { h24: { meanSeverity: 0, count: 0 }, h72: { meanSeverity: 0, count: 0 }, d7: { meanSeverity: 0, count: 0 } },
      cascadeRisk: { clusterCount: 0, maxClusterSize: 0, contagionScore: 0 },
      reactionWindow: null,
      scenarios: [],
      dominantScenario: 'INSUFFICIENT DATA',
      theatreThreatLevel: 0,
      airspacePressure: 0,
    }
  }

  // Stage 2: Bootstrap profile
  const global = profileGlobal(events)
  const categories = profileByCategory(events)
  const timeWindows = profileByTimeWindow(events)
  const cascadeRisk = analyzeCascadeRisk(events)
  const reactionWindow = analyzeResponseImpact(events)

  // Stage 3: Sequence predictions
  const scenarios = predictSequences(events)

  // Composite signals
  const ap = computeAirspacePressure(airspace)
  const ps = priceSignal(prices)
  const threatLevel = computeThreatLevel(global, cascadeRisk, ap, ps)

  // Dominant scenario
  const dominant = scenarios[0]?.outcome || 'No dominant scenario'

  return {
    sufficient: true,
    generated,
    global,
    categories,
    timeWindows,
    cascadeRisk,
    reactionWindow,
    scenarios,
    dominantScenario: dominant,
    theatreThreatLevel: threatLevel,
    airspacePressure: ap,
  }
}
