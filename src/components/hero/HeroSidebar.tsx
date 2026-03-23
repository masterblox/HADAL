import { useMemo } from 'react'
import type { PipelineHealth, Incident } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'

interface HeroSidebarProps {
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  prediction: PredictionResult | null
  incidents: Incident[]
}

const GCC_COUNTRIES = ['uae', 'kuwait', 'qatar', 'bahrain', 'saudi arabia', 'oman'] as const
const GCC_LABELS: Record<string, string> = { uae: 'UAE', kuwait: 'KWT', qatar: 'QAT', bahrain: 'BHR', 'saudi arabia': 'KSA', oman: 'OMN' }

function deriveGccCounts(incidents: Incident[]) {
  const stats: Record<string, number> = {}
  for (const c of GCC_COUNTRIES) stats[c] = 0
  for (const inc of incidents) {
    const country = (inc.location?.country || '').toLowerCase()
    if (stats[country] !== undefined) stats[country]++
  }
  return GCC_COUNTRIES
    .map(c => ({ label: GCC_LABELS[c], count: stats[c] }))
    .filter(r => r.count > 0)
}

export function HeroSidebar({ threatLevel, pipelineStatus, prediction, incidents }: HeroSidebarProps) {
  const tl = threatLevel ?? 0
  const severity = tl >= 80 ? 'CRITICAL' : tl >= 60 ? 'HIGH' : tl >= 40 ? 'MEDIUM' : tl > 0 ? 'LOW' : '—'
  const gccRows = useMemo(() => deriveGccCounts(incidents), [incidents])
  const pipelineLive = [pipelineStatus.incidents, pipelineStatus.prices, pipelineStatus.airspace, pipelineStatus.health.verified === 'live'].filter(Boolean).length

  return (
    <div className="hero-summary">
      <div className="hero-summary-head">
        <div className="hero-summary-kicker">Overview Signal</div>
        <div className="hero-summary-value" style={{ color: tl >= 60 ? 'var(--warn)' : 'var(--g)' }}>
          {threatLevel ?? '—'}
        </div>
        <div className="hero-summary-meta">
          <span>{severity}</span>
          <span>{incidents.length} incidents</span>
          <span>{pipelineLive}/4 live</span>
        </div>
        <div className="hero-chip-bar"><div className="hero-chip-bar-fill" style={{ width: `${tl}%` }} /></div>
      </div>

      <div className="hero-summary-grid">
        <div className="hero-chip">
          <div className="hero-chip-label">Mean Severity</div>
          <div className="hero-chip-value">{prediction?.global?.mean ? Math.round(prediction.global.mean) : '—'}</div>
          <div className="hero-chip-meta">P(SEVERE) {prediction?.global?.probSevere != null ? `${Math.round(prediction.global.probSevere)}%` : '—'}</div>
        </div>

        <div className="hero-chip">
          <div className="hero-chip-label">Cascade</div>
          <div className="hero-chip-value">{prediction?.cascadeRisk?.contagionScore ?? '—'}</div>
          <div className="hero-chip-meta">Contagion {prediction?.cascadeRisk?.maxClusterSize ?? '—'}</div>
        </div>

        <div className="hero-chip">
          <div className="hero-chip-label">Airspace</div>
          <div className="hero-chip-value">{prediction?.airspacePressure ?? '—'}</div>
          <div className="hero-chip-meta">Pressure bands</div>
        </div>

        <div className="hero-chip">
          <div className="hero-chip-label">Reaction</div>
          <div className="hero-chip-value">{prediction?.reactionWindow ? `${Math.round(prediction.reactionWindow.medianResponseHours)}h` : '—'}</div>
          <div className="hero-chip-meta">Median response</div>
        </div>
      </div>

      <div className="hero-summary-strip">
        <div className="hero-strip-block">
          <div className="hero-strip-label">Pipeline</div>
          <div className="hero-pipe-row">
            <span className="hero-pipe-item"><span className={`hero-dot ${pipelineStatus.incidents ? 'on' : 'off'}`} />INC</span>
            <span className="hero-pipe-item"><span className={`hero-dot ${pipelineStatus.prices ? 'on' : 'off'}`} />MKT</span>
            <span className="hero-pipe-item"><span className={`hero-dot ${pipelineStatus.airspace ? 'on' : 'warn'}`} />AIR</span>
            <span className="hero-pipe-item"><span className={`hero-dot ${pipelineStatus.health.verified === 'live' ? 'on' : pipelineStatus.health.verified === 'stale' ? 'warn' : 'off'}`} />VER</span>
            <span className="hero-pipe-item"><span className={`hero-dot ${prediction?.sufficient ? 'on' : 'warn'}`} />PRD</span>
          </div>
        </div>

        <div className="hero-strip-block hero-strip-wide">
          <div className="hero-strip-label">GCC Snapshot</div>
          <div className="hero-strip-inline">
            {gccRows.length > 0
              ? gccRows.map(r => <span key={r.label}>{r.label} {r.count}</span>)
              : <span>NO GCC EVENTS</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
