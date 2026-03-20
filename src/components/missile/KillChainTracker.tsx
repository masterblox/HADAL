import { useMemo } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'

type Weapon = 'ballistic' | 'drone' | 'cruise' | 'unknown'
type Outcome = 'INTERCEPT' | 'IMPACT' | 'UNCONFIRMED'

interface DerivedChain {
  id: string
  time: string
  weapon: Weapon
  outcome: Outcome
  conf: number
  source: string
}

function classifyWeapon(title: string): Weapon {
  const t = title.toLowerCase()
  if (t.includes('cruise')) return 'cruise'
  if (t.includes('drone') || t.includes('uav')) return 'drone'
  if (t.includes('missile') || t.includes('ballistic')) return 'ballistic'
  return 'unknown'
}

function classifyOutcome(title: string, status?: string): Outcome {
  const t = title.toLowerCase()
  if (t.includes('intercept') || t.includes('neutrali') || t.includes('shot down')) return 'INTERCEPT'
  if (t.includes('impact') || t.includes('hit') || t.includes('struck') || t.includes('damage')) return 'IMPACT'
  if (status === 'confirmed') return 'IMPACT'
  return 'UNCONFIRMED'
}

const OUTCOME_COL: Record<Outcome, string> = {
  INTERCEPT: 'var(--g)',
  IMPACT: 'var(--warn)',
  UNCONFIRMED: 'var(--g3)',
}

interface KillChainTrackerProps {
  incidents: Incident[]
}

export function KillChainTracker({ incidents }: KillChainTrackerProps) {
  const chains = useMemo(() => {
    // Filter to kinetic events only
    const kinetic = incidents.filter(i => {
      const t = (i.type || i.title || '').toLowerCase()
      return t.includes('missile') || t.includes('drone') || t.includes('uav') ||
             t.includes('ballistic') || t.includes('cruise') || t.includes('intercept') ||
             t.includes('airstrike')
    })

    return kinetic.slice(0, 12).map((inc, i): DerivedChain => {
      const published = inc.published ? new Date(inc.published) : null
      const timeStr = published
        ? `${String(published.getUTCHours()).padStart(2, '0')}:${String(published.getUTCMinutes()).padStart(2, '0')}Z`
        : '——:——Z'

      return {
        id: `KC-${String(i + 1).padStart(4, '0')}`,
        time: timeStr,
        weapon: classifyWeapon(inc.title || ''),
        outcome: classifyOutcome(inc.title || '', inc.status),
        conf: inc.credibility ?? 0,
        source: inc.source ? inc.source.split(' ')[0].toUpperCase().slice(0, 8) : 'OSINT',
      }
    })
  }, [incidents])

  const intercepts = chains.filter(c => c.outcome === 'INTERCEPT').length
  const impacts = chains.filter(c => c.outcome === 'IMPACT').length
  const unconfirmed = chains.filter(c => c.outcome === 'UNCONFIRMED').length

  if (chains.length === 0) {
    return (
      <div style={{ marginTop: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 12 }}>Kill Chain Tracker</h2>
        <p style={{ fontFamily: 'var(--MONO)', fontSize: 'var(--fs-small)', color: 'var(--g3)' }}>
          NO KINETIC EVENTS IN PIPELINE — AWAITING DATA
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 16 }}>
      <h2 className="section-title" style={{ marginBottom: 12 }}>
        Kill Chain Tracker
        <span style={{ fontFamily: 'var(--MONO)', fontSize: 'var(--fs-micro)', color: 'var(--g3)', marginLeft: 8, fontWeight: 400 }}>
          DERIVED FROM PIPELINE · {chains.length} KINETIC
        </span>
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--MONO)', fontSize: 'var(--fs-small)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--g15)' }}>
            {['ID', 'Time', 'Type', 'Outcome', 'Conf', 'Source'].map(h => (
              <th key={h} style={{ fontFamily: 'var(--MONO)', fontWeight: 400, fontSize: 'var(--fs-micro)', letterSpacing: '.02em', color: 'var(--g3)', padding: '6px 10px', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chains.map(chain => (
            <tr key={chain.id} style={{ borderBottom: '1px solid var(--g07)' }}>
              <td style={{ padding: '6px 10px', color: 'var(--g5)' }}>{chain.id}</td>
              <td style={{ padding: '6px 10px', color: 'var(--g3)' }}>{chain.time}</td>
              <td style={{ padding: '6px 10px', color: 'var(--g7)', fontFamily: 'var(--MONO)', fontWeight: 400, textTransform: 'uppercase', fontSize: 'var(--fs-micro)' }}>{chain.weapon}</td>
              <td style={{ padding: '6px 10px', color: OUTCOME_COL[chain.outcome], fontFamily: 'var(--MONO)', fontWeight: 400, fontSize: 'var(--fs-micro)', letterSpacing: '.02em' }}>{chain.outcome}</td>
              <td style={{ padding: '6px 10px', color: chain.conf > 0 ? 'var(--g5)' : 'var(--g3)' }}>{chain.conf > 0 ? `${chain.conf}%` : '—'}</td>
              <td style={{ padding: '6px 10px', color: 'var(--g3)', fontSize: 'var(--fs-micro)' }}>{chain.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="jp-intel" style={{ marginTop: 8 }}>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">INTERCEPTED</div><div className="jp-intel-val" style={{ color: 'var(--g)' }}>{intercepts}</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">IMPACT</div><div className="jp-intel-val" style={{ color: 'var(--warn)' }}>{impacts}</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">UNCONFIRMED</div><div className="jp-intel-val" style={{ color: 'var(--g3)' }}>{unconfirmed}</div></div>
      </div>
    </div>
  )
}
