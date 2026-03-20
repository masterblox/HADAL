/* ══════════════════════════════════════════════════════════
   Runtime validation schemas for HADAL data pipeline.
   Uses Zod to catch malformed API responses before they
   propagate through the UI as undefined/NaN artifacts.
   ══════════════════════════════════════════════════════════ */

import { z } from 'zod'

// ── Incidents ──

export const LocationSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  country: z.string().optional(),
  name: z.string().optional(),
}).optional()

export const CasualtiesSchema = z.object({
  military: z.number().optional(),
  civilian: z.number().optional(),
  total: z.number().optional(),
}).optional()

export const IncidentSchema = z.object({
  title: z.string().optional(),
  type: z.string().optional(),
  source: z.string().optional(),
  source_url: z.string().optional(),
  credibility: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
  is_government: z.boolean().optional(),
  published: z.string().optional(),
  location: LocationSchema,
  casualties: CasualtiesSchema,
})

export const IncidentsPayloadSchema = z.object({
  incidents: z.array(IncidentSchema).optional(),
})

// ── Prices ──

const PriceEntrySchema = z.object({
  price: z.number(),
  change: z.number(),
  formatted_change: z.string().optional(),
  updated_at: z.string().optional(),
})

export const PricesPayloadSchema = z.object({
  prices: z.object({
    brent: PriceEntrySchema.optional(),
    gold: PriceEntrySchema.optional(),
    gas: PriceEntrySchema.optional(),
    bitcoin: PriceEntrySchema.optional(),
  }).optional(),
})

// ── Airspace ──

const NotamSchema = z.object({
  country: z.string().optional(),
  severity: z.string().optional(),
  valid_until: z.string().optional(),
  category: z.string().optional(),
  icao: z.string().optional(),
})

export const AirspacePayloadSchema = z.object({
  notams: z.array(NotamSchema).optional(),
  total_notams: z.number().optional(),
  severity_counts: z.record(z.string(), z.number()).optional(),
  airports_tracked: z.number().optional(),
})

// ── Verified Incidents ──

const CircuitBreakerSchema = z.object({
  event_id: z.string().optional(),
  incident_type: z.string().optional(),
  is_recap: z.boolean().optional(),
  confidence: z.string().optional(),
})

const VerifiedIncidentSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  source: z.string().optional(),
  source_url: z.string().optional(),
  published: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  location: LocationSchema,
  credibility: z.number().optional(),
  is_government: z.boolean().optional(),
  casualties: z.object({
    total: z.number().optional(),
    military: z.number().optional(),
    civilian: z.number().optional(),
  }).optional(),
  circuit_breaker: CircuitBreakerSchema.optional(),
})

const VerifiedGroupSchema = z.object({
  id: z.string(),
  primary_incident: VerifiedIncidentSchema,
  num_sources: z.number(),
  verification_badge: z.string(),
  verification_score: z.number(),
  government_sources: z.array(z.unknown()),
  news_sources: z.array(z.unknown()),
  type: z.string().optional(),
})

export const VerifiedIncidentsPayloadSchema = z.object({
  generated_at: z.string(),
  total_groups: z.number(),
  verification_summary: z.record(z.string(), z.number()),
  groups: z.array(VerifiedGroupSchema),
})

// ── Safe parse helper ──

export function safeParse<T>(schema: z.ZodType<T>, data: unknown, label: string): { data: T | null; error: string | null } {
  const result = schema.safeParse(data)
  if (result.success) return { data: result.data, error: null }
  const issues = result.error.issues.slice(0, 3).map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
  console.warn(`[HADAL Schema] ${label} validation failed:`, issues)
  return { data: null, error: `${label} schema: ${issues}` }
}
