import { PredictorEngine } from '@/components/predictor/PredictorEngine'
import { AnalysisSection } from '@/components/analysis/AnalysisSection'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'

interface AnalysisPageProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
  sandbox: boolean
}

export function AnalysisPage({ incidents, airspace, prices }: AnalysisPageProps) {
  return (
    <>
      <section className="page-intro jp-panel">
        <div className="page-intro-header">
          <div>
            <div className="page-kicker">Lane 3</div>
            <h1 className="page-title">Analysis</h1>
          </div>
          <div className="page-statline">
            <span>{incidents.length > 0 ? 'Incident analytics live' : 'No incidents in scope'}</span>
            <span>{airspace?.airports_tracked ?? 0} airports</span>
            <span>{incidents.length} events in scope</span>
          </div>
        </div>
        <p className="page-copy">
          Incident analytics and scenario modeling only. Regional and economic spillover surfaces move to Console.
        </p>
      </section>
      <AnalysisSection incidents={incidents} />
      <PredictorEngine incidents={incidents} airspace={airspace} prices={prices} />
    </>
  )
}
