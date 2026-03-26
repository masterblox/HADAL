import type { PipelineHealth, PriceData, AirspaceData } from '@/hooks/useDataPipeline'
import type { Incident } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'
import { navigateTo } from '@/lib/lane-routing'
import { ConsoleCircuitShell } from '@/components/console/ConsoleCircuitShell'
import { DevTag } from '@/components/shared/DevTag'
import { FeatureBar } from '@/components/shared/FeatureBar'

interface OverviewPageProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  prediction: PredictionResult | null
  incidents: Incident[]
  prices: PriceData | null
  airspace: AirspaceData | null
}

export function OverviewPage({
  sandbox: _sandbox,
  threatLevel,
  pipelineStatus: _pipelineStatus,
  prediction,
  incidents,
  prices: _prices,
  airspace: _airspace,
}: OverviewPageProps) {
  const dominant = prediction?.dominantScenario ?? 'NO DOMINANT SCENARIO'
  const theatrePosture = threatLevel == null
    ? 'PIPELINE DEGRADED'
    : threatLevel >= 60
      ? 'ELEVATED THEATRE POSTURE'
      : 'GUARDED THEATRE POSTURE'

  return (
    <section className="overview-landing jp-panel" style={{ position: 'relative' }}>
      <div className="overview-landing-copy">
        <div className="page-kicker">HADAL // GULF THEATRE // THREAT</div>
        <h1 className="page-title">THEATRE INTEL</h1>
        <div className="overview-landing-signal">
          <span className="overview-landing-label">THEATRE POSTURE</span>
          <span className="overview-landing-value" style={threatLevel != null && threatLevel >= 60 ? { color: 'var(--warn)' } : undefined}>
            {threatLevel ?? '—'}
          </span>
          <span className="overview-landing-meta">{theatrePosture}</span>
        </div>
        <div className="overview-landing-strip">
          <div className="overview-landing-strip-row">
            <span className="overview-landing-strip-key">DOMINANT SCENARIO</span>
            <span className="overview-landing-strip-val">{dominant}</span>
          </div>
          <div className="overview-landing-strip-row">
            <span className="overview-landing-strip-key">LIVE INCIDENTS</span>
            <span className="overview-landing-strip-val">{incidents.length || '—'}</span>
          </div>
          <div className="overview-landing-strip-row">
            <span className="overview-landing-strip-key">MODEL STATUS</span>
            <span className={`overview-landing-strip-val${!prediction?.sufficient ? ' warn' : ''}`}>
              {prediction?.sufficient ? 'LIVE' : 'DEGRADED'}
            </span>
          </div>
        </div>
        <div className="overview-landing-actions">
          <button type="button" className="overview-landing-btn primary" onClick={() => navigateTo('operations')}>
            ENTER MAPS →
          </button>
          <button type="button" className="overview-landing-btn" onClick={() => navigateTo('console')}>
            OPEN CONSOLE →
          </button>
        </div>
      </div>
      <div className="overview-landing-hero">
        <ConsoleCircuitShell incidents={incidents} onEdit={() => navigateTo('console')} />
      </div>
      <FeatureBar />
      <DevTag id="B" />
    </section>
  )
}
