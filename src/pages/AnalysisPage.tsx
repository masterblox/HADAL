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
          Incident analytics, prediction engine, regional intelligence, market monitors.
        </p>
      </section>
      <AnalysisSection incidents={incidents} />
      <PredictorEngine incidents={incidents} airspace={airspace} prices={prices} />
      <RegionalPanel />
      <EconomicSection prices={prices} sandbox={sandbox} />
    </>
  )
}
