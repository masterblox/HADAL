import { navigateTo } from '@/lib/lane-routing'
import type { Lane } from '@/lib/lane-routing'

type FeatureStatus = 'live' | 'stale' | 'offline' | 'partial'

interface Feature {
  id: string
  icon: string
  name: string
  status: FeatureStatus
  source: string
  lane: Lane
}

// Truth source: mirrors TILE_META in ConsolePage + honest labels for non-tiled modules
const FEATURES: Feature[] = [
  { id: 'feed',     icon: '▣', name: 'FEED',      status: 'live',    source: 'VERIFIED / RAW',   lane: 'console'    },
  { id: 'map',      icon: '◉', name: 'MAP',       status: 'live',    source: 'INCIDENTS',        lane: 'operations' },
  { id: 'argus',    icon: '◬', name: 'ARGUS',     status: 'stale',   source: 'PIPELINE PROXY',   lane: 'console'    },
  { id: 'chatter',  icon: '☰', name: 'CHATTER',   status: 'stale',   source: 'PIPELINE SOURCES', lane: 'console'    },
  { id: 'ignite',   icon: '✦', name: 'IGNITE',    status: 'offline', source: 'UPSTREAM MODULE',  lane: 'console'    },
  { id: 'chronos',  icon: '⌁', name: 'CHRONOS',   status: 'stale',   source: 'INCIDENTS',        lane: 'console'    },
  { id: 'skyline',  icon: '◫', name: 'SKYLINE',   status: 'offline', source: 'UPSTREAM MODULE',  lane: 'console'    },
  { id: 'maritime', icon: '⊕', name: 'MARITIME',  status: 'offline', source: 'NO SOURCE YET',    lane: 'operations' },
  { id: 'signals',  icon: '▶', name: 'SIGNALS',   status: 'live',    source: 'INCIDENTS',        lane: 'console'    },
  { id: 'venus',    icon: '◌', name: 'VENUS TRAP', status: 'partial', source: 'PREDICTION MODEL', lane: 'console'    },
]

const STATUS_LABEL: Record<FeatureStatus, string> = {
  live:    'LIVE',
  stale:   'PARTIAL',
  offline: 'OFFLINE',
  partial: 'PARTIAL',
}

export function FeatureBar() {
  return (
    <div className="feature-bar" role="navigation" aria-label="Module discovery">
      <span className="feature-bar-label">MODULES</span>
      <div className="feature-bar-chips">
        {FEATURES.map(f => (
          <button
            key={f.id}
            className={`feature-chip feature-chip--${f.status}`}
            onClick={() => navigateTo(f.lane)}
            title={`${f.name} · ${f.source} · go to ${f.lane}`}
            type="button"
          >
            <span className="feature-chip-icon">{f.icon}</span>
            <span className="feature-chip-name">{f.name}</span>
            <span className="feature-chip-source">{f.source}</span>
            <span className="feature-chip-status">{STATUS_LABEL[f.status]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
