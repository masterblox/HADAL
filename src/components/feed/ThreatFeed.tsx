import { useState, useMemo } from 'react'
import { feedData, type FeedItem } from '@/data/feed-data'
import type { Incident } from '@/hooks/useDataPipeline'
import { DevTag } from '@/components/shared/DevTag'

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
  const [expanded, setExpanded] = useState(false)

  const allData = useMemo(() => {
    const now = Date.now()
    const FRESH_MS = 24 * 60 * 60 * 1000 // 24h
    const live: FeedItem[] = incidents.slice(0, 30).map((inc, i) => {
      const sev = (inc.credibility ?? 0) >= 90 ? 'CRITICAL' : (inc.credibility ?? 0) >= 80 ? 'HIGH' : 'MEDIUM'
      const region = mapCountryToRegion(inc.location?.country ?? '')
      const pubTime = inc.published ? new Date(inc.published).getTime() : 0
      const isFresh = pubTime > 0 && (now - pubTime) < FRESH_MS
      const badge = inc.verificationBadge
      const badgeLabel = badge === 'VERIFIED' ? '✓' : badge === 'LIKELY' ? '~' : ''
      return {
        id: 'TH-' + String(1000 + i).padStart(4, '0'),
        region,
        type: (badgeLabel ? badgeLabel + ' ' : '') + (inc.title ?? 'UNKNOWN'),
        sev: sev as FeedItem['sev'],
        src: inc.source ? inc.source.split(' ')[0].toUpperCase().slice(0, 6) : 'OSINT',
        conf: inc.credibility ?? 50,
        tags: [region],
        live: isFresh,
      }
    })
    return [...feedData, ...live]
  }, [incidents])

  const filtered = filt === 'ALL' ? allData : allData.filter(r => r.tags.includes(filt))

  return (
    <div className="jp-panel" style={{ position: 'relative' }}>
      <div className="TABS">
        {regions.map(r => (
          <div key={r} className={`TAB${filt === r ? ' on' : ''}`} onClick={() => setFilt(r)}>{r}</div>
        ))}
        <div className="TAB-R" />
        <div className="feed-meta">
          {filtered.length} ACTIVE{incidents.length > 0 ? ' · LIVE' : ''}
        </div>
      </div>
      <div className="feed-command-strip">
        <span className="feed-command-label">PRIORITY QUEUE</span>
        <span className="feed-command-copy">Verification overlays merged with live ingest. Region filter constrains the queue without truncating telemetry.</span>
      </div>
      <div className="THEAD">
        <span style={{ width: '72px', flexShrink: 0 }}>ID</span>
        <span style={{ width: '62px', flexShrink: 0 }}>REGION</span>
        <span style={{ flex: 1 }}>TYPE</span>
        <span style={{ width: '80px', flexShrink: 0 }}>SEVERITY</span>
        <span style={{ width: '36px', flexShrink: 0 }}>SRC</span>
        <span style={{ width: '46px', textAlign: 'right' }}>CONF</span>
      </div>
      <div className={`feed-scroll${expanded ? ' feed-expanded' : ''}`}>
        {filtered.slice(0, expanded ? filtered.length : 6).map(r => (
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
      {filtered.length > 6 && (
        <div className="feed-toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'COLLAPSE ▲' : `EXPAND FEED ▼ (${filtered.length - 6} MORE)`}
        </div>
      )}
      <DevTag id="Z" />
    </div>
  )
}
