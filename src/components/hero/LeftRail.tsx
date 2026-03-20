import type { PredictionResult } from '@/lib/prediction/types'
import type { PipelineHealth } from '@/hooks/useDataPipeline'

interface LeftRailProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  prediction: PredictionResult | null
}

export function LeftRail({ sandbox: _sandbox, threatLevel, pipelineStatus, prediction }: LeftRailProps) {
  const tl = threatLevel ?? 0
  const severity = tl >= 80 ? 'CRITICAL' : tl >= 60 ? 'HIGH' : tl >= 40 ? 'MEDIUM' : tl > 0 ? 'LOW' : '—'
  const trend = prediction?.categories ? Object.values(prediction.categories).some(c => c.trend === 'escalating') ? 'ESCALATING' : 'STABLE' : '—'

  return (
    <div className="lc" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Threat Index */}
      <div className="jp-panel ti-block" style={{ flex: '0 0 auto' }}>
        <div className="jp-panel-header ti-lbl">Threat Index</div>
        <div className="ti-big" style={{ fontSize: 'var(--fs-display)' }}>{threatLevel ?? '—'}</div>
        <div className="ti-sub">{severity} · {trend}</div>
        <div className="ti-bar"><div className="ti-bar-fill" style={{ width: `${tl}%` }} /></div>
      </div>

      {/* Prediction Profile */}
      <div className="jp-panel spec-block" style={{ flex: '1 1 auto' }}>
        <div className="jp-panel-header spec-lbl">PREDICTION PROFILE</div>
        <div className="spec-row"><span className="spec-k">SEVERITY</span><span className="spec-v" style={tl >= 60 ? { color: 'var(--warn)' } : undefined}>{prediction?.global?.mean ? Math.round(prediction.global.mean) : '—'}</span></div>
        <div className="spec-row"><span className="spec-k">P(SEVERE)</span><span className="spec-v" style={(prediction?.global?.probSevere ?? 0) >= 40 ? { color: 'var(--warn)' } : undefined}>{prediction?.global?.probSevere != null ? Math.round(prediction.global.probSevere) + '%' : '—'}</span></div>
        <div className="spec-row"><span className="spec-k">CASCADE</span><span className="spec-v" style={(prediction?.cascadeRisk?.contagionScore ?? 0) >= 50 ? { color: 'var(--warn)' } : undefined}>{prediction?.cascadeRisk?.contagionScore ?? '—'}</span></div>
        <div className="spec-row"><span className="spec-k">AIRSPACE</span><span className="spec-v" style={(prediction?.airspacePressure ?? 0) >= 40 ? { color: 'var(--warn)' } : undefined}>{prediction?.airspacePressure ?? '—'}</span></div>
        <div className="spec-row"><span className="spec-k">CONTAGION</span><span className="spec-v">{prediction?.cascadeRisk?.maxClusterSize ?? '—'}</span></div>
        <div className="spec-row"><span className="spec-k">REACTION</span><span className="spec-v">{prediction?.reactionWindow ? Math.round(prediction.reactionWindow.medianResponseHours) + 'h' : '—'}</span></div>
        <div className="spec-row"><span className="spec-k">P(CRITICAL)</span><span className="spec-v" style={(prediction?.global?.probCritical ?? 0) >= 20 ? { color: 'var(--warn)' } : undefined}>{prediction?.global?.probCritical != null ? Math.round(prediction.global.probCritical) + '%' : '—'}</span></div>
      </div>

      {/* Pipeline Status */}
      <div className="jp-panel sys-block" style={{ flex: '0 0 auto' }}>
        <div className="jp-panel-header sys-lbl">PIPELINE STATUS</div>
        <div className="sys-row"><span className="sys-k">INCIDENT FEED</span><div className={`sys-dot ${pipelineStatus.incidents ? 'on' : 'off'}`} /></div>
        <div className="sys-row"><span className="sys-k">PRICE DATA</span><div className={`sys-dot ${pipelineStatus.prices ? 'on' : 'off'}`} /></div>
        <div className="sys-row"><span className="sys-k">AIRSPACE DATA</span><div className={`sys-dot ${pipelineStatus.airspace ? 'on' : 'warn'}`} /></div>
        <div className="sys-row"><span className="sys-k">VERIFIED INTEL</span><div className={`sys-dot ${pipelineStatus.health.verified === 'live' ? 'on' : pipelineStatus.health.verified === 'stale' ? 'warn' : 'off'}`} /></div>
        <div className="sys-row"><span className="sys-k">PREDICTION</span><div className={`sys-dot ${prediction?.sufficient ? 'on' : 'warn'}`} /></div>
        <div className="sys-row"><span className="sys-k">MAP ENGINE</span><div className="sys-dot on" /></div>
      </div>
    </div>
  )
}
