import { useMemo } from 'react'
import { KillChainTracker } from './KillChainTracker'
import type { Incident } from '@/hooks/useDataPipeline'

interface CountryStats {
  missile: number; drone: number; cruise: number; total: number
}

function matchesWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, 'i').test(text)
}

function classifyType(title: string): 'missile' | 'drone' | 'cruise' | 'other' {
  const t = (title || '').toLowerCase()
  if (matchesWord(t, 'cruise')) return 'cruise'
  if (matchesWord(t, 'drone') || matchesWord(t, 'uav')) return 'drone'
  if (matchesWord(t, 'missile') || matchesWord(t, 'ballistic') || matchesWord(t, 'intercept')) return 'missile'
  return 'other'
}

function deriveKineticStats(incidents: Incident[]) {
  const countries: Record<string, CountryStats> = {
    uae: { missile: 0, drone: 0, cruise: 0, total: 0 },
    kuwait: { missile: 0, drone: 0, cruise: 0, total: 0 },
    qatar: { missile: 0, drone: 0, cruise: 0, total: 0 },
    bahrain: { missile: 0, drone: 0, cruise: 0, total: 0 },
  }

  for (const inc of incidents) {
    const country = (inc.location?.country || '').toLowerCase()
    const matched = countries[country]
    if (!matched) continue
    const wt = classifyType(inc.title || '')
    if (wt === 'missile') matched.missile++
    else if (wt === 'drone') matched.drone++
    else if (wt === 'cruise') matched.cruise++
    matched.total++
  }

  return countries
}

interface MissileDefenseStripProps {
  sandbox: boolean
  incidents: Incident[]
}

const STATUS_DOT = { ACTIVE: 'var(--warn)', NOMINAL: 'var(--g)', CLEAR: 'var(--g3)' }

export function MissileDefenseStrip({ incidents }: MissileDefenseStripProps) {
  const stats = useMemo(() => deriveKineticStats(incidents), [incidents])

  const totalMissile = Object.values(stats).reduce((s, c) => s + c.missile, 0)
  const totalDrone = Object.values(stats).reduce((s, c) => s + c.drone, 0)
  const totalCruise = Object.values(stats).reduce((s, c) => s + c.cruise, 0)
  const totalAll = totalMissile + totalDrone + totalCruise

  const rows = [
    { name: 'UAE', ...stats.uae },
    { name: 'Kuwait', ...stats.kuwait },
    { name: 'Qatar', ...stats.qatar },
    { name: 'Bahrain', ...stats.bahrain },
  ]

  function statusLabel(total: number) {
    if (total >= 5) return { label: 'ACTIVE', color: STATUS_DOT.ACTIVE }
    if (total > 0) return { label: 'NOMINAL', color: STATUS_DOT.NOMINAL }
    return { label: 'CLEAR', color: STATUS_DOT.CLEAR }
  }

  return (
    <div className="missile-section">
      <h2 className="section-title" style={{ marginBottom: 12 }}>Theatre Kinetic Data</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--MONO)', fontSize: 'var(--fs-small)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--g15)' }}>
            {['Country', 'Ballistic', 'Cruise', 'Drone', 'Total', 'Status'].map(h => (
              <th key={h} style={{ fontFamily: 'var(--MONO)', fontWeight: 400, fontSize: 'var(--fs-micro)', letterSpacing: '.02em', color: 'var(--g3)', padding: '6px 10px', textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const st = statusLabel(r.total)
            return (
              <tr key={r.name} style={{ borderBottom: '1px solid var(--g07)' }}>
                <td style={{ padding: '6px 10px', color: 'var(--g7)', fontFamily: 'var(--MONO)', fontWeight: 400 }}>{r.name}</td>
                <td style={{ padding: '6px 10px', color: 'var(--g5)' }}>{r.missile}</td>
                <td style={{ padding: '6px 10px', color: 'var(--g5)' }}>{r.cruise}</td>
                <td style={{ padding: '6px 10px', color: 'var(--g5)' }}>{r.drone}</td>
                <td style={{ padding: '6px 10px', color: 'var(--g)', fontWeight: 400 }}>{r.total}</td>
                <td style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                  <span style={{ color: st.color, fontFamily: 'var(--MONO)', fontWeight: 400, fontSize: 'var(--fs-micro)', letterSpacing: '.02em' }}>{st.label}</span>
                </td>
              </tr>
            )
          })}
          <tr style={{ borderTop: '2px solid var(--g15)' }}>
            <td style={{ padding: '6px 10px', color: 'var(--g)', fontFamily: 'var(--MONO)', fontWeight: 400 }}>Total</td>
            <td style={{ padding: '6px 10px', color: 'var(--g)' }}>{totalMissile}</td>
            <td style={{ padding: '6px 10px', color: 'var(--g)' }}>{totalCruise}</td>
            <td style={{ padding: '6px 10px', color: 'var(--g)' }}>{totalDrone}</td>
            <td style={{ padding: '6px 10px', color: 'var(--g)', fontWeight: 400 }}>{totalAll}</td>
            <td />
          </tr>
        </tbody>
      </table>
      <KillChainTracker incidents={incidents} />
    </div>
  )
}
