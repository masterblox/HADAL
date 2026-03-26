import { useMemo } from 'react'
import { KillChainTracker } from './KillChainTracker'
import type { Incident } from '@/hooks/useDataPipeline'
import { DevTag } from '@/components/shared/DevTag'

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
    <div className="missile-section" style={{ position: 'relative' }}>
      <div className="missile-section-head">
        <h2 className="section-title">Theatre Kinetic Data</h2>
        <div className="missile-headline">
          <span className="missile-headline-label">KINETIC LOAD</span>
          <span className="missile-headline-value">{totalAll}</span>
          <span className="missile-headline-meta">BALLISTIC {totalMissile} / CRUISE {totalCruise} / DRONE {totalDrone}</span>
        </div>
      </div>
      <table className="missile-table">
        <thead>
          <tr>
            {['Country', 'Ballistic', 'Cruise', 'Drone', 'Total', 'Status'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const st = statusLabel(r.total)
            return (
              <tr key={r.name}>
                <td className="missile-country">{r.name}</td>
                <td>{r.missile}</td>
                <td>{r.cruise}</td>
                <td>{r.drone}</td>
                <td className="missile-total">{r.total}</td>
                <td className="missile-status">
                  <span className="missile-status-dot" style={{ background: st.color }} />
                  <span style={{ color: st.color }}>{st.label}</span>
                </td>
              </tr>
            )
          })}
          <tr className="missile-table-total">
            <td className="missile-country">Total</td>
            <td>{totalMissile}</td>
            <td>{totalCruise}</td>
            <td>{totalDrone}</td>
            <td className="missile-total">{totalAll}</td>
            <td />
          </tr>
        </tbody>
      </table>
      <KillChainTracker incidents={incidents} />
      <DevTag id="X" />
    </div>
  )
}
