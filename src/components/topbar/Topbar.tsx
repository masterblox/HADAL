import { useDrawMark } from '@/canvas/useDrawMark'
import { useUtcClock } from '@/hooks/useUtcClock'

type Lane = 'overview' | 'operations' | 'console'

interface TopbarProps {
  threatLevel: number | null
  incidentCount: number
  sandbox: boolean
  onSandboxToggle: () => void
  activeLane: Lane
  onNavigate: (lane: Lane) => void
}

const NAV_ITEMS: { id: Lane; label: string }[] = [
  { id: 'overview', label: 'OVERVIEW' },
  { id: 'operations', label: 'MAPS' },
  { id: 'console', label: 'CONSOLE' },
]

export function Topbar({ threatLevel, incidentCount, sandbox, onSandboxToggle, activeLane, onNavigate }: TopbarProps) {
  const markRef = useDrawMark(32)
  const { zulu, elapsed } = useUtcClock()
  const readiness = threatLevel === null ? 'DEGRADED' : threatLevel >= 60 ? 'ELEVATED' : 'GUARDED'

  return (
    <div className="topbar">
      <div className="lockup">
        <canvas ref={markRef} width={32} height={32} />
        <div>
          <div className="lockup-word-top">HADAL</div>
          <div className="lockup-sub">GULF THEATRE THREAT INTELLIGENCE TERMINAL</div>
        </div>
      </div>
      <div className="tb-div" />
      <nav className="tb-nav">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`tb-nav-item${activeLane === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="tb-div" />
      <div className="tb-alert">
        <span className="tb-alert-t">GULF WATCH PIPELINE</span>
        <span className="tb-elapsed">{elapsed}</span>
      </div>
      <div className="tb-status-rail">
        <div className="tb-status-cell">
          <span className="tb-status-label">READINESS</span>
          <span className={`tb-status-chip${threatLevel !== null && threatLevel >= 60 ? ' warn' : ''}`}>{readiness}</span>
        </div>
        <div className="tb-status-cell">
          <span className="tb-status-label">POSTURE</span>
          <span className="tb-status-chip">CONTESTED</span>
        </div>
      </div>
      <div className="tb-div" />
      <span className="tb-data-source">DATA: FUSED LIVE/SIM</span>
      <button className={`tb-sandbox${sandbox ? ' active' : ''}`} onClick={onSandboxToggle}>
        {sandbox ? 'SANDBOX ON' : 'SANDBOX'}
      </button>
      <div className="tb-stats jp-intel">
        <div className="tb-stat jp-intel-cell"><div className="tb-stat-l jp-intel-lbl">INCIDENTS</div><div className="tb-stat-v jp-intel-val">{incidentCount || '—'}</div></div>
        <div className="tb-stat jp-intel-cell"><div className="tb-stat-l jp-intel-lbl">THREAT</div><div className="tb-stat-v jp-intel-val" style={threatLevel !== null && threatLevel >= 60 ? { color: 'var(--warn)' } : undefined}>{threatLevel ?? '—'}</div></div>
        <div className="tb-stat jp-intel-cell"><div className="tb-stat-l jp-intel-lbl">UTC</div><div className="tb-stat-v jp-intel-val" style={{ fontSize: 'var(--fs-small)' }}>{zulu}</div></div>
      </div>
    </div>
  )
}
