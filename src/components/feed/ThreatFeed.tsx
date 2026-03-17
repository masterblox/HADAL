import { useState, useMemo } from 'react'
import { feedData, type FeedItem } from '@/data/feed-data'
import type { Incident } from '@/hooks/useDataPipeline'

const regions = ['ALL', 'UAE', 'GULF', 'IRAN', 'RED SEA', 'ISRAEL']

function mapCountryToRegion(country: string): string {
  const map: Record<string, string> = {
    'UAE': 'UAE', 'United Arab Emirates': 'UAE', 'Iran': 'IRAN', 'Iraq': 'GULF', 'Kuwait': 'GULF',
    'Qatar': 'GULF', 'Bahrain': 'GULF', 'Saudi Arabia': 'GULF', 'Yemen': 'RED SEA', 'Israel': 'ISRAEL',
    'Jordan': 'GULF', 'Oman': 'GULF', 'Lebanon': 'ISRAEL', 'Syria': 'GULF', 'International': 'GULF',
  }
  return map[country] || 'GULF'
}

interface ThreatFeedProps {
  incidents: Incident[]
}

export function ThreatFeed({ incidents }: ThreatFeedProps) {
  const [filt, setFilt] = useState('ALL')

  const allData = useMemo(() => {
    const live: FeedItem[] = incidents.slice(0, 30).map((inc, i) => {
      const sev = (inc.credibility ?? 0) >= 90 ? 'CRITICAL' : (inc.credibility ?? 0) >= 80 ? 'HIGH' : 'MEDIUM'
      const region = mapCountryToRegion(inc.location?.country ?? '')
      return {
        id: 'TH-' + String(1000 + i).padStart(4, '0'),
        region,
        type: inc.title ?? 'UNKNOWN',
        sev: sev as FeedItem['sev'],
        src: inc.source ? inc.source.split(' ')[0].toUpperCase().slice(0, 6) : 'OSINT',
        conf: inc.credibility ?? 50,
        tags: [region],
        live: true,
      }
    })
    return [...feedData, ...live]
  }, [incidents])

  const filtered = filt === 'ALL' ? allData : allData.filter(r => r.tags.includes(filt))

  return (
    <div className="panel">
      <div className="TABS">
        {regions.map(r => (
          <div key={r} className={`TAB${filt === r ? ' on' : ''}`} onClick={() => setFilt(r)}>{r}</div>
        ))}
        <div className="TAB-R" />
        <div style={{padding:'0 14px',fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-small)',color:'var(--g3)',letterSpacing:'.1em',alignSelf:'center'}}>
          {filtered.length} ACTIVE{incidents.length > 0 ? ' · LIVE' : ''}
        </div>
        <div className="HDR-DOT" style={{marginRight:'14px',alignSelf:'center'}} />
      </div>
      <div className="THEAD">
        <span style={{width:'72px',flexShrink:0}}>ID</span>
        <span style={{width:'62px',flexShrink:0}}>REGION</span>
        <span style={{flex:1}}>TYPE</span>
        <span style={{width:'80px',flexShrink:0}}>SEVERITY</span>
        <span style={{width:'36px',flexShrink:0}}>SRC</span>
        <span style={{width:'46px',textAlign:'right'}}>CONF</span>
      </div>
      <div className="feed-scroll">
        {filtered.map(r => (
          <div key={r.id} className="feed-row">
            <span className="feed-id">{r.id}</span>
            <span className="feed-region">{r.region}</span>
            <span className="feed-type">{r.type}</span>
            <span className={`sev-chip sev-${r.sev}`}>{r.sev}</span>
            <span className="feed-src">{r.src}</span>
            <span className="feed-conf">{r.conf}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
