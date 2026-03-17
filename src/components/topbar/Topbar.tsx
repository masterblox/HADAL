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
      <div className="tb-stats jp-intel">
        <div className="tb-stat jp-intel-cell"><div className="tb-stat-l jp-intel-lbl">DEPTH</div><div className="tb-stat-v jp-intel-val">10,924M</div></div>
        <div className="tb-stat jp-intel-cell"><div className="tb-stat-l jp-intel-lbl">PRESSURE</div><div className="tb-stat-v jp-intel-val">{pressure.toLocaleString()} BAR</div></div>
        <div className="tb-stat jp-intel-cell"><div className="tb-stat-l jp-intel-lbl">UTC</div><div className="tb-stat-v jp-intel-val" style={{fontSize:'var(--fs-small)'}}>{clock}</div></div>
      </div>
    </div>
  )
}
