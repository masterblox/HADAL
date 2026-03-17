import { postures, diplomaticSignals } from '@/data/postures'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface PosturingTabProps {
  sandbox: boolean
}

export function PosturingTab({ sandbox }: PosturingTabProps) {
  return (
    <div className="iwl-tabcontent active">
      <div className="iwl-section-h">GLOBAL POSTURING DASHBOARD</div>
      <p style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-small)',color:'var(--g3)',marginBottom:'14px'}}>Automated parsing of diplomatic and military statements.</p>
      <div className="posturing-grid">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="posture-left" defaultSize="50%" minSize="30%">
            <div style={{paddingRight:'7px'}}>
              <div style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-micro)',letterSpacing:'.18em',color:'var(--g3)',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid rgba(196,255,44,.1)'}}>ESCALATION POSTURES</div>
              {postures.map(p => (
                <div key={p.e} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid rgba(196,255,44,.04)'}}>
                  <span style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-small)',letterSpacing:'.08em',color:'var(--g5)'}}>{p.e} <span style={{color:'rgba(196,255,44,.3)',fontSize:'var(--fs-micro)'}}>({p.l})</span></span>
                  <span style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:p.col}}>{p.p}</span>
                </div>
              ))}
            </div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="posture-right" defaultSize="50%" minSize="30%">
            <div style={{paddingLeft:'7px'}}>
              <div style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-micro)',letterSpacing:'.18em',color:'var(--g3)',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid rgba(196,255,44,.1)'}}>DIPLOMATIC SIGNALS</div>
              {diplomaticSignals.map(d => (
                <div key={d.actor} style={{padding:'5px 0',borderBottom:'1px solid rgba(196,255,44,.04)'}}>
                  <div style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-small)',color:'var(--g5)'}}>{d.actor}</div>
                  <div style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:'var(--g3)',marginTop:'2px'}}>{d.action}</div>
                  <div style={{fontFamily:'var(--HEAD)',fontSize:'var(--fs-micro)',color:d.status==='ACTIVE'?'var(--g)':'rgba(196,255,44,.4)',marginTop:'1px',letterSpacing:'.1em'}}>{d.status}</div>
                </div>
              ))}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
