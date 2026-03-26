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

const STORAGE_KEY = 'hadal-console-layout-v6'

interface StoredLayoutState {
  presetId: string
  slots: Array<ConsoleTileId | null>
  custom: boolean
}

type TileStatus = 'live' | 'stale' | 'offline'

const TILE_META: Record<ConsoleTileId, { title: string; icon: string; source: string; updated: string; status?: TileStatus }> = {
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
  'military-signals': { title: 'MILITARY SIGNALS', icon: '▶', source: 'PROCEDURAL SHELL', updated: 'NO DATA', status: 'offline' },
}

function freshnessLabel(status: TileStatus, liveLabel: string, staleLabel = 'STALE', offlineLabel = 'NO DATA') {
  if (status === 'live') return liveLabel
  if (status === 'stale') return staleLabel
  return offlineLabel
}

function predictionStatus(health: PipelineHealth): TileStatus {
  if (health.incidents === 'offline') return 'offline'
  if (health.incidents === 'stale' || health.prices === 'stale' || health.airspace === 'stale') return 'stale'
  return 'live'
}

function deriveShellStatus(base: TileStatus): TileStatus {
  return base === 'offline' ? 'offline' : 'stale'
}

function resolveTileMeta(tileId: ConsoleTileId, health: PipelineHealth): { title: string; icon: string; source: string; updated: string; status?: TileStatus } {
  const base = TILE_META[tileId]
  switch (tileId) {
    case 'threat-signal':
    case 'globe':
    case 'kinetic-data':
    case 'analysis-summary':
    case 'event-timeline':
    case 'geographic-concentration':
    case 'type-profile':
    case 'feed-quality':
      return { ...base, source: 'INCIDENTS', updated: freshnessLabel(health.incidents, '60S'), status: health.incidents }
    case 'market-impact':
      return { ...base, source: 'PRICES', updated: freshnessLabel(health.prices, '60S'), status: health.prices }
    case 'airspace':
      return { ...base, source: 'AIRSPACE', updated: freshnessLabel(health.airspace, '60S'), status: health.airspace }
    case 'threat-feed':
      return { ...base, source: health.verified === 'offline' ? 'RAW INCIDENTS' : 'VERIFIED / RAW', updated: freshnessLabel(health.incidents, '60S'), status: health.incidents }
    case 'verification':
      return { ...base, source: 'VERIFIED INCIDENTS', updated: freshnessLabel(health.verified, '60S'), status: health.verified }
    case 'confidence':
      return { ...base, source: 'VERIFICATION PROXY', updated: freshnessLabel(health.verified, '60S'), status: deriveShellStatus(health.verified) }
    case 'tempo':
    case 'intelligence':
    case 'scenario-outlook':
    case 'predictor-engine': {
      const status = predictionStatus(health)
      return { ...base, source: tileId === 'predictor-engine' ? 'SEQUENCE MODEL' : 'DERIVED MODEL', updated: freshnessLabel(status, 'LOCAL'), status }
    }
    case 'theatre-exchange':
      return { ...base, source: 'DERIVED / INCIDENTS', updated: freshnessLabel(health.incidents, 'LOCAL'), status: health.incidents }
    case 'reports':
      return { ...base, source: health.incidents === 'offline' ? 'NO LIVE INPUT' : 'MODEL + INCIDENTS', updated: freshnessLabel(health.incidents, 'LOCAL'), status: health.incidents }
    case 'argus':
    case 'chatter':
    case 'chronos': {
      const status = deriveShellStatus(health.incidents)
      return { ...base, updated: freshnessLabel(status, 'DERIVED'), status }
    }
    case 'ignite': {
      const status = deriveShellStatus(health.incidents)
      return { ...base, source: health.incidents === 'offline' ? 'UPSTREAM MODULE' : 'UPSTREAM PROXY', updated: freshnessLabel(status, 'DERIVED'), status }
    }
    case 'skyline':
      return { ...base, source: 'UPSTREAM MODULE', updated: 'NO DATA', status: 'offline' }
    case 'mekhead':
    case 'satellite':
      return { ...base, updated: 'STATIC', status: 'stale' }
    case 'military-signals':
      return { ...base, source: 'PROCEDURAL SHELL', updated: 'NO DATA', status: 'offline' }
    default:
      return base
  }
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

export function ConsolePage({
  sandbox,
  onSandboxToggle,
  threatLevel: _threatLevel,
  pipelineStatus,
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

  const effectivePresetId = presetId
  const effectivePresetLabel = presetLabel

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
              {tileId ? (() => {
                const meta = resolveTileMeta(tileId, pipelineStatus.health)
                return (
                  <ConsoleTile
                    icon={meta.icon}
                    title={meta.title}
                    source={meta.source}
                    updated={meta.updated}
                    status={meta.status}
                    editMode={sandbox}
                    onRemove={sandbox ? () => removeTile(index) : undefined}
                  >
                    {renderTile(tileId)}
                  </ConsoleTile>
                )
              })() : (
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
        <div className="console-grid console-grid--view">
          {slots.map((tileId, index) => (
            <div
              key={tileId ? `${tileId}-${index}` : `empty-${index}`}
              className={`console-slot${tileId ? ` console-workbench-slot tile-${tileId}` : ' console-slot--placeholder'}`}
            >
              {tileId ? (() => {
                const meta = resolveTileMeta(tileId, pipelineStatus.health)
                return (
                  <ConsoleTile
                    icon={meta.icon}
                    title={meta.title}
                    source={meta.source}
                    updated={meta.updated}
                    status={meta.status}
                    editMode={false}
                  >
                    {renderTile(tileId)}
                  </ConsoleTile>
                )
              })() : (
                <div className="console-empty-slot" aria-hidden="true" />
              )}
            </div>
          ))}
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
