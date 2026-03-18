import { postures, diplomaticSignals } from '@/data/postures'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface PosturingTabProps {
  sandbox: boolean
}

export function PosturingTab({ sandbox }: PosturingTabProps) {
  return (
    <div className="iwl-tabcontent active">
      <div className="iwl-section-h">GLOBAL POSTURING DASHBOARD</div>
      <p className="iwl-section-intro">
        Analyst-curated scenario assessment. Postures and signals are editorial judgements based on OSINT reporting, not live telemetry.
      </p>
      <div className="posturing-grid">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="posture-left" defaultSize="50%" minSize="30%">
            <div style={{paddingRight:'7px'}}>
              <div className="iwl-sub-h">
                ESCALATION POSTURES <span className="prov-badge">SCENARIO</span>
              </div>
              {postures.map(p => (
                <div key={p.e} className="iwl-data-row">
                  <span className="iwl-data-row-label">{p.e} <small>({p.l})</small></span>
                  <span className="iwl-data-row-val" style={{color:p.col}}>{p.p}</span>
                </div>
              ))}
            </div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="posture-right" defaultSize="50%" minSize="30%">
            <div style={{paddingLeft:'7px'}}>
              <div className="iwl-sub-h">
                DIPLOMATIC SIGNALS <span className="prov-badge">SCENARIO</span>
              </div>
              {diplomaticSignals.map(d => (
                <div key={d.actor} className="iwl-data-entry">
                  <div className="iwl-data-entry-name">{d.actor}</div>
                  <div className="iwl-data-entry-desc">{d.action}</div>
                  <div className="iwl-data-entry-status" style={{color:d.status==='ACTIVE'?'var(--g)':'rgba(196,255,44,.4)'}}>{d.status}</div>
                </div>
              ))}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
