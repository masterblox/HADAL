import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { PredictionResult } from '@/lib/prediction/types'

interface LeftRailProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean }
  prediction: PredictionResult | null
}

export function LeftRail({ sandbox, threatLevel, pipelineStatus, prediction }: LeftRailProps) {
  const noiseRef = useNoiseCanvas({ grayscale: true, interval: 95 })
  const tl = threatLevel ?? 0
  const severity = tl >= 80 ? 'CRITICAL' : tl >= 60 ? 'HIGH' : tl >= 40 ? 'MEDIUM' : tl > 0 ? 'LOW' : '—'
  const trend = prediction?.categories ? Object.values(prediction.categories).some(c => c.trend === 'escalating') ? 'ESCALATING' : 'STABLE' : '—'

  return (
    <div className="lc">
      <canvas ref={noiseRef} className="NOISE" />
      <ResizablePanelGroup orientation="vertical" className="lc-panels">
        <ResizablePanel id="lc-brand" defaultSize="15%">
          <div className="brand-plate">
            <div className="bp-name">HADAL INTELLIGENCE</div>
            <div className="bp-tagline">Intelligence lives in the dark.</div>
            <div className="bp-ver">v2.0.0 · MASTERBLOX CAPITAL · GULF THEATRE</div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="lc-threat" defaultSize="22%">
          <div className="jp-panel ti-block">
            <div className="jp-panel-header ti-lbl">&#9670; THREAT INDEX</div>
            <div className="ti-big">{threatLevel ?? '—'}</div>
            <div className="ti-sub">{severity} · {trend}</div>
            <div className="ti-bar"><div className="ti-bar-fill" style={{width: `${tl}%`}} /></div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="lc-spec" defaultSize="40%">
          <div className="jp-panel spec-block">
            <div className="jp-panel-header spec-lbl">PREDICTION PROFILE</div>
            <div className="spec-row"><span className="spec-k">SEVERITY</span><span className="spec-v" style={tl >= 60 ? {color:'var(--warn)'} : undefined}>{prediction?.global?.mean ? Math.round(prediction.global.mean) : '—'}</span></div>
            <div className="spec-row"><span className="spec-k">P(SEVERE)</span><span className="spec-v" style={(prediction?.global?.probSevere ?? 0) >= 40 ? {color:'var(--warn)'} : undefined}>{prediction?.global?.probSevere != null ? Math.round(prediction.global.probSevere) + '%' : '—'}</span></div>
            <div className="spec-row"><span className="spec-k">CASCADE</span><span className="spec-v" style={(prediction?.cascadeRisk?.contagionScore ?? 0) >= 50 ? {color:'var(--warn)'} : undefined}>{prediction?.cascadeRisk?.contagionScore ?? '—'}</span></div>
            <div className="spec-row"><span className="spec-k">AIRSPACE</span><span className="spec-v" style={(prediction?.airspacePressure ?? 0) >= 40 ? {color:'var(--warn)'} : undefined}>{prediction?.airspacePressure ?? '—'}</span></div>
            <div className="spec-row"><span className="spec-k">CONTAGION</span><span className="spec-v">{prediction?.cascadeRisk?.maxClusterSize ?? '—'}</span></div>
            <div className="spec-row"><span className="spec-k">REACTION</span><span className="spec-v">{prediction?.reactionWindow ? Math.round(prediction.reactionWindow.medianResponseHours) + 'h' : '—'}</span></div>
            <div className="spec-row"><span className="spec-k">P(CRITICAL)</span><span className="spec-v" style={(prediction?.global?.probCritical ?? 0) >= 20 ? {color:'var(--warn)'} : undefined}>{prediction?.global?.probCritical != null ? Math.round(prediction.global.probCritical) + '%' : '—'}</span></div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="lc-sys" defaultSize="23%">
          <div className="jp-panel sys-block">
            <div className="jp-panel-header sys-lbl">PIPELINE STATUS</div>
            <div className="sys-row jp-status-row"><span className="sys-k jp-status-text">INCIDENT FEED</span><div className={`sys-dot jp-status-dot ${pipelineStatus.incidents ? 'on active' : 'off error'}`} /></div>
            <div className="sys-row jp-status-row"><span className="sys-k jp-status-text">PRICE DATA</span><div className={`sys-dot jp-status-dot ${pipelineStatus.prices ? 'on active' : 'off error'}`} /></div>
            <div className="sys-row jp-status-row"><span className="sys-k jp-status-text">AIRSPACE DATA</span><div className={`sys-dot jp-status-dot ${pipelineStatus.airspace ? 'on active' : 'warn error'}`} /></div>
            <div className="sys-row jp-status-row"><span className="sys-k jp-status-text">PREDICTION</span><div className={`sys-dot jp-status-dot ${prediction?.sufficient ? 'on active' : 'warn error'}`} /></div>
            <div className="sys-row jp-status-row"><span className="sys-k jp-status-text">MAP ENGINE</span><div className="sys-dot on jp-status-dot active" /></div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
