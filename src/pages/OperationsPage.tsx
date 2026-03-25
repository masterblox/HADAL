import { IntelWireSection } from '@/components/intel/IntelWireSection'
import { SituationStrip } from '@/components/overview/SituationStrip'
import { MissileDefenseStrip } from '@/components/missile/MissileDefenseStrip'
import { SepBand } from '@/components/sep/SepBand'
import { ScenarioOutlook } from '@/components/overview/ScenarioOutlook'
import { ThreatFeed } from '@/components/feed/ThreatFeed'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'
import { navigateTo } from '@/lib/lane-routing'

interface OperationsPageProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices?: PriceData | null
  prediction: PredictionResult | null
  sandbox: boolean
}

export function OperationsPage({ incidents, airspace, prices, prediction, sandbox }: OperationsPageProps) {
  return (
    <>
      <section className="page-intro jp-panel">
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
      <SituationStrip prices={prices ?? null} airspace={airspace} prediction={prediction} />
      <MissileDefenseStrip sandbox={sandbox} incidents={incidents} />
      <SepBand incidents={incidents} />
      <IntelWireSection incidents={incidents} airspace={airspace} prices={prices} sandbox={sandbox} />
      <ScenarioOutlook prediction={prediction} />
      <ThreatFeed incidents={incidents} />
      <section className="lane-footer-grid">
        <article className="lane-footer-card jp-panel">
          <div className="lane-cta-kicker">Console → analyst workbench</div>
          <h2 className="lane-cta-title">Console</h2>
          <button type="button" className="lane-cta-btn" onClick={() => navigateTo('console')}>
            OPEN →
          </button>
        </article>
      </section>
    </>
  )
}
