import { useEffect, useMemo, useState } from 'react'
import { ConsoleToolbar } from '@/components/console/ConsoleToolbar'
import { ConsoleTile } from '@/components/console/ConsoleTile'
import { TilePicker } from '@/components/console/TilePicker'
import { ThreatSignalTile } from '@/components/console/tiles/ThreatSignalTile'
import { GlobeTile } from '@/components/console/tiles/GlobeTile'
import { ThreatFeedTile } from '@/components/console/tiles/ThreatFeedTile'
import { AirspaceTile } from '@/components/console/tiles/AirspaceTile'
import { SituationTile } from '@/components/console/tiles/SituationTile'
import { ConfidenceTile } from '@/components/console/tiles/ConfidenceTile'
import { KineticDataTile } from '@/components/console/tiles/KineticDataTile'
import { TheatreExchangeTile } from '@/components/console/tiles/TheatreExchangeTile'
import { ScenarioOutlookTile } from '@/components/console/tiles/ScenarioOutlookTile'
import { AnalysisSummaryTile } from '@/components/console/tiles/AnalysisSummaryTile'
import { IntelligenceTile } from '@/components/console/tiles/IntelligenceTile'
import { VerificationTile } from '@/components/console/tiles/VerificationTile'
import { ReportsTile } from '@/components/console/tiles/ReportsTile'
import { ArgusTile, ChatterTile, IgniteTile, ChronosTile, SkylineTile } from '@/components/console/tiles/AynFeatureTiles'
import { MekheadTile } from '@/components/console/tiles/MekheadTile'
import { SatelliteTile } from '@/components/console/tiles/SatelliteTile'
import { MilitarySignalsTile } from '@/components/console/tiles/MilitarySignalsTile'
import {
  EventTimelineTile,
  GeographicConcentrationTile,
  TypeProfileTile,
  FeedQualityTile,
} from '@/components/console/tiles/AnalysisChartTiles'
import { PredictorEngineTile } from '@/components/console/tiles/PredictorEngineTile'
import type { AirspaceData, Incident, PriceData } from '@/hooks/useDataPipeline'
import type { PipelineHealth } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'
import {
  CONSOLE_PRESETS,
  CONSOLE_TILE_ORDER,
  DEFAULT_CONSOLE_PRESET,
  type ConsoleTileId,
} from '@/data/console-presets'

interface ConsolePageProps {
  sandbox: boolean
  onSandboxToggle: () => void
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  incidents: Incident[]
  prices: PriceData | null
  airspace: AirspaceData | null
  prediction: PredictionResult | null
}

const STORAGE_KEY = 'hadal-console-layout-v5'
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

const SECTOR_BAYS = [
  { key: 'ul', id: 'A', label: 'UPPER LEFT'  },
  { key: 'lm', id: 'B', label: 'LEFT MID'    },
  { key: 'll', id: 'C', label: 'LOWER LEFT'  },
  { key: 'ur', id: 'D', label: 'UPPER RIGHT' },
  { key: 'rm', id: 'E', label: 'RIGHT MID'   },
  { key: 'lr', id: 'F', label: 'LOWER RIGHT' },
] as const

const LOCKED_SECTOR_ORDER: ConsoleTileId[] = [
  'threat-signal',
  'argus',
  'verification',
  'chatter',
  'ignite',
  'reports',
]

const LOCKED_AUX_ORDER: ConsoleTileId[] = [
  'event-timeline',
  'geographic-concentration',
  'type-profile',
  'feed-quality',
]

interface StoredLayoutState {
  presetId: string
  slots: Array<ConsoleTileId | null>
  custom: boolean
}

const TILE_META: Record<ConsoleTileId, { title: string; icon: string; source: string; updated: string; status?: 'live' | 'stale' | 'offline' }> = {
  'threat-signal': { title: 'THREAT SIGNAL', icon: '◈', source: 'PIPELINE + MODEL', updated: 'LIVE', status: 'live' },
  globe: { title: 'PRESSURE GLOBE', icon: '◉', source: 'INCIDENTS', updated: '60S', status: 'live' },
  'market-impact': { title: 'MARKET IMPACT', icon: '▤', source: 'PRICES', updated: '60S', status: 'live' },
  airspace: { title: 'AIRSPACE', icon: '◇', source: 'AIRSPACE', updated: '60S', status: 'live' },
  tempo: { title: 'TEMPO', icon: '▦', source: 'PREDICTION', updated: 'LOCAL', status: 'live' },
  intelligence: { title: 'INTELLIGENCE', icon: '▥', source: 'TREND ANALYSIS', updated: 'LOCAL', status: 'live' },
  'kinetic-data': { title: 'KINETIC DATA', icon: '▲', source: 'INCIDENTS', updated: '60S', status: 'live' },
  'scenario-outlook': { title: 'SCENARIO OUTLOOK', icon: '△', source: 'MODEL', updated: 'LOCAL', status: 'live' },
  'threat-feed': { title: 'THREAT FEED', icon: '▣', source: 'VERIFIED / RAW', updated: '60S', status: 'live' },
  'theatre-exchange': { title: 'THEATRE EXCHANGE', icon: '⇄', source: 'DERIVED', updated: 'LIVE', status: 'live' },
  confidence: { title: 'CONFIDENCE', icon: '▥', source: 'VERIFICATION', updated: 'LIVE', status: 'stale' },
  verification: { title: 'VERIFICATION', icon: '⊞', source: 'INCIDENTS', updated: '60S', status: 'live' },
  reports: { title: 'REPORTS', icon: '▤', source: 'MODEL + INCIDENTS', updated: 'LOCAL', status: 'live' },
  'analysis-summary': { title: 'ANALYSIS SUMMARY', icon: '▧', source: 'INCIDENTS', updated: '60S', status: 'live' },
  'event-timeline': { title: 'EVENT TIMELINE', icon: '▨', source: 'INCIDENTS', updated: '60S', status: 'live' },
  'geographic-concentration': { title: 'GEOGRAPHIC CONCENTRATION', icon: '▩', source: 'INCIDENTS', updated: '60S', status: 'live' },
  'type-profile': { title: 'TYPE PROFILE', icon: '◎', source: 'INCIDENTS', updated: '60S', status: 'live' },
  'feed-quality': { title: 'FEED QUALITY', icon: '≣', source: 'INCIDENTS', updated: '60S', status: 'live' },
  'predictor-engine': { title: 'PREDICTOR ENGINE', icon: '⊿', source: 'SEQUENCE MODEL', updated: 'LOCAL', status: 'live' },
  argus: { title: 'ARGUS', icon: '◬', source: 'PIPELINE PROXY', updated: 'DERIVED', status: 'stale' },
  chatter: { title: 'CHATTER', icon: '☰', source: 'PIPELINE SOURCES', updated: 'DERIVED', status: 'stale' },
  ignite: { title: 'IGNITE', icon: '✦', source: 'UPSTREAM MODULE', updated: 'NO DATA', status: 'offline' },
  chronos: { title: 'CHRONOS', icon: '⌁', source: 'INCIDENTS', updated: 'DERIVED', status: 'stale' },
  skyline: { title: 'SKYLINE', icon: '◫', source: 'UPSTREAM MODULE', updated: 'NO DATA', status: 'offline' },
  mekhead: { title: 'MEKHEAD', icon: '◆', source: 'ARCHIVE', updated: 'STATIC', status: 'stale' },
  satellite: { title: 'SATELLITE', icon: '◌', source: 'ORBITAL REF', updated: 'STATIC', status: 'stale' },
  'military-signals': { title: 'MILITARY SIGNALS', icon: '▶', source: 'INCIDENTS', updated: '60S', status: 'live' },
}

function loadInitialState(): StoredLayoutState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { presetId: DEFAULT_CONSOLE_PRESET.id, slots: [...DEFAULT_CONSOLE_PRESET.slots], custom: false }
    const parsed = JSON.parse(raw) as StoredLayoutState
    if (!Array.isArray(parsed.slots) || parsed.slots.length !== 16) throw new Error('Invalid console layout')
    return parsed
  } catch {
    return { presetId: DEFAULT_CONSOLE_PRESET.id, slots: [...DEFAULT_CONSOLE_PRESET.slots], custom: false }
  }
}

function renderSectorTile(
  tileId: ConsoleTileId,
  renderTile: (tileId: ConsoleTileId) => React.ReactNode,
) {
  const meta = TILE_META[tileId]
  return (
    <section className="console-sector-shell">
      <div className="console-sector-kicker top-left">
        <span className="console-sector-icon">{meta.icon}</span>
        <span className="console-sector-title">{meta.title}</span>
      </div>
      <div className={`console-sector-kicker top-right ${meta.status ?? 'live'}`}>
        {(meta.status ?? 'live').toUpperCase()}
      </div>
      <div className="console-sector-stitch" aria-hidden="true" />
      <div className="console-sector-body">
        {renderTile(tileId)}
      </div>
    </section>
  )
}

export function ConsolePage({
  sandbox,
  onSandboxToggle,
  incidents,
  airspace,
  prices,
  prediction,
}: ConsolePageProps) {
  const [{ presetId, slots, custom }, setLayout] = useState<StoredLayoutState>(loadInitialState)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetId, slots, custom }))
  }, [presetId, slots, custom])

  const presetLabel = useMemo(() => {
    if (custom) return 'CUSTOM'
    return CONSOLE_PRESETS.find(preset => preset.id === presetId)?.label ?? DEFAULT_CONSOLE_PRESET.label
  }, [custom, presetId])

  const effectivePresetId = sandbox ? presetId : DEFAULT_CONSOLE_PRESET.id
  const effectivePresetLabel = sandbox ? presetLabel : DEFAULT_CONSOLE_PRESET.label

  const placedTiles = new Set(slots.filter(Boolean) as ConsoleTileId[])

  function applyPreset(nextPresetId: string) {
    const preset = CONSOLE_PRESETS.find(item => item.id === nextPresetId)
    if (!preset) return
    setLayout({ presetId: preset.id, slots: [...preset.slots], custom: false })
    setPickerIndex(null)
  }

  function removeTile(index: number) {
    setLayout(current => {
      const next = [...current.slots]
      next[index] = null
      return { ...current, slots: next, custom: true }
    })
  }

  function addTile(tileId: ConsoleTileId) {
    if (pickerIndex == null) return
    setLayout(current => {
      const next = [...current.slots]
      next[pickerIndex] = tileId
      return { ...current, slots: next, custom: true }
    })
    setPickerIndex(null)
  }

  const tilePickerOptions = CONSOLE_TILE_ORDER.map(id => ({
    id,
    label: TILE_META[id].title,
    icon: TILE_META[id].icon,
    placed: placedTiles.has(id),
  }))

  const sectorTiles = LOCKED_SECTOR_ORDER
  const auxTiles = LOCKED_AUX_ORDER

  function renderTile(tileId: ConsoleTileId) {
    switch (tileId) {
      case 'threat-signal':
        return <ThreatSignalTile incidents={incidents} />
      case 'globe':
        return <GlobeTile />
      case 'market-impact':
        return <SituationTile mode="market" prices={prices} airspace={null} prediction={null} />
      case 'tempo':
        return <SituationTile mode="tempo" prices={null} airspace={null} prediction={prediction} />
      case 'intelligence':
        return <IntelligenceTile />
      case 'threat-feed':
        return <ThreatFeedTile />
      case 'scenario-outlook':
        return <ScenarioOutlookTile />
      case 'airspace':
        return <AirspaceTile />
      case 'confidence':
        return <ConfidenceTile />
      case 'verification':
        return <VerificationTile />
      case 'kinetic-data':
        return <KineticDataTile />
      case 'theatre-exchange':
        return <TheatreExchangeTile />
      case 'reports':
        return <ReportsTile />
      case 'analysis-summary':
        return <AnalysisSummaryTile incidents={incidents} />
      case 'event-timeline':
        return <EventTimelineTile incidents={incidents} />
      case 'geographic-concentration':
        return <GeographicConcentrationTile incidents={incidents} />
      case 'type-profile':
        return <TypeProfileTile incidents={incidents} />
      case 'feed-quality':
        return <FeedQualityTile />
      case 'predictor-engine':
        return <PredictorEngineTile incidents={incidents} airspace={airspace} prices={prices} />
      case 'argus':
        return <ArgusTile incidents={incidents} />
      case 'chatter':
        return <ChatterTile />
      case 'ignite':
        return <IgniteTile incidents={incidents} />
      case 'chronos':
        return <ChronosTile incidents={incidents} />
      case 'skyline':
        return <SkylineTile />
      case 'mekhead':
        return <MekheadTile />
      case 'satellite':
        return <SatelliteTile />
      case 'military-signals':
        return <MilitarySignalsTile />
      default:
        return null
    }
  }

  return (
    <div className="console-page">
      <ConsoleToolbar
        editMode={sandbox}
        presetLabel={effectivePresetLabel}
        presetId={effectivePresetId}
        custom={sandbox ? custom : false}
        onPresetChange={applyPreset}
        onEditToggle={() => {
          setPickerIndex(null)
          onSandboxToggle()
        }}
      />
      {sandbox ? (
        <div className={`console-grid${sandbox ? ' is-editing' : ''}`}>
          {slots.map((tileId, index) => (
            <div key={index} className="console-slot">
              {tileId ? (
                <ConsoleTile
                  icon={TILE_META[tileId].icon}
                  title={TILE_META[tileId].title}
                  source={TILE_META[tileId].source}
                  updated={TILE_META[tileId].updated}
                  status={TILE_META[tileId].status}
                  editMode={sandbox}
                  onRemove={sandbox ? () => removeTile(index) : undefined}
                >
                  {renderTile(tileId)}
                </ConsoleTile>
              ) : (
                <button
                  className={`console-empty-slot${sandbox ? ' is-visible' : ''}`}
                  onClick={() => sandbox && setPickerIndex(index)}
                  disabled={!sandbox}
                >
                  <span>+</span>
                  <small>ADD TILE</small>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="console-circuit-shell">
          <div className="console-circuit-main jp-panel">
            {/* Decorative substrate rings — behind all content */}
            <div className="console-circuit-ring far"   aria-hidden="true" />
            <div className="console-circuit-ring outer" aria-hidden="true" />
            <div className="console-circuit-ring inner" aria-hidden="true" />

            {/* SVG conductor traces — visible only in gap channels */}
            <svg
              className="console-trace-svg"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
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

            {/* 6 loaded sector bays */}
            {SECTOR_BAYS.map(({ key, id, label }, index) => (
              <div key={key} className={`console-sector ${key}`}>
                {sectorTiles[index]
                  ? renderSectorTile(sectorTiles[index], renderTile)
                  : (
                    <div className="console-bay-placeholder">
                      <div className="console-bay-crosshair" aria-hidden="true" />
                      <span className="console-bay-id">{id}</span>
                      <span className="console-bay-label">{label}</span>
                    </div>
                  )}
              </div>
            ))}

            {/* Mekhead — persistent archive nucleus */}
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

          {/* Lower support rail — secondary */}
          <div className="console-aux-grid">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="console-aux-slot">
                {auxTiles[i]
                  ? renderTile(auxTiles[i])
                  : <div className="console-aux-empty" />}
              </div>
            ))}
          </div>
        </div>
      )}
      <TilePicker
        open={pickerIndex !== null}
        availableTiles={tilePickerOptions}
        onSelect={addTile}
        onClose={() => setPickerIndex(null)}
      />
    </div>
  )
}
