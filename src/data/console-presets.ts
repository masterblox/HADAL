export type ConsoleTileId =
  | 'threat-signal'
  | 'globe'
  | 'market-impact'
  | 'tempo'
  | 'intelligence'
  | 'threat-feed'
  | 'scenario-outlook'
  | 'airspace'
  | 'confidence'
  | 'kinetic-data'
  | 'theatre-exchange'
  | 'analysis-summary'
  | 'event-timeline'
  | 'geographic-concentration'
  | 'type-profile'
  | 'feed-quality'

export interface ConsoleLayoutPreset {
  id: string
  label: string
  slots: Array<ConsoleTileId | null>
}

export const CONSOLE_TILE_ORDER: ConsoleTileId[] = [
  'threat-signal',
  'globe',
  'market-impact',
  'airspace',
  'tempo',
  'intelligence',
  'kinetic-data',
  'scenario-outlook',
  'threat-feed',
  'theatre-exchange',
  'confidence',
  'analysis-summary',
  'event-timeline',
  'geographic-concentration',
  'type-profile',
  'feed-quality',
]

export const CONSOLE_PRESETS: ConsoleLayoutPreset[] = [
  {
    id: 'shift-brief',
    label: 'SHIFT BRIEF',
    slots: [
      'threat-signal', 'globe', 'scenario-outlook', 'threat-feed',
      'kinetic-data', 'airspace', 'theatre-exchange', 'confidence',
      'market-impact', 'tempo', 'intelligence', 'analysis-summary',
    ],
  },
  {
    id: 'incident-focus',
    label: 'INCIDENT FOCUS',
    slots: [
      'threat-feed', 'kinetic-data', 'scenario-outlook', 'globe',
      'theatre-exchange', 'confidence', 'threat-signal', 'airspace',
      'tempo', 'intelligence', 'analysis-summary', 'market-impact',
    ],
  },
  {
    id: 'air-picture',
    label: 'AIR PICTURE',
    slots: [
      'globe', 'airspace', 'threat-signal', 'scenario-outlook',
      'theatre-exchange', 'confidence', 'threat-feed', 'kinetic-data',
      'market-impact', 'tempo', 'intelligence', 'analysis-summary',
    ],
  },
  {
    id: 'analysis-stack',
    label: 'ANALYSIS STACK',
    slots: [
      'event-timeline', 'geographic-concentration', 'type-profile', 'feed-quality',
      'analysis-summary', 'scenario-outlook', 'threat-signal', 'confidence',
      'threat-feed', 'tempo', 'intelligence', 'market-impact',
    ],
  },
]

export const DEFAULT_CONSOLE_PRESET = CONSOLE_PRESETS[0]
