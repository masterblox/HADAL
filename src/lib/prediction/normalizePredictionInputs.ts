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

// ── Map raw incident type string → EventType ──

function mapEventType(raw?: string): EventType {
  if (!raw) return 'general'
  const lower = raw.toLowerCase()
  if (lower.includes('missile')) return 'missile'
  if (lower.includes('airstrike') || lower.includes('air_strike')) return 'airstrike'
  if (lower.includes('drone') || lower.includes('uav')) return 'drone'
  if (lower.includes('ground') || lower.includes('raid')) return 'ground'
  if (lower.includes('naval') || lower.includes('maritime')) return 'naval'
  if (lower.includes('cyber')) return 'cyber'
  if (lower.includes('diplomatic') || lower.includes('sanction')) return 'diplomatic'
  return 'general'
}

// ── Extract actor from title ──

function extractFromTitle(title: string, keywords: Record<string, string[]>): string {
  const lower = title.toLowerCase()
  for (const [key, kw] of Object.entries(keywords)) {
    if (kw.some(k => lower.includes(k))) return key
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
