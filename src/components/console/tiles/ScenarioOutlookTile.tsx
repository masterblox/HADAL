import { ScenarioOutlook } from '@/components/overview/ScenarioOutlook'
import type { PredictionResult } from '@/lib/prediction/types'

export function ScenarioOutlookTile({ prediction }: { prediction: PredictionResult | null }) {
  return (
    <div className="console-scenario">
      <ScenarioOutlook prediction={prediction} />
    </div>
  )
}
