import { useMemo } from 'react'
import { useSonar } from '@/canvas/useSonar'
import { useTracking } from '@/hooks/useTracking'
import type { Incident } from '@/hooks/useDataPipeline'

interface RightRailProps {
  sandbox: boolean
  incidents: Incident[]
}

const GCC_COUNTRIES = ['uae', 'kuwait', 'qatar', 'bahrain', 'saudi arabia', 'oman'] as const
const GCC_LABELS: Record<string, string> = { uae: 'UAE', kuwait: 'KUWAIT', qatar: 'QATAR', bahrain: 'BAHRAIN', 'saudi arabia': 'KSA', oman: 'OMAN' }

function matchesWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, 'i').test(text)
}

function classifyKinetic(title: string): { ballistic: number; drone: number } {
  const t = (title || '').toLowerCase()
  const ballistic = matchesWord(t, 'missile') || matchesWord(t, 'ballistic') || matchesWord(t, 'cruise') ? 1 : 0
  const drone = matchesWord(t, 'drone') || matchesWord(t, 'uav') ? 1 : 0
  return { ballistic, drone }
}

function deriveGccIntercepts(incidents: Incident[]) {
  const stats: Record<string, { total: number; ballistic: number; drone: number }> = {}
  for (const c of GCC_COUNTRIES) stats[c] = { total: 0, ballistic: 0, drone: 0 }

  for (const inc of incidents) {
    const country = (inc.location?.country || '').toLowerCase()
    const matched = stats[country]
    if (!matched) continue
    const k = classifyKinetic(inc.title || '')
    matched.ballistic += k.ballistic
    matched.drone += k.drone
    matched.total++
  }

  const maxTotal = Math.max(1, ...Object.values(stats).map(s => s.total))

  return GCC_COUNTRIES
    .map(c => {
      const s = stats[c]
      const label = GCC_LABELS[c]
      const detail = s.total === 0 ? 'NO EVENTS'
        : `${s.ballistic > 0 ? 'BALLISTIC ' + s.ballistic : ''}${s.ballistic > 0 && s.drone > 0 ? ' + ' : ''}${s.drone > 0 ? 'DRONES ' + s.drone : ''}`.trim() || `${s.total} EVENTS`
      return { f: label, n: String(s.total), p: s.total / maxTotal, t: detail }
    })
    .filter(r => r.n !== '0' || GCC_COUNTRIES.indexOf(r.f.toLowerCase() as typeof GCC_COUNTRIES[number]) < 4) // Always show top 4
}

export function RightRail({ sandbox: _sandbox, incidents }: RightRailProps) {
  const { objects, counts, status, totalTracked } = useTracking()
  const sonarRef = useSonar(objects)
  const gccRows = useMemo(() => deriveGccIntercepts(incidents), [incidents])

  return (
    <div className="rc" style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%', overflow: 'hidden' }}>
      {/* Sonar / Tracking */}
      <div className="jp-panel rc-block" style={{ flex: '1 1 40%' }}>
        <div className="jp-panel-header rc-lbl">
          <div className={`HDR-DOT jp-status-dot ${status === 'ONLINE' ? 'active' : 'error'}`} style={{ background: status === 'ONLINE' ? 'var(--g)' : 'var(--warn)' }} />
          TRACKING RADAR
        </div>
        <div className="sonar-wrap">
          <canvas ref={sonarRef} width={140} height={140} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--MONO)', fontSize: 'var(--fs-micro)', color: 'var(--g3)', marginTop: '4px', padding: '0 2px' }}>
          <span style={{ color: 'rgb(0,212,255)' }}>✈ {counts.aircraft}</span>
          <span style={{ color: 'rgb(255,215,0)' }}>◉ {counts.satellite}</span>
          <span style={{ color: 'rgb(255,140,0)' }}>⚓ {counts.maritime}</span>
          <span>{totalTracked}</span>
        </div>
      </div>

      {/* GCC Intercepts — derived from pipeline */}
      <div className="jp-panel rc-block" style={{ flex: '1 1 60%' }}>
        <div className="jp-panel-header rc-lbl">GCC INTERCEPTS</div>
        {gccRows.length > 0 ? (
          <div className="gcc-row jp-breakdown">
            {gccRows.map(r => (
              <div key={r.f} className="GCC-ROW jp-brow">
                <span className="GCF">{r.f}</span>
                <span className="GCN">{r.n}</span>
                <div className="GC-BC">
                  <div className="BAR-S jp-bbar"><div className="BAR-SF jp-bfill" style={{ width: `${r.p * 100}%` }} /></div>
                  <div className="GC-TP">{r.t}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--MONO)', fontSize: 'var(--fs-micro)', color: 'var(--g3)', padding: '12px 4px', textAlign: 'center' }}>
            NO GCC EVENTS IN PIPELINE
          </div>
        )}
      </div>
    </div>
  )
}
