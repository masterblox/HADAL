import type { Incident } from '@/hooks/useDataPipeline'
import { MekheadTile } from './tiles/MekheadTile'
import { ThreatSignalTile } from './tiles/ThreatSignalTile'
import { ArgusTile, ChatterTile, IgniteTile } from './tiles/AynFeatureTiles'
import { VerificationTile } from './tiles/VerificationTile'
import { ReportsTile } from './tiles/ReportsTile'
import {
  EventTimelineTile,
  GeographicConcentrationTile,
  TypeProfileTile,
  FeedQualityTile,
} from './tiles/AnalysisChartTiles'

interface Props {
  incidents: Incident[]
  onEdit?: () => void
}

export function ConsoleCircuitShell({ incidents, onEdit }: Props) {
  return (
    <div className="console-circuit-shell">
      <div className="console-circuit-main">

        {/* Decorative concentric rings — behind sectors */}
        <div className="console-circuit-ring far" />
        <div className="console-circuit-ring outer" />
        <div className="console-circuit-ring inner" />

        {/* PCB conductor traces — connect sector inner edges toward core */}
        <svg className="console-trace-svg" aria-hidden="true">
          {/* UL stitch trace */}
          <line className="console-trace-line" x1="41%" y1="13.5%" x2="46%" y2="13.5%" />
          <circle className="console-trace-pad" cx="41%" cy="13.5%" r="1.5" />
          {/* LM arrow trace */}
          <line className="console-trace-line" x1="37%" y1="38%" x2="43%" y2="38%" />
          <circle className="console-trace-pad" cx="37%" cy="38%" r="1.5" />
          {/* LL stitch trace */}
          <line className="console-trace-line" x1="41%" y1="65.5%" x2="46%" y2="65.5%" />
          <circle className="console-trace-pad" cx="41%" cy="65.5%" r="1.5" />
          {/* UR stitch trace */}
          <line className="console-trace-line" x1="59%" y1="13.5%" x2="54%" y2="13.5%" />
          <circle className="console-trace-pad" cx="59%" cy="13.5%" r="1.5" />
          {/* RM arrow trace */}
          <line className="console-trace-line" x1="63%" y1="38%" x2="57%" y2="38%" />
          <circle className="console-trace-pad" cx="63%" cy="38%" r="1.5" />
          {/* LR stitch trace */}
          <line className="console-trace-line" x1="59%" y1="65.5%" x2="54%" y2="65.5%" />
          <circle className="console-trace-pad" cx="59%" cy="65.5%" r="1.5" />
        </svg>

        {/* Mekhead core — centered */}
        <div className="console-core-shell">
          <div className="console-core-label">
            <span className="kicker">HADAL // GULF THEATRE</span>
            <span className="value">MEKHEAD CORE</span>
            <span className="kicker">HD-07 · ISR</span>
          </div>
          <div className="console-core">
            <div className="console-core-viewport">
              <MekheadTile />
            </div>
          </div>
        </div>

        {/* Left column */}
        <div className="console-sector ul">
          <div className="console-sector-kicker top-left live">
            <span className="console-sector-icon">◈</span>
            <span className="console-sector-title">THREAT SIGNAL</span>
          </div>
          <div className="console-sector-body">
            <ThreatSignalTile incidents={incidents} />
          </div>
          <div className="console-sector-stitch" />
        </div>

        <div className="console-sector lm">
          <div className="console-sector-kicker top-left stale">
            <span className="console-sector-icon">◬</span>
            <span className="console-sector-title">ARGUS</span>
          </div>
          <div className="console-sector-body">
            <ArgusTile incidents={incidents} />
          </div>
          <div className="console-sector-stitch" />
        </div>

        <div className="console-sector ll">
          <div className="console-sector-kicker top-left live">
            <span className="console-sector-icon">⊞</span>
            <span className="console-sector-title">VERIFICATION</span>
          </div>
          <div className="console-sector-body">
            <VerificationTile />
          </div>
          <div className="console-sector-stitch" />
        </div>

        {/* Right column */}
        <div className="console-sector ur">
          <div className="console-sector-kicker top-right stale">
            <span className="console-sector-icon">☰</span>
            <span className="console-sector-title">CHATTER</span>
          </div>
          <div className="console-sector-body">
            <ChatterTile />
          </div>
          <div className="console-sector-stitch" />
        </div>

        <div className="console-sector rm">
          <div className="console-sector-kicker top-right offline">
            <span className="console-sector-icon">✦</span>
            <span className="console-sector-title">IGNITE</span>
          </div>
          <div className="console-sector-body">
            <IgniteTile incidents={incidents} />
          </div>
          <div className="console-sector-stitch" />
        </div>

        <div className="console-sector lr">
          <div className="console-sector-kicker top-right live">
            <span className="console-sector-icon">▤</span>
            <span className="console-sector-title">REPORTS</span>
          </div>
          <div className="console-sector-body">
            <ReportsTile />
          </div>
          <div className="console-sector-stitch" />
        </div>

        {onEdit && (
          <button
            type="button"
            className="circuit-configure-hint"
            onClick={onEdit}
          >
            ⊕ CONFIGURE LAYOUT
          </button>
        )}

      </div>

      {/* Aux strip — 4 analysis chart tiles */}
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

      {/* Ghost builder slot — teaches board is configurable */}
      {onEdit && (
        <button
          type="button"
          className="console-ghost-slot"
          onClick={onEdit}
          aria-label="Configure console layout"
        >
          <span className="console-ghost-slot-label">BUILD BOARD</span>
          <span className="console-ghost-slot-desc">Add modules · Rearrange layout · Save custom setup</span>
          <span className="console-ghost-slot-cta">→ CONFIGURE</span>
        </button>
      )}
    </div>
  )
}
