/* ══════════════════════════════════════════════════════════
   HADAL PREDICTION ENGINE — TYPES
   Pure CTI-native types. No API dependencies.
   ══════════════════════════════════════════════════════════ */

import type { Incident, AirspaceData, PriceData } from '../../hooks/useDataPipeline'

// ── Input contract ──

export type EventType = 'missile' | 'airstrike' | 'drone' | 'ground' | 'naval' | 'cyber' | 'diplomatic' | 'general'
export type SeverityLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type Timeframe = '24H' | '72H' | '7D'
export type Trend = 'escalating' | 'stable' | 'de-escalating'

export interface PredictionInput {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
}

export interface NormalizedEvent {
  id: string
  timestamp: number
  type: EventType
  actor: string
  target: string
  country: string
  severity: number          // 0-100
  impactPct: number         // 0-100, severity * verification weight
  verificationScore: number
  isGovernment: boolean
  casualties: { military: number; civilian: number }
  responseHours: number | null
}

// ── Bootstrap profile ──

export interface Percentiles {
  p5: number; p10: number; p25: number; p50: number
  p75: number; p90: number; p95: number
}

export interface CategoryProfile {
  count: number
  meanSeverity: number
  percentiles: { p10: number; p50: number; p90: number }
  trend: Trend
}

export interface TimeWindowProfile {
  meanSeverity: number
  count: number
}

export interface CascadeRisk {
  clusterCount: number
  maxClusterSize: number
  contagionScore: number    // 0-100
}

export interface ReactionWindow {
  medianResponseHours: number
  fastResponseImpact: number
  slowResponseImpact: number
}

// ── Scenario predictions ──

export interface ScenarioPrediction {
  category: string
  outcome: string
  probability: number       // 0-100
  timeframe: Timeframe
  severity: SeverityLabel
  actors: string[]
}

// ── Final output ──

export interface PredictionResult {
  sufficient: boolean
  generated: number

  global: {
    percentiles: Percentiles
    mean: number
    stdDev: number
    probSevere: number      // P(severity > 70)
    probCritical: number    // P(severity > 90)
  } | null

  categories: Record<string, CategoryProfile>

  timeWindows: {
    h24: TimeWindowProfile
    h72: TimeWindowProfile
    d7: TimeWindowProfile
  }

  cascadeRisk: CascadeRisk

  reactionWindow: ReactionWindow | null

  scenarios: ScenarioPrediction[]

  dominantScenario: string
  theatreThreatLevel: number  // 0-100
  airspacePressure: number    // 0-100
}
