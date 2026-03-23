import { HeroSidebar } from '@/components/hero/HeroSidebar'
import type { PipelineHealth, Incident } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'

export function ThreatSignalTile({
  threatLevel,
  pipelineStatus,
  prediction,
  incidents,
}: {
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  prediction: PredictionResult | null
  incidents: Incident[]
}) {
  return (
    <div className="console-hero-signal">
      <HeroSidebar
        threatLevel={threatLevel}
        pipelineStatus={pipelineStatus}
        prediction={prediction}
        incidents={incidents}
      />
    </div>
  )
}
