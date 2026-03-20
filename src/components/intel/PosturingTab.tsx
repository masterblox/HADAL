import { postures, diplomaticSignals } from '@/data/postures'

export function PosturingTab() {
  return (
    <div className="iwl-tabcontent active">
      <h2 className="section-title" style={{ marginBottom: 14 }}>Global Posturing Dashboard</h2>
      <p style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-small)',color:'var(--g3)',marginBottom:'14px'}}>
        Analyst-curated scenario assessment. Postures and signals are editorial judgements based on OSINT reporting, not live telemetry.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <div style={{fontFamily:'var(--MONO)',fontWeight:400,fontSize:'var(--fs-micro)',letterSpacing:'.02em',color:'var(--g3)',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid var(--g15)'}}>
            ESCALATION POSTURES
          </div>
          {postures.map(p => (
            <div key={p.e} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'1px solid var(--g07)'}}>
              <span style={{fontFamily:'var(--MONO)',fontWeight:400,fontSize:'var(--fs-small)',letterSpacing:'.04em',color:'var(--g5)'}}>{p.e} <span style={{color:'var(--g3)',fontSize:'var(--fs-micro)'}}>({p.l})</span></span>
              <span style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:p.col}}>{p.p}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontFamily:'var(--MONO)',fontWeight:400,fontSize:'var(--fs-micro)',letterSpacing:'.02em',color:'var(--g3)',marginBottom:'8px',paddingBottom:'6px',borderBottom:'1px solid var(--g15)'}}>
            DIPLOMATIC SIGNALS
          </div>
          {diplomaticSignals.map(d => (
            <div key={d.actor} style={{padding:'5px 0',borderBottom:'1px solid var(--g07)'}}>
              <div style={{fontFamily:'var(--MONO)',fontWeight:400,fontSize:'var(--fs-small)',color:'var(--g5)'}}>{d.actor}</div>
              <div style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:'var(--g3)',marginTop:'2px'}}>{d.action}</div>
              <div style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:d.status==='ACTIVE'?'var(--g)':'var(--g3)',marginTop:'1px',letterSpacing:'.02em'}}>{d.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
