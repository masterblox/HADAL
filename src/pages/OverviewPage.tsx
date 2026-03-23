import type { PipelineHealth, PriceData, AirspaceData } from '@/hooks/useDataPipeline'
import { HeroGrid } from '@/components/hero/HeroGrid'
import { SituationStrip } from '@/components/overview/SituationStrip'
import { MissileDefenseStrip } from '@/components/missile/MissileDefenseStrip'
import { SepBand } from '@/components/sep/SepBand'
import { ScenarioOutlook } from '@/components/overview/ScenarioOutlook'
import { ThreatFeed } from '@/components/feed/ThreatFeed'
import type { Incident } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'

interface OverviewPageProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  prediction: PredictionResult | null
  incidents: Incident[]
  prices: PriceData | null
  airspace: AirspaceData | null
}

export function OverviewPage({
  sandbox,
  threatLevel,
  pipelineStatus,
  prediction,
  incidents,
  prices,
  airspace,
}: OverviewPageProps) {
  return (
    <>
      <HeroGrid sandbox={sandbox} threatLevel={threatLevel} pipelineStatus={pipelineStatus} prediction={prediction} incidents={incidents} />
      <SituationStrip prices={prices} airspace={airspace} prediction={prediction} />
      <MissileDefenseStrip sandbox={sandbox} incidents={incidents} />
      <SepBand incidents={incidents} />
      <ScenarioOutlook prediction={prediction} />
      <ThreatFeed incidents={incidents} />
    </>
  )
}
