import { HeroGrid } from '@/components/hero/HeroGrid'
import { MissileDefenseStrip } from '@/components/missile/MissileDefenseStrip'
import { SepBand } from '@/components/sep/SepBand'
import { ThreatFeed } from '@/components/feed/ThreatFeed'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'
import { navigateTo } from '@/lib/lane-routing'

interface OverviewPageProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean }
  prediction: PredictionResult | null
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
}

export function OverviewPage({
  sandbox,
  threatLevel,
  pipelineStatus,
  prediction,
  incidents,
  airspace,
  prices,
}: OverviewPageProps) {
  return (
    <>
      <section className="page-intro jp-panel">
        <div className="page-intro-header">
          <div>
            <div className="page-kicker">Lane 1</div>
            <h1 className="page-title">Overview</h1>
          </div>
          <div className="page-statline">
            <span>{incidents.length} tracked incidents</span>
            <span>{airspace?.total_notams ?? 0} NOTAMs</span>
            <span>Threat {threatLevel ?? '—'}</span>
          </div>
        </div>
        <p className="page-copy">
          First-stop operating picture: theatre posture, kinetic summary, and the live feed slice.
        </p>
      </section>

      <HeroGrid sandbox={sandbox} threatLevel={threatLevel} pipelineStatus={pipelineStatus} prediction={prediction} />
      <section className="lane-cta-grid">
        <article className="lane-cta jp-panel">
          <div className="lane-cta-kicker">Operations</div>
          <h2 className="lane-cta-title">Open the map workspace</h2>
          <p className="lane-cta-copy">
            Move from the at-a-glance lane into the full operational surface for map, layers, airspace, casualties, and posturing.
          </p>
          <div className="lane-cta-meta">
            <span>Map-first workspace</span>
            <span>{airspace?.airports_tracked ?? 0} airports tracked</span>
            <span>{incidents.length} live events</span>
          </div>
          <button type="button" className="lane-cta-btn" onClick={() => navigateTo('operations')}>
            OPEN OPERATIONS
          </button>
        </article>
        <article className="lane-cta jp-panel">
          <div className="lane-cta-kicker">Analysis</div>
          <h2 className="lane-cta-title">Open prediction and reporting</h2>
          <p className="lane-cta-copy">
            Use the analysis lane for model output, economic context, regional rollups, and future report/export workflows.
          </p>
          <div className="lane-cta-meta">
            <span>{prediction?.scenarios.length ?? 0} scenarios</span>
            <span>{prediction?.cascadeRisk.contagionScore ?? '—'} cascade</span>
            <span>{prices ? 'Market feed live' : 'Market feed offline'}</span>
          </div>
          <button type="button" className="lane-cta-btn" onClick={() => navigateTo('analysis')}>
            OPEN ANALYSIS
          </button>
        </article>
      </section>
      <MissileDefenseStrip sandbox={sandbox} incidents={incidents} />
      <SepBand incidents={incidents} />
      <ThreatFeed incidents={incidents} />
    </>
  )
}
