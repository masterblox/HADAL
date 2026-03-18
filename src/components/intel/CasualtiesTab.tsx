import { useMemo } from 'react'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { Incident } from '@/hooks/useDataPipeline'

interface CasualtiesTabProps {
  sandbox: boolean
  incidents: Incident[]
}

/** Scenario reference data — hardcoded analyst estimates, NOT live intelligence */
const SCENARIO_PARTICIPANTS = [
  {entity:'IRAN (IRGC)',alliance:'AXIS',troops:'190,000',aircraft:'340',armor:'1,650',milCas:'580+ (EST)',civCas:'1,100+',status:'OFFENSIVE',statusCol:'var(--warn)'},
  {entity:'USA (CENTCOM)',alliance:'COALITION',troops:'45,000',aircraft:'280',armor:'420',milCas:'24 (KIA)',civCas:'0',status:'ACTIVE OPS',statusCol:'var(--g5)'},
  {entity:'UAE',alliance:'COALITION',troops:'63,000',aircraft:'95',armor:'545',milCas:'41',civCas:'38',status:'UNDER ATTACK',statusCol:'var(--warn)'},
  {entity:'SAUDI ARABIA',alliance:'COALITION',troops:'227,000',aircraft:'348',armor:'1,142',milCas:'29',civCas:'12',status:'ELEVATED',statusCol:'rgba(255,140,0,.7)'},
  {entity:'ISRAEL (IDF)',alliance:'COALITION',troops:'170,000',aircraft:'339',armor:'1,700',milCas:'156',civCas:'94',status:'MULTI-FRONT',statusCol:'var(--warn)'},
  {entity:'HOUTHI (YEMEN)',alliance:'AXIS',troops:'200,000',aircraft:'12',armor:'80',milCas:'387',civCas:'—',status:'OFFENSIVE',statusCol:'var(--warn)'},
  {entity:'HEZBOLLAH',alliance:'AXIS',troops:'100,000',aircraft:'0',armor:'0',milCas:'612',civCas:'—',status:'DEGRADED',statusCol:'rgba(255,140,0,.9)'},
]

export function CasualtiesTab({ sandbox, incidents }: CasualtiesTabProps) {
  // Derive what we can from live pipeline
  const liveStats = useMemo(() => {
    let mil = 0, civ = 0, intercepts = 0
    for (const inc of incidents) {
      mil += inc.casualties?.military ?? 0
      civ += inc.casualties?.civilian ?? 0
      if ((inc.title || '').toLowerCase().includes('intercept')) intercepts++
    }
    return { mil, civ, intercepts, total: incidents.length }
  }, [incidents])

  const hasLive = incidents.length > 0

  return (
    <div className="iwl-tabcontent active">
      <div className="iwl-section-h">PARTICIPANTS &amp; CASUALTIES</div>
      <p style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-small)',color:'var(--g3)',marginBottom:'14px'}}>
        {hasLive
          ? `Live pipeline: ${liveStats.total} incidents tracked. Table below is scenario reference data.`
          : 'No live pipeline data. Table below is scenario reference data — not live intelligence.'}
      </p>
      <div className="iwl-stat-grid">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="cas-1" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box">
              <div className="iwl-sb-v" style={{color:'rgba(255,140,0,.9)'}}>{hasLive ? liveStats.mil.toLocaleString() : '—'}</div>
              <div className="iwl-sb-l">MILITARY KIA {hasLive ? <span className="prov-badge">PIPELINE</span> : <span className="prov-badge">NO DATA</span>}</div>
            </div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="cas-2" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box">
              <div className="iwl-sb-v" style={{color:'var(--warn)'}}>{hasLive ? liveStats.civ.toLocaleString() : '—'}</div>
              <div className="iwl-sb-l">CIVILIAN KIA {hasLive ? <span className="prov-badge">PIPELINE</span> : <span className="prov-badge">NO DATA</span>}</div>
            </div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="cas-3" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box">
              <div className="iwl-sb-v" style={{color:'var(--g)'}}>{hasLive ? liveStats.intercepts : '—'}</div>
              <div className="iwl-sb-l">INTERCEPT EVENTS {hasLive ? <span className="prov-badge">PIPELINE</span> : <span className="prov-badge">NO DATA</span>}</div>
            </div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="cas-4" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box">
              <div className="iwl-sb-v" style={{color:'var(--g5)'}}>{hasLive ? `${liveStats.total} EVENTS` : '—'}</div>
              <div className="iwl-sb-l">TRACKED {hasLive ? <span className="prov-badge">LIVE</span> : <span className="prov-badge">OFFLINE</span>}</div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-micro)',letterSpacing:'.18em',color:'var(--g3)',margin:'14px 0 6px',display:'flex',alignItems:'center',gap:'8px'}}>
        SCENARIO REFERENCE TABLE <span className="prov-badge">STATIC</span>
      </div>
      <table className="iwl-table">
        <thead><tr><th>ENTITY</th><th>ALLIANCE</th><th>EST. TROOPS</th><th>EST. AIRCRAFT</th><th>ARMOR</th><th>MIL CASUALTIES</th><th>CIV CASUALTIES</th><th>STATUS</th></tr></thead>
        <tbody>
          {SCENARIO_PARTICIPANTS.map(p => (
            <tr key={p.entity}>
              <td>{p.entity}</td>
              <td>{p.alliance}</td>
              <td>{p.troops}</td>
              <td>{p.aircraft}</td>
              <td>{p.armor}</td>
              <td style={{color:'rgba(255,140,0,.8)'}}>{p.milCas}</td>
              <td style={{color:'var(--warn)'}}>{p.civCas}</td>
              <td style={{color:p.statusCol}}>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
