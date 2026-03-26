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
  | 'verification'
  | 'reports'
  | 'kinetic-data'
  | 'theatre-exchange'
  | 'analysis-summary'
  | 'event-timeline'
  | 'geographic-concentration'
  | 'type-profile'
  | 'feed-quality'
  | 'predictor-engine'
  | 'argus'
  | 'chatter'
  | 'ignite'
  | 'chronos'
  | 'skyline'
  | 'mekhead'
  | 'satellite'
  | 'military-signals'

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
  'verification',
  'reports',
  'analysis-summary',
  'event-timeline',
  'geographic-concentration',
  'type-profile',
  'feed-quality',
  'predictor-engine',
  'military-signals',
  'argus',
  'chatter',
  'ignite',
  'chronos',
  'skyline',
  'mekhead',
  'satellite',
]

export const CONSOLE_PRESETS: ConsoleLayoutPreset[] = [
  {
    id: 'capability-board',
    label: 'CAPABILITY BOARD',
    slots: [
      'threat-signal', 'argus',          'verification',      'feed-quality',
      'airspace',      'ignite',          'chatter',           'skyline',
      'globe',         'scenario-outlook','chronos',           'mekhead',
      'reports',       null,              'kinetic-data',      'threat-feed',
    ],
  },
  {
    id: 'shift-brief',
    label: 'SHIFT BRIEF',
    slots: [
      'threat-signal', 'globe',         'scenario-outlook', 'threat-feed',
      'kinetic-data',  'airspace',      'verification',     'confidence',
      'market-impact', 'tempo',         'intelligence',     'reports',
      null,            null,            null,               null,
    ],
  },
  {
    id: 'incident-focus',
    label: 'INCIDENT FOCUS',
    slots: [
      'threat-feed',   'kinetic-data',  'scenario-outlook', 'globe',
      'verification',  'confidence',    'threat-signal',    'airspace',
      'reports',       'intelligence',  'theatre-exchange', 'market-impact',
      null,            null,            null,               null,
    ],
  },
  {
    id: 'air-picture',
    label: 'AIR PICTURE',
    slots: [
      'globe',         'airspace',      'threat-signal',    'scenario-outlook',
      'verification',  'confidence',    'threat-feed',      'kinetic-data',
      'market-impact', 'tempo',         'intelligence',     'reports',
      null,            null,            null,               null,
    ],
  },
  {
    id: 'analysis-stack',
    label: 'ANALYSIS',
    slots: [
      'event-timeline',   'geographic-concentration', 'type-profile',  'feed-quality',
      'analysis-summary', 'scenario-outlook',          'threat-signal', 'confidence',
      'threat-feed',      'reports',                   'intelligence',  'market-impact',
      'predictor-engine', null,                        null,            null,
    ],
  },
]

export const DEFAULT_CONSOLE_PRESET = CONSOLE_PRESETS.find(preset => preset.id === 'analysis-stack') ?? CONSOLE_PRESETS[0]
