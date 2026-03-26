import { IntelWireSection } from '@/components/intel/IntelWireSection'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import { navigateTo } from '@/lib/lane-routing'
import type { PredictionResult } from '@/lib/prediction/types'
import { SituationStrip } from '@/components/overview/SituationStrip'
import { SepBand } from '@/components/sep/SepBand'
import { MissileDefenseStrip } from '@/components/missile/MissileDefenseStrip'
import { ScenarioOutlook } from '@/components/overview/ScenarioOutlook'
import { ThreatFeed } from '@/components/feed/ThreatFeed'
import { DevTag } from '@/components/shared/DevTag'

interface OperationsPageProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices?: PriceData | null
  prediction: PredictionResult | null
  sandbox: boolean
}

export function OperationsPage({ incidents, airspace, prices, prediction, sandbox }: OperationsPageProps) {
  return (
    <div style={{ position: 'relative' }}>
      <SituationStrip prices={prices ?? null} airspace={airspace} prediction={prediction} />
      <SepBand incidents={incidents} />
      <section className="page-intro jp-panel">
        <div className="page-intro-header">
          <div>
            <div className="page-kicker">Lane 2</div>
            <h1 className="page-title">Maps</h1>
          </div>
          <div className="page-statline">
            <span>Map workspace</span>
            <span>{airspace?.total_notams ?? 0} NOTAMs</span>
            <span>{incidents.length} live events</span>
          </div>
        </div>
        <p className="page-copy">
          Tactical map, airspace status, participant tracking, and the live command picture around the theatre.
        </p>
      </section>
      <IntelWireSection incidents={incidents} airspace={airspace} prices={prices} sandbox={sandbox} />
      <div className="maps-support-stack">
        <MissileDefenseStrip sandbox={sandbox} incidents={incidents} />
        <div className="maps-support-grid">
          <ScenarioOutlook prediction={prediction} />
          <ThreatFeed incidents={incidents} />
        </div>
      </div>
      <section className="lane-footer-grid">
        <article className="lane-footer-card jp-panel">
          <div className="lane-cta-kicker">Console → ANALYSIS preset</div>
          <h2 className="lane-cta-title">Analysis</h2>
          <button type="button" className="lane-cta-btn" onClick={() => navigateTo('console')}>
            OPEN →
          </button>
        </article>
      </section>
      <DevTag id="N" />
    </div>
  )
}
