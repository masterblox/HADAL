import type { Incident } from '@/hooks/useDataPipeline'
import { navigateTo } from '@/lib/lane-routing'

interface LandingHeroProps {
  incidents: Incident[]
}

const NOISE_WIDTHS = ['92%', '60%', '76%', '41%', '84%', '55%']

function NoiseLines({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="lh-noise-line" style={{ width: NOISE_WIDTHS[i % NOISE_WIDTHS.length] }} />
      ))}
    </>
  )
}

const SECTORS = [
  { id: 'ul', icon: '◉', title: 'THREAT SIGNAL', status: 'live',  row: 1, col: 1 },
  { id: 'ur', icon: '⬡', title: 'ARGUS',         status: 'live',  row: 1, col: 3 },
  { id: 'lm', icon: '⌖', title: 'CHATTER',       status: 'live',  row: 2, col: 1 },
  { id: 'rm', icon: '◈', title: 'IGNITE',         status: 'stale', row: 2, col: 3 },
  { id: 'll', icon: '⊕', title: 'VERIFICATION',  status: 'live',  row: 3, col: 1 },
  { id: 'lr', icon: '⊞', title: 'REPORTS',       status: 'live',  row: 3, col: 3 },
]

const AUX_CELLS = [
  { title: 'EVT TIMELINE',  color: 'var(--g15)' },
  { title: 'GEO CONC',     color: 'var(--warn2)' },
  { title: 'TYPE PROFILE', color: 'var(--warn2)' },
  { title: 'FEED QUALITY', color: 'var(--g15)' },
]

function deriveThreat(incidents: Incident[]): { label: string; color: string } {
  const n = incidents.length
  if (n >= 40) return { label: 'CRITICAL', color: 'var(--warn)' }
  if (n >= 20) return { label: 'HIGH',     color: 'var(--warn5)' }
  if (n >= 8)  return { label: 'ELEVATED', color: 'var(--g7)' }
  return { label: 'MODERATE', color: 'var(--g5)' }
}

export function LandingHero({ incidents }: LandingHeroProps) {
  const threat = deriveThreat(incidents)

  return (
    <div className="overview-landing">
      {/* ── LEFT — identity column ── */}
      <div className="overview-landing-copy">
        <div className="overview-landing-label">HADAL // GULF THEATRE THREAT INTELLIGENCE</div>

        <div className="overview-landing-value" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
          MEKHEAD<br />CONSOLE
        </div>

        <div className="overview-landing-lead">
          Real-time threat intelligence terminal for Gulf theatre operations.
          Live feeds, verified incidents, and multi-source analysis.
        </div>

        <div className="overview-landing-signal">
          <div className="overview-landing-label">INCIDENTS ACTIVE</div>
          <div style={{ fontFamily: 'var(--C2)', fontSize: '36px', lineHeight: 1, color: 'var(--g)' }}>
            {String(incidents.length).padStart(3, '0')}
          </div>
          <div className="overview-landing-label" style={{ color: threat.color }}>
            T-LEVEL: {threat.label}
          </div>
        </div>

        <div className="overview-landing-actions">
          <button className="overview-landing-btn primary" onClick={() => navigateTo('console')}>
            → ENTER CONSOLE
          </button>
          <button className="overview-landing-btn" onClick={() => navigateTo('operations')}>
            → MAP VIEW
          </button>
        </div>
      </div>

      {/* ── RIGHT — mock terminal ── */}
      <div className="overview-landing-hero">
        <div className="lh-terminal">

          {/* title bar */}
          <div className="lh-bar">
            <div className="lh-bar-dots">
              <span style={{ background: '#ff5f57' }} />
              <span style={{ background: '#ffbd2e' }} />
              <span style={{ background: '#28ca41' }} />
            </div>
            <div className="lh-bar-title">HADAL · MEKHEAD CONSOLE</div>
            <div className="lh-bar-status">LIVE ●</div>
          </div>

          {/* sector grid */}
          <div className="lh-grid">
            {SECTORS.map(s => {
              const dotColor = s.status === 'live'
                ? 'var(--g)'
                : s.status === 'stale'
                ? 'var(--warn)'
                : 'var(--g15)'
              return (
                <div
                  key={s.id}
                  className="lh-sector"
                  style={{ gridRow: s.row, gridColumn: s.col }}
                >
                  <div className="lh-sector-head">
                    <span className="lh-sector-icon">{s.icon}</span>
                    <span className="lh-sector-title">{s.title}</span>
                    <span className="lh-sector-dot" style={{ background: dotColor }} />
                  </div>
                  <NoiseLines count={4} />
                </div>
              )
            })}

            {/* core — spans all 3 rows in center column */}
            <div className="lh-core" style={{ gridRow: '1 / 4', gridColumn: 2 }}>
              <div className="lh-rings-wrap">
                <div className="lh-ring lh-ring--outer" />
                <div className="lh-ring lh-ring--inner" />
                <span className="lh-core-glyph">◈</span>
              </div>
              <div className="lh-core-label">MEKHEAD CORE</div>
            </div>
          </div>

          {/* aux strip */}
          <div className="lh-aux">
            {AUX_CELLS.map(cell => (
              <div key={cell.title} className="lh-aux-cell">
                <div className="lh-aux-bar" style={{ background: cell.color }} />
                <div className="lh-aux-title">{cell.title}</div>
                <NoiseLines count={3} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
