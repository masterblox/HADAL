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
          Theatre posture, kinetic summary, live feed.
        </p>
      </section>

      <HeroGrid sandbox={sandbox} threatLevel={threatLevel} pipelineStatus={pipelineStatus} prediction={prediction} />
      <section className="lane-cta-grid">
        <article className="lane-cta jp-panel">
          <div className="lane-cta-kicker">Lane 2</div>
          <h2 className="lane-cta-title">Operations</h2>
          <div className="lane-cta-meta">
            <span>{airspace?.airports_tracked ?? 0} airports</span>
            <span>{incidents.length} events</span>
          </div>
          <button type="button" className="lane-cta-btn" onClick={() => navigateTo('operations')}>
            OPEN →
          </button>
        </article>
        <article className="lane-cta jp-panel">
          <div className="lane-cta-kicker">Lane 3</div>
          <h2 className="lane-cta-title">Analysis</h2>
          <div className="lane-cta-meta">
            <span>{prediction?.scenarios.length ?? 0} scenarios</span>
            <span>{prices ? 'Markets live' : 'Markets offline'}</span>
          </div>
          <button type="button" className="lane-cta-btn" onClick={() => navigateTo('analysis')}>
            OPEN →
          </button>
        </article>
      </section>
      <MissileDefenseStrip sandbox={sandbox} incidents={incidents} />
      <SepBand incidents={incidents} />
      <ThreatFeed incidents={incidents} />
    </>
  )
}
