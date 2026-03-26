import type { Incident } from '@/hooks/useDataPipeline'
import { DevTag } from '@/components/shared/DevTag'

interface Props { incidents: Incident[] }

function fmtTime(pub: string | undefined): string {
  if (!pub) return '---'
  try {
    return new Date(pub).toISOString().slice(11, 16) + 'Z'
  } catch {
    return '---'
  }
}

function typeCode(type: string | undefined): string {
  switch ((type || '').toLowerCase()) {
    case 'missile':   return 'MSL'
    case 'drone':     return 'UAS'
    case 'airstrike': return 'AIR'
    case 'attack':    return 'ATK'
    case 'intercept': return 'ICT'
    case 'naval':     return 'NAV'
    case 'ground':    return 'GND'
    case 'security':  return 'SEC'
    default:          return 'EVT'
  }
}

function badgeCode(inc: Incident): string {
  const b = (inc as { verificationBadge?: string }).verificationBadge
  if (b === 'VERIFIED')   return 'vfd'
  if (b === 'LIKELY')     return 'lky'
  if (b === 'PARTIAL')    return 'ptl'
  return 'unc'
}

const KINETIC = ['missile', 'drone', 'airstrike', 'attack']

export function ThreatFeedTile({ incidents }: Props) {
  const sorted = [...incidents]
    .sort((a, b) => {
      const ta = a.published ? new Date(a.published).getTime() : 0
      const tb = b.published ? new Date(b.published).getTime() : 0
      return tb - ta
    })
    .slice(0, 60)

  const total       = incidents.length
  const verifiedCt  = incidents.filter(i => (i as { verificationBadge?: string }).verificationBadge === 'VERIFIED').length
  const likelyCt    = incidents.filter(i => (i as { verificationBadge?: string }).verificationBadge === 'LIKELY').length
  const kineticCt   = incidents.filter(i => KINETIC.some(k => (i.type || '').toLowerCase().includes(k))).length
  const uniqueSrcs  = new Set(incidents.map(i => i.source).filter(Boolean)).size

  if (sorted.length === 0) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: '#030500' }}>
        <div className="feed-tile-empty">NO FEED DATA</div>
        <DevTag id="A.6" />
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#030500' }}>
      <div className="feed-status-bar">
        <span className="fsb-item"><b>{total}</b> EVENTS</span>
        <span className="fsb-item"><b>{verifiedCt}</b> VERIFIED</span>
        <span className="fsb-item"><b>{likelyCt}</b> LIKELY</span>
        <span className={`fsb-item${kineticCt > 0 ? ' warn' : ''}`}><b>{kineticCt}</b> KINETIC</span>
        <span className="fsb-item fsb-spacer"><b>{uniqueSrcs}</b> SOURCES</span>
      </div>
      <div className="feed-tile-head">
        <span className="feed-tile-head-label">TIME</span>
        <span className="feed-tile-head-label">TYPE</span>
        <span className="feed-tile-head-label">EVENT</span>
        <span className="feed-tile-head-label">SOURCE</span>
        <span className="feed-tile-head-label">VFY</span>
      </div>
      <div className="feed-tile-rows">
        {sorted.map((inc, i) => {
          const typeRaw = (inc.type || '').toLowerCase()
          const isKinetic = KINETIC.some(k => typeRaw.includes(k))
          const badge = badgeCode(inc)
          const isVerified = badge === 'vfd'
          const id = (inc as { id?: number }).id ?? i
          return (
            <div key={id} className={`feed-tile-row${isKinetic ? ' kinetic' : isVerified ? ' verified-row' : ''}`}>
              <span className="feed-row-time">{fmtTime(inc.published)}</span>
              <span className={`feed-row-type type-${typeRaw}`}>{typeCode(inc.type)}</span>
              <span className="feed-row-title" title={inc.title ?? ''}>
                {inc.title ? inc.title.slice(0, 64) : '—'}
              </span>
              <span className="feed-row-src">{(inc.source ?? '---').slice(0, 14)}</span>
              <span className={`feed-row-cred badge-${badge}`}>{badge.toUpperCase()}</span>
            </div>
          )
        })}
      </div>
      <DevTag id="A.6" />
    </div>
  )
}
