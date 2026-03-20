/* ══════════════════════════════════════════════════════════
   STAGE 1 — NORMALIZE PREDICTION INPUTS
   Maps raw Incident[] → NormalizedEvent[]
   Actor/action extraction from Gulf Watch legacy.
   ══════════════════════════════════════════════════════════ */

import type { Incident } from '../../hooks/useDataPipeline'
import type { NormalizedEvent, EventType } from './types'

// ── Keyword tables (from Gulf Watch GulfPredictor) ──

const ACTOR_KEYWORDS: Record<string, string[]> = {
  houthi: ['houthi', 'houthis'],
  israel: ['israel', 'israeli', 'idf'],
  iran: ['iran', 'iranian', 'irgc'],
  saudi: ['saudi', 'arabia', 'ksa'],
  uae: ['uae', 'emirates', 'emirati'],
  us: ['us', 'usa', 'american', 'pentagon'],
  uk: ['uk', 'british', 'britain'],
  yemen: ['yemen', 'yemeni'],
  hezbollah: ['hezbollah', 'hizbullah'],
  hamas: ['hamas'],
  isis: ['isis', 'islamic state', 'daesh'],
}

const TARGET_KEYWORDS: Record<string, string[]> = {
  oil_facility: ['oil', 'refinery', 'pipeline', 'aramco', 'petroleum'],
  military_base: ['military', 'base', 'airbase', 'camp'],
  civilian_area: ['civilian', 'residential', 'city', 'town'],
  shipping: ['shipping', 'tanker', 'cargo', 'merchant'],
  naval_vessel: ['warship', 'destroyer', 'frigate', 'navy vessel'],
  infrastructure: ['infrastructure', 'power', 'water', 'grid'],
  airport: ['airport', 'airfield'],
  port: ['port', 'harbor', 'harbour'],
}

// ── Type weights for severity calculation ──

const TYPE_WEIGHTS: Record<EventType, number> = {
  missile: 85,
  airstrike: 80,
  drone: 70,
  ground: 60,
  naval: 55,
  cyber: 40,
  diplomatic: 20,
  general: 30,
}

// ── Word-boundary matcher for classification ──

function matchesWord(text: string, word: string): boolean {
  const re = new RegExp(`\\b${word}\\b`, 'i')
  return re.test(text)
}

// ── Map raw incident type string → EventType ──
// Uses structured `type` field first, falls back to title analysis

function mapEventType(raw?: string): EventType {
  if (!raw) return 'general'
  const lower = raw.toLowerCase()
  // Exact type field matches (structured data — preferred)
  const typeMap: Record<string, EventType> = {
    missile: 'missile', ballistic: 'missile', 'ballistic missile': 'missile',
    airstrike: 'airstrike', air_strike: 'airstrike', 'air strike': 'airstrike',
    drone: 'drone', uav: 'drone', 'drone strike': 'drone',
    ground: 'ground', raid: 'ground', 'ground operation': 'ground',
    naval: 'naval', maritime: 'naval',
    cyber: 'cyber', 'cyber attack': 'cyber',
    diplomatic: 'diplomatic', sanction: 'diplomatic', sanctions: 'diplomatic',
  }
  if (typeMap[lower]) return typeMap[lower]
  // Fallback: word-boundary search on raw string
  if (matchesWord(lower, 'missile') || matchesWord(lower, 'ballistic')) return 'missile'
  if (matchesWord(lower, 'airstrike') || matchesWord(lower, 'air.strike')) return 'airstrike'
  if (matchesWord(lower, 'drone') || matchesWord(lower, 'uav')) return 'drone'
  if (matchesWord(lower, 'ground') || matchesWord(lower, 'raid')) return 'ground'
  if (matchesWord(lower, 'naval') || matchesWord(lower, 'maritime')) return 'naval'
  if (matchesWord(lower, 'cyber')) return 'cyber'
  if (matchesWord(lower, 'diplomatic') || matchesWord(lower, 'sanction')) return 'diplomatic'
  return 'general'
}

// ── Extract actor from title using word boundaries ──

function extractFromTitle(title: string, keywords: Record<string, string[]>): string {
  for (const [key, kw] of Object.entries(keywords)) {
    if (kw.some(k => matchesWord(title, k))) return key
  }
  return 'unknown'
}

// ── Compute severity score ──

function computeSeverity(type: EventType, credibility: number, casualties: { military: number; civilian: number }): number {
  const base = TYPE_WEIGHTS[type]
  const credMult = Math.max(0.3, credibility / 100)
  const casualtyBonus = Math.min(20, (casualties.military + casualties.civilian * 2) * 2)
  return Math.min(100, Math.round(base * credMult + casualtyBonus))
}

// ── Main normalization ──

export function normalizeIncidents(incidents: Incident[], windowDays = 14): NormalizedEvent[] {
  const cutoff = Date.now() - windowDays * 86400000
  const sorted: NormalizedEvent[] = []

  for (const inc of incidents) {
    const ts = inc.published ? new Date(inc.published).getTime() : 0
    if (ts < cutoff || ts === 0) continue

    const title = inc.title || ''
    const type = mapEventType(inc.type)
    const actor = extractFromTitle(title, ACTOR_KEYWORDS)
    const target = extractFromTitle(title, TARGET_KEYWORDS)
    const country = (inc.location?.country || 'unknown').toLowerCase()
    const credibility = inc.credibility ?? 50
    const casualties = {
      military: inc.casualties?.military ?? 0,
      civilian: inc.casualties?.civilian ?? 0,
    }
    const isGov = inc.is_government ?? false
    const verificationScore = credibility + (isGov ? 20 : 0)

    const severity = computeSeverity(type, credibility, casualties)
    const impactPct = Math.round(severity * Math.min(1, verificationScore / 100))

    sorted.push({
      id: `ev-${ts}-${sorted.length}`,
      timestamp: ts,
      type,
      actor,
      target,
      country,
      severity,
      impactPct,
      verificationScore: Math.min(100, verificationScore),
      isGovernment: isGov,
      casualties,
      responseHours: null, // computed below
    })
  }

  // Sort chronologically
  sorted.sort((a, b) => a.timestamp - b.timestamp)

  // Compute responseHours: time until next event of same type in same country
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (sorted[j].country === sorted[i].country && sorted[j].type === sorted[i].type) {
        sorted[i].responseHours = (sorted[j].timestamp - sorted[i].timestamp) / 3600000
        break
      }
    }
  }

  return sorted
}
