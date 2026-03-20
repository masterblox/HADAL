import { LeftRail } from './LeftRail'
import { GlobeView } from './GlobeView'
import { RightRail } from './RightRail'
import type { PredictionResult } from '@/lib/prediction/types'
import type { Incident } from '@/hooks/useDataPipeline'

interface HeroGridProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean }
  prediction: PredictionResult | null
  incidents: Incident[]
}

export function HeroGrid({ sandbox, threatLevel, pipelineStatus, prediction, incidents }: HeroGridProps) {
  return (
    <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 0 }}>
      <LeftRail sandbox={sandbox} threatLevel={threatLevel} pipelineStatus={pipelineStatus} prediction={prediction} />
      <GlobeView incidents={incidents} />
      <RightRail sandbox={sandbox} incidents={incidents} />
    </div>
  )
}
