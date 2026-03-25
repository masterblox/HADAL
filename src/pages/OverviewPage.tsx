import { ThreatSignalTile } from '@/components/console/tiles/ThreatSignalTile'
import { VerificationTile } from '@/components/console/tiles/VerificationTile'
import { ReportsTile } from '@/components/console/tiles/ReportsTile'
import { ArgusTile, ChatterTile, IgniteTile } from '@/components/console/tiles/AynFeatureTiles'
import {
  EventTimelineTile,
  GeographicConcentrationTile,
  TypeProfileTile,
  FeedQualityTile,
} from '@/components/console/tiles/AnalysisChartTiles'
import { MekheadTile } from '@/components/console/tiles/MekheadTile'
import type { PipelineHealth, PriceData, AirspaceData, Incident } from '@/hooks/useDataPipeline'

const TRACE_PATHS = [
  '0,16 18,16 31,29',
  '0,50 24,50 34,50',
  '0,84 18,84 31,71',
  '100,16 82,16 69,29',
  '100,50 76,50 66,50',
  '100,84 82,84 69,71',
] as const

const BOND_PADS: [number, number][] = [
  [18, 16], [31, 29],
  [24, 50], [34, 50],
  [18, 84], [31, 71],
  [82, 16], [69, 29],
  [76, 50], [66, 50],
  [82, 84], [69, 71],
]

const OVERVIEW_BAYS = [
  { key: 'ul', title: 'THREAT SIGNAL', status: 'live' as const },
  { key: 'lm', title: 'ARGUS', status: 'stale' as const },
  { key: 'll', title: 'VERIFICATION', status: 'live' as const },
  { key: 'ur', title: 'CHATTER', status: 'stale' as const },
  { key: 'rm', title: 'IGNITE', status: 'offline' as const },
  { key: 'lr', title: 'REPORTS', status: 'live' as const },
] as const

interface OverviewPageProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  incidents: Incident[]
  prices: PriceData | null
  airspace: AirspaceData | null
}

function renderOverviewBay(key: (typeof OVERVIEW_BAYS)[number]['key'], incidents: Incident[]) {
  switch (key) {
    case 'ul':
      return <ThreatSignalTile incidents={incidents} />
    case 'lm':
      return <ArgusTile incidents={incidents} />
    case 'll':
      return <VerificationTile />
    case 'ur':
      return <ChatterTile />
    case 'rm':
      return <IgniteTile incidents={incidents} />
    case 'lr':
      return <ReportsTile />
    default:
      return null
  }
}

export function OverviewPage({ incidents }: OverviewPageProps) {
  return (
    <div className="console-circuit-shell overview-hero-shell">
      <div className="console-circuit-main jp-panel">
        <div className="console-circuit-ring far" aria-hidden="true" />
        <div className="console-circuit-ring outer" aria-hidden="true" />
        <div className="console-circuit-ring inner" aria-hidden="true" />

        <svg className="console-trace-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {TRACE_PATHS.map((points, i) => (
            <polyline key={i} points={points} className="console-trace-line" />
          ))}
          {BOND_PADS.map(([cx, cy], i) => (
            <rect
              key={i}
              x={cx - 1.8}
              y={cy - 1.8}
              width="3.6"
              height="3.6"
              rx="0"
              ry="0"
              transform={`rotate(45 ${cx} ${cy})`}
              className="console-trace-pad"
            />
          ))}
        </svg>

        {OVERVIEW_BAYS.map(bay => (
          <div key={bay.key} className={`console-sector ${bay.key}`}>
            <section className="console-sector-shell">
              <div className="console-sector-kicker top-left">
                <span className="console-sector-title">{bay.title}</span>
              </div>
              <div className={`console-sector-kicker top-right ${bay.status}`}>
                {bay.status.toUpperCase()}
              </div>
              <div className="console-sector-stitch" aria-hidden="true" />
              <div className="console-sector-body">
                {renderOverviewBay(bay.key, incidents)}
              </div>
            </section>
          </div>
        ))}

        <div className="console-core-shell">
          <div className="console-core-label">
            <span className="kicker">ARCHIVE CORE // PERSISTENT</span>
            <span className="value">MEKHEAD</span>
          </div>
          <div className="console-core">
            <div className="console-core-viewport">
              <MekheadTile />
            </div>
          </div>
        </div>
      </div>

      <div className="console-aux-grid">
        <div className="console-aux-slot">
          <EventTimelineTile incidents={incidents} />
        </div>
        <div className="console-aux-slot">
          <GeographicConcentrationTile incidents={incidents} />
        </div>
        <div className="console-aux-slot">
          <TypeProfileTile incidents={incidents} />
        </div>
        <div className="console-aux-slot">
          <FeedQualityTile />
        </div>
      </div>
    </div>
  )
}
