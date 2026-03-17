import { useDrawMark } from '@/canvas/useDrawMark'
import { useUtcClock } from '@/hooks/useUtcClock'

interface TopbarProps {
  pressure: number
  sandbox: boolean
  onSandboxToggle: () => void
}

export function Topbar({ pressure, sandbox, onSandboxToggle }: TopbarProps) {
  const markRef = useDrawMark(32)
  const clock = useUtcClock()

  return (
    <div className="topbar">
      <div className="lockup">
        <canvas ref={markRef} width={32} height={32} />
        <div>
          <div className="lockup-word-top">HADAL</div>
          <div className="lockup-sub">THREAT INTELLIGENCE TERMINAL</div>
        </div>
      </div>
      <div className="tb-div" />
      <div className="tb-alert">
        <span className="tb-alert-icon">&#9888;</span>
        <span className="tb-alert-t">DAY 10 · OP. EPIC FURY · MOST INTENSE STRIKES — GULF ACTIVE</span>
      </div>
      <div className="tb-div" />
      <button className={`tb-sandbox${sandbox ? ' active' : ''}`} onClick={onSandboxToggle}>
        {sandbox ? '// SANDBOX ON' : '// SANDBOX OFF'}
      </button>
      <div className="tb-stats">
        <div className="tb-stat"><div className="tb-stat-l">DEPTH</div><div className="tb-stat-v">10,924M</div></div>
        <div className="tb-stat"><div className="tb-stat-l">PRESSURE</div><div className="tb-stat-v">{pressure.toLocaleString()} BAR</div></div>
        <div className="tb-stat"><div className="tb-stat-l">UTC</div><div className="tb-stat-v" style={{fontSize:'10px'}}>{clock}</div></div>
      </div>
    </div>
  )
}
