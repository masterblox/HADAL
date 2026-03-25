import { IntelWireSection } from '@/components/intel/IntelWireSection'
import { SituationStrip } from '@/components/overview/SituationStrip'
import { MissileDefenseStrip } from '@/components/missile/MissileDefenseStrip'
import { ScenarioOutlook } from '@/components/overview/ScenarioOutlook'
import { ThreatFeed } from '@/components/feed/ThreatFeed'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'

interface OperationsPageProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices?: PriceData | null
  prediction: PredictionResult | null
  sandbox: boolean
}

export function OperationsPage({ incidents, airspace, prices, prediction, sandbox }: OperationsPageProps) {
  return (
    <div className="maps-page">
      <section className="page-intro jp-panel maps-intro">
        <div className="page-intro-header">
          <div>
            <div className="page-kicker">Map lane</div>
            <h1 className="page-title">Maps</h1>
          </div>
          <div className="page-statline">
            <span>Map workspace</span>
            <span>{airspace?.total_notams ?? 0} NOTAMs</span>
            <span>{incidents.length} live events</span>
          </div>
        </div>
        <p className="page-copy">
          Tactical map, airspace status, participant tracking, global posturing.
        </p>
      </section>
      <div className="maps-status-rail">
        <SituationStrip prices={prices ?? null} airspace={airspace} prediction={prediction} />
      </div>
      <IntelWireSection incidents={incidents} airspace={airspace} prices={prices} sandbox={sandbox} />
      <div className="maps-support-rail">
        <MissileDefenseStrip sandbox={sandbox} incidents={incidents} />
        <ScenarioOutlook prediction={prediction} />
        <ThreatFeed incidents={incidents} />
      </div>
    </div>
  )
}
