import type { PipelineHealth } from '@/hooks/useDataPipeline'
import { GlobeView } from './GlobeView'
import { HeroSidebar } from './HeroSidebar'
import type { PredictionResult } from '@/lib/prediction/types'
import type { Incident } from '@/hooks/useDataPipeline'

interface HeroGridProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  prediction: PredictionResult | null
  incidents: Incident[]
}

export function HeroGrid({ sandbox: _sandbox, threatLevel, pipelineStatus, prediction, incidents }: HeroGridProps) {
  return (
    <section className="hero-grid">
      <div className="hero-stage jp-panel">
        <HeroSidebar
          threatLevel={threatLevel}
          pipelineStatus={pipelineStatus}
          prediction={prediction}
          incidents={incidents}
        />
        <GlobeView incidents={incidents} />
      </div>
    </section>
  )
}
