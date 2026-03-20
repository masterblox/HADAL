import { useMemo } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'

interface CasualtiesTabProps {
  sandbox: boolean
  incidents: Incident[]
}

const SCENARIO_PARTICIPANTS = [
  {entity:'IRAN (IRGC)',alliance:'AXIS',troops:'190,000',aircraft:'340',armor:'1,650',milCas:'580+ (EST)',civCas:'1,100+',status:'OFFENSIVE',statusCol:'var(--warn)'},
  {entity:'USA (CENTCOM)',alliance:'COALITION',troops:'45,000',aircraft:'280',armor:'420',milCas:'24 (KIA)',civCas:'0',status:'ACTIVE OPS',statusCol:'var(--g5)'},
  {entity:'UAE',alliance:'COALITION',troops:'63,000',aircraft:'95',armor:'545',milCas:'41',civCas:'38',status:'UNDER ATTACK',statusCol:'var(--warn)'},
  {entity:'SAUDI ARABIA',alliance:'COALITION',troops:'227,000',aircraft:'348',armor:'1,142',milCas:'29',civCas:'12',status:'ELEVATED',statusCol:'rgba(255,140,0,.7)'},
  {entity:'ISRAEL (IDF)',alliance:'COALITION',troops:'170,000',aircraft:'339',armor:'1,700',milCas:'156',civCas:'94',status:'MULTI-FRONT',statusCol:'var(--warn)'},
  {entity:'HOUTHI (YEMEN)',alliance:'AXIS',troops:'200,000',aircraft:'12',armor:'80',milCas:'387',civCas:'—',status:'OFFENSIVE',statusCol:'var(--warn)'},
  {entity:'HEZBOLLAH',alliance:'AXIS',troops:'100,000',aircraft:'0',armor:'0',milCas:'612',civCas:'—',status:'DEGRADED',statusCol:'rgba(255,140,0,.9)'},
]

export function CasualtiesTab({ incidents }: CasualtiesTabProps) {
  const liveStats = useMemo(() => {
    let mil = 0, civ = 0, intercepts = 0
    let highCredCount = 0
    let verifiedCount = 0, likelyCount = 0
    const interceptRe = /\bintercept\b/i
    for (const inc of incidents) {
      mil += inc.casualties?.military ?? 0
      civ += inc.casualties?.civilian ?? 0
      if (interceptRe.test(inc.title || '')) intercepts++
      if ((inc.credibility ?? 0) >= 80) highCredCount++
      if (inc.verificationBadge === 'VERIFIED') verifiedCount++
      else if (inc.verificationBadge === 'LIKELY') likelyCount++
    }
    const confLevel = incidents.length === 0 ? 'NONE'
      : highCredCount / incidents.length >= 0.7 ? 'HIGH'
      : highCredCount / incidents.length >= 0.4 ? 'MODERATE'
      : 'LOW'
    return { mil, civ, intercepts, total: incidents.length, confLevel, verifiedCount, likelyCount }
  }, [incidents])

  const hasLive = incidents.length > 0

  return (
    <div className="iwl-tabcontent active">
      <h2 className="section-title" style={{ marginBottom: 14 }}>Participants &amp; Casualties</h2>
      <p style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-small)',color:'var(--g3)',marginBottom:'14px'}}>
        {hasLive
          ? `Pipeline: ${liveStats.total} incidents · ${liveStats.verifiedCount} verified · ${liveStats.likelyCount} likely · Confidence: ${liveStats.confLevel} · Casualties are unverified OSINT estimates.`
          : 'No live pipeline data. Table below is scenario reference data — not live intelligence.'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, marginBottom: 14 }}>
        <div className="iwl-stat-box">
          <div className="iwl-sb-v" style={{color:'rgba(255,140,0,.9)'}}>{hasLive ? liveStats.mil.toLocaleString() : '—'}</div>
          <div className="iwl-sb-l">MILITARY KIA</div>
        </div>
        <div className="iwl-stat-box">
          <div className="iwl-sb-v" style={{color:'var(--warn)'}}>{hasLive ? liveStats.civ.toLocaleString() : '—'}</div>
          <div className="iwl-sb-l">CIVILIAN KIA</div>
        </div>
        <div className="iwl-stat-box">
          <div className="iwl-sb-v" style={{color:'var(--g)'}}>{hasLive ? liveStats.intercepts : '—'}</div>
          <div className="iwl-sb-l">INTERCEPT EVENTS</div>
        </div>
        <div className="iwl-stat-box">
          <div className="iwl-sb-v" style={{color:'var(--g5)'}}>{hasLive ? `${liveStats.total}` : '—'}</div>
          <div className="iwl-sb-l">TRACKED EVENTS</div>
        </div>
      </div>
      <div style={{fontFamily:'var(--MONO)',fontWeight:400,fontSize:'var(--fs-micro)',letterSpacing:'.02em',color:'var(--g3)',margin:'14px 0 6px'}}>
        SCENARIO REFERENCE TABLE
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
