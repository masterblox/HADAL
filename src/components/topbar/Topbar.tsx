import { useDrawMark } from '@/canvas/useDrawMark'
import type { PipelineHealth } from '@/hooks/useDataPipeline'
import { BUILD_INFO, shortBuildTime } from '@/lib/build-info'
import { useUtcClock } from '@/hooks/useUtcClock'

type Lane = 'overview' | 'operations' | 'console'

interface TopbarProps {
  threatLevel: number | null
  incidentCount: number
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
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

function getDataMode(health: PipelineHealth) {
  const states = [health.incidents, health.prices, health.airspace, health.verified]
  const liveCount = states.filter(state => state === 'live').length
  const staleCount = states.filter(state => state === 'stale').length
  if (liveCount === states.length) return 'LIVE'
  if (liveCount > 0 || staleCount > 0) return 'PARTIAL'
  return 'OFFLINE'
}

function getPosture(threatLevel: number | null) {
  if (threatLevel == null) return 'DEGRADED'
  if (threatLevel >= 75) return 'CRITICAL'
  if (threatLevel >= 60) return 'CONTESTED'
  if (threatLevel >= 35) return 'WATCH'
  return 'GUARDED'
}

export function Topbar({ threatLevel, incidentCount, pipelineStatus, sandbox, onSandboxToggle, activeLane, onNavigate }: TopbarProps) {
  const markRef = useDrawMark(32)
  const { zulu, elapsed } = useUtcClock()
  const readiness = threatLevel === null ? 'DEGRADED' : threatLevel >= 60 ? 'ELEVATED' : 'GUARDED'
  const posture = getPosture(threatLevel)
  const dataMode = getDataMode(pipelineStatus.health)

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
          <span className={`tb-status-chip${posture === 'CRITICAL' || posture === 'CONTESTED' ? ' warn' : ''}`}>{posture}</span>
        </div>
      </div>
      <div className="tb-div" />
      <span className="tb-data-source">DATA: {dataMode}</span>
      <span className="tb-build-stamp">
        BUILD {BUILD_INFO.commitSha} · {BUILD_INFO.deployTarget.toUpperCase()} · {shortBuildTime(BUILD_INFO.buildTime)}
      </span>
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
