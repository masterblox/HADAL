import { IntelWireSection } from '@/components/intel/IntelWireSection'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import { navigateTo } from '@/lib/lane-routing'

interface OperationsPageProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices?: PriceData | null
  sandbox: boolean
}

export function OperationsPage({ incidents, airspace, prices, sandbox }: OperationsPageProps) {
  return (
    <>
      <section className="page-intro jp-panel">
        <div className="page-intro-header">
          <div>
            <div className="page-kicker">Lane 2</div>
            <h1 className="page-title">Operations</h1>
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
      <IntelWireSection incidents={incidents} airspace={airspace} prices={prices} sandbox={sandbox} />
      <section className="lane-footer-grid">
        <article className="lane-footer-card jp-panel">
          <div className="lane-cta-kicker">Lane 3</div>
          <h2 className="lane-cta-title">Analysis</h2>
          <button type="button" className="lane-cta-btn" onClick={() => navigateTo('analysis')}>
            OPEN →
          </button>
        </article>
      </section>
    </>
  )
}
