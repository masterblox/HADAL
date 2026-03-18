import { WeaponIcon } from './WeaponIcon'

type Stage = 'completed' | 'active' | 'failed' | 'pending'
type Outcome = 'KILL' | 'IMPACT' | 'ACTIVE' | 'LOST TRACK'
type Weapon = 'ballistic' | 'drone' | 'cruise'

interface KillChain {
  id: string
  time: string
  weapon: Weapon
  stages: [Stage, Stage, Stage, Stage]
  outcome: Outcome
  conf: number
}

const chains: KillChain[] = [
  { id: 'KC-0041', time: '10:14:32Z', weapon: 'ballistic', stages: ['completed','completed','completed','completed'], outcome: 'KILL', conf: 98 },
  { id: 'KC-0039', time: '10:11:07Z', weapon: 'drone',     stages: ['completed','completed','completed','completed'], outcome: 'KILL', conf: 94 },
  { id: 'KC-0044', time: '10:17:55Z', weapon: 'ballistic', stages: ['completed','completed','active','pending'],     outcome: 'ACTIVE', conf: 0 },
  { id: 'KC-0037', time: '10:08:21Z', weapon: 'cruise',    stages: ['failed','failed','failed','failed'],            outcome: 'IMPACT', conf: 91 },
  { id: 'KC-0042', time: '10:15:48Z', weapon: 'drone',     stages: ['completed','completed','failed','failed'],      outcome: 'LOST TRACK', conf: 0 },
]

const STAGE_LABELS = ['LAUNCH', 'TRACKING', 'INTERCEPT', 'OUTCOME'] as const

function stageClass(s: Stage) {
  switch (s) {
    case 'completed': return 'kc-stage-done'
    case 'active':    return 'kc-stage-active'
    case 'failed':    return 'kc-stage-failed'
    case 'pending':   return 'kc-stage-pending'
  }
}

function connClass(from: Stage, to: Stage) {
  if (to === 'active') return 'kc-conn kc-conn-active'
  if (from === 'failed' || to === 'failed') return 'kc-conn kc-conn-failed'
  if (from === 'completed' && to === 'completed') return 'kc-conn kc-conn-done'
  return 'kc-conn kc-conn-pending'
}

function outcomeClass(o: Outcome) {
  switch (o) {
    case 'KILL':       return 'kc-outcome-kill'
    case 'IMPACT':     return 'kc-outcome-impact'
    case 'ACTIVE':     return 'kc-outcome-active'
    case 'LOST TRACK': return 'kc-outcome-lost'
  }
}

/* Pip-Boy battery bar: 5 segments filled by confidence % */
function ConfBar({ conf, variant }: { conf: number; variant: 'green' | 'amber' }) {
  const filled = Math.round((conf / 100) * 5)
  return (
    <div className="kc-confbar">
      {[0,1,2,3,4].map(i => (
        <div key={i} className={`kc-seg ${i < filled ? (variant === 'green' ? 'kc-seg-on' : 'kc-seg-warn') : 'kc-seg-off'}`} />
      ))}
    </div>
  )
}

export function KillChainTracker() {
  const active = chains.filter(c => c.outcome === 'ACTIVE').length
  const kills = chains.filter(c => c.outcome === 'KILL').length
  const impacts = chains.filter(c => c.outcome === 'IMPACT').length
  const lost = chains.filter(c => c.outcome === 'LOST TRACK').length

  return (
    <div className="kc-section jp-panel sev-critical">
      <div className="kc-header jp-panel-header">
        <div className="HDR-DOT jp-status-dot active" />
        <span className="kc-title">KILL CHAIN TRACKER</span>
        <span className="kc-subtitle">{chains.length} ENGAGEMENTS</span>
      </div>
      <div className="kc-body">
        {chains.map((chain, idx) => (
          <div key={chain.id} className="kc-row" style={{ opacity: Math.max(0.4, 1 - idx * 0.12) }}>
            <div className="kc-weapon">
              <WeaponIcon type={chain.weapon} />
            </div>
            <div className="kc-meta">
              <span className="kc-id">{chain.id}</span>
              <span className="kc-time">{chain.time}</span>
            </div>
            <div className="kc-pipeline">
              {chain.stages.map((stage, si) => (
                <div key={si} className="kc-stage-group">
                  {si > 0 && <div className={connClass(chain.stages[si - 1], stage)} />}
                  <div className={`kc-stage ${stageClass(stage)} ${si === 3 ? 'kc-stage-outcome' : ''}`}>
                    {/* Pip-Boy pill indicator */}
                    <div className={`kc-pill ${stageClass(stage)}`} />
                    <span className="kc-stage-label">{STAGE_LABELS[si]}</span>
                    {si === 3 && (
                      <div className="kc-outcome-wrap">
                        <span className={`kc-outcome ${outcomeClass(chain.outcome)}`}>
                          {chain.outcome}
                        </span>
                        {chain.conf > 0 && (
                          <ConfBar conf={chain.conf} variant={chain.outcome === 'IMPACT' ? 'amber' : 'green'} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="kc-agg">
        <div className="kc-agg-cell">
          <span className="kc-agg-v" style={{color:'var(--g)'}}>{kills}</span>
          <span className="kc-agg-l">INTERCEPTED</span>
        </div>
        <div className="kc-agg-cell">
          <span className="kc-agg-v kc-glow">{active}</span>
          <span className="kc-agg-l">ACTIVE</span>
        </div>
        <div className="kc-agg-cell">
          <span className="kc-agg-v" style={{color:'var(--warn)'}}>{impacts}</span>
          <span className="kc-agg-l">IMPACT</span>
        </div>
        <div className="kc-agg-cell">
          <span className="kc-agg-v" style={{color:'var(--g3)'}}>{lost}</span>
          <span className="kc-agg-l">LOST</span>
        </div>
        <div className="kc-agg-bar">
          <div className="kc-agg-fill" style={{width:`${(kills / chains.length) * 100}%`}} />
          <div className="kc-agg-fill kc-agg-fill-warn" style={{width:`${(impacts / chains.length) * 100}%`}} />
        </div>
      </div>
    </div>
  )
}
