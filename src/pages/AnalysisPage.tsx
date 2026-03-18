import { PredictorEngine } from '@/components/predictor/PredictorEngine'
import { AnalysisSection } from '@/components/analysis/AnalysisSection'
import { RegionalPanel } from '@/components/regional/RegionalPanel'
import { EconomicSection } from '@/components/economic/EconomicSection'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'

interface AnalysisPageProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
  sandbox: boolean
}

export function AnalysisPage({ incidents, airspace, prices, sandbox }: AnalysisPageProps) {
  return (
    <>
      <section className="page-intro jp-panel">
        <div className="page-intro-header">
          <div>
            <div className="page-kicker">Lane 3</div>
            <h1 className="page-title">Analysis</h1>
          </div>
          <div className="page-statline">
            <span>{prices ? 'Prices live' : 'Prices offline'}</span>
            <span>{airspace?.airports_tracked ?? 0} airports</span>
            <span>{incidents.length} events in scope</span>
          </div>
        </div>
        <p className="page-copy">
          This lane owns prediction, regional interpretation, economic context, and future report/export workflows.
        </p>
      </section>
      <section className="analysis-launchpad">
        <article className="launch-card jp-panel">
          <div className="lane-cta-kicker">Placeholder</div>
          <h2 className="lane-cta-title">Report Builder</h2>
          <p className="lane-cta-copy">
            SITREP generation and export belong here once artifact contracts and delivery workflows are finalized.
          </p>
        </article>
        <article className="launch-card jp-panel">
          <div className="lane-cta-kicker">Placeholder</div>
          <h2 className="lane-cta-title">Narrative Engine</h2>
          <p className="lane-cta-copy">
            Future ICEBERG-style reasoning and narrative integrity modules should land here, not back on the homepage.
          </p>
        </article>
      </section>
      <PredictorEngine incidents={incidents} airspace={airspace} prices={prices} />
      <AnalysisSection incidents={incidents} />
      <RegionalPanel />
      <EconomicSection prices={prices} sandbox={sandbox} />
    </>
  )
}
