import { PredictorEngine } from '@/components/predictor/PredictorEngine'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import { DevTag } from '@/components/shared/DevTag'

interface Props {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
}

export function PredictorEngineTile({ incidents, airspace, prices }: Props) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      <PredictorEngine incidents={incidents} airspace={airspace} prices={prices} />
      <DevTag id="A.17" />
    </div>
  )
}
