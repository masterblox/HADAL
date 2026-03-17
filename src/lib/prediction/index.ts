/* ══════════════════════════════════════════════════════════
   HADAL PREDICTION ENGINE — PUBLIC API
   Single entry point: runPrediction(input) → PredictionResult
   Pure local math. Zero API calls.
   ══════════════════════════════════════════════════════════ */

import type { PredictionInput, PredictionResult } from './types'
import { normalizeIncidents } from './normalizePredictionInputs'
import { buildPrediction } from './buildPrediction'

export type { PredictionResult, PredictionInput } from './types'
export type { NormalizedEvent, ScenarioPrediction, CategoryProfile } from './types'

export function runPrediction(input: PredictionInput): PredictionResult {
  // Stage 1: Normalize
  const events = normalizeIncidents(input.incidents, 14)

  // Stages 2-4: Profile + Sequence + Build
  return buildPrediction(events, input.airspace, input.prices)
}
