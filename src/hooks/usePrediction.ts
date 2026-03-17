/* ══════════════════════════════════════════════════════════
   usePrediction — React hook for HADAL prediction engine
   Runs locally. No API calls.
   ══════════════════════════════════════════════════════════ */

import { useMemo } from 'react'
import type { Incident, AirspaceData, PriceData } from './useDataPipeline'
import { runPrediction, type PredictionResult } from '../lib/prediction'

const useLocalPrediction =
  import.meta.env.VITE_PREDICTION_MODE === 'local' ||
  import.meta.env.VITE_DISABLE_PREDICTION_API === '1' ||
  true // Phase 1: always local

export function usePrediction(
  incidents: Incident[],
  airspace: AirspaceData | null,
  prices: PriceData | null,
): PredictionResult | null {
  return useMemo(() => {
    if (!useLocalPrediction) return null
    if (!incidents.length) return null
    return runPrediction({ incidents, airspace, prices })
  }, [incidents, airspace, prices])
}
