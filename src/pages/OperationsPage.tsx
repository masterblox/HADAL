import { IntelWireSection } from '@/components/intel/IntelWireSection'
import { FlightTracker } from '@/components/flight/FlightTracker'
import type { Incident, AirspaceData } from '@/hooks/useDataPipeline'
import { navigateTo } from '@/lib/lane-routing'

interface OperationsPageProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  sandbox: boolean
}

export function OperationsPage({ incidents, airspace, sandbox }: OperationsPageProps) {
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
          Map, layers, airspace, casualties, posturing.
        </p>
      </section>
      <IntelWireSection incidents={incidents} airspace={airspace} sandbox={sandbox} />
      <FlightTracker />
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
