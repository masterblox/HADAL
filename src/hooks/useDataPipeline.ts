import { useState, useEffect, useCallback } from 'react'
import {
  safeParse,
  IncidentsPayloadSchema,
  PricesPayloadSchema,
  AirspacePayloadSchema,
  VerifiedIncidentsPayloadSchema,
} from '@/lib/pipeline-schemas'

export interface PriceData {
  brent?: { price: number; change: number; formatted_change?: string; updated_at?: string }
  gold?: { price: number; change: number; formatted_change?: string }
  gas?: { price: number; change: number; formatted_change?: string }
  bitcoin?: { price: number; change: number; formatted_change?: string }
}

export interface Incident {
  title?: string
  type?: string
  source?: string
  source_url?: string
  credibility?: number
  status?: string
  is_government?: boolean
  published?: string
  location?: { lat?: number; lng?: number; country?: string; name?: string }
  casualties?: { military?: number; civilian?: number; total?: number }
  // Enrichment from verified_incidents.json
  verificationBadge?: 'VERIFIED' | 'LIKELY' | 'PARTIAL' | 'UNCONFIRMED'
  verificationScore?: number
  numSources?: number
  circuitBreaker?: { eventId?: string; incidentType?: string; isRecap?: boolean; confidence?: string }
}

export interface AirspaceData {
  notams?: Array<{
    country?: string
    severity?: string
    valid_until?: string
    category?: string
    icao?: string
  }>
  total_notams?: number
  severity_counts?: Record<string, number>
  airports_tracked?: number
}

// Shape of verified_incidents.json groups
interface VerifiedGroup {
  id: string
  primary_incident: {
    id: number
    title?: string
    source?: string
    source_url?: string
    published?: string
    type?: string
    status?: string
    location?: { name?: string; country?: string; lat?: number; lng?: number }
    credibility?: number
    is_government?: boolean
    casualties?: { total?: number; military?: number; civilian?: number }
    circuit_breaker?: { event_id?: string; incident_type?: string; is_recap?: boolean; confidence?: string }
  }
  num_sources: number
  verification_badge: string
  verification_score: number
  government_sources: unknown[]
  news_sources: unknown[]
  type?: string
}

interface VerifiedIncidentsPayload {
  generated_at: string
  total_groups: number
  verification_summary: Record<string, number>
  groups: VerifiedGroup[]
}

function flattenVerifiedGroups(payload: VerifiedIncidentsPayload): Incident[] {
  return payload.groups
    .filter(g => !g.primary_incident.circuit_breaker?.is_recap) // skip recaps
    .map(g => {
      const pi = g.primary_incident
      return {
        title: pi.title,
        type: pi.type,
        source: pi.source,
        source_url: pi.source_url,
        published: pi.published,
        status: pi.status,
        credibility: pi.credibility,
        is_government: pi.is_government,
        location: pi.location ? { lat: pi.location.lat, lng: pi.location.lng, country: pi.location.country, name: pi.location.name } : undefined,
        casualties: pi.casualties ? { military: pi.casualties.military, civilian: pi.casualties.civilian, total: pi.casualties.total } : undefined,
        verificationBadge: g.verification_badge as Incident['verificationBadge'],
        verificationScore: g.verification_score,
        numSources: g.num_sources,
        circuitBreaker: pi.circuit_breaker ? {
          eventId: pi.circuit_breaker.event_id,
          incidentType: pi.circuit_breaker.incident_type,
          isRecap: pi.circuit_breaker.is_recap,
          confidence: pi.circuit_breaker.confidence,
        } : undefined,
      }
    })
}

export interface PipelineHealth {
  incidents: 'live' | 'stale' | 'offline'
  prices: 'live' | 'stale' | 'offline'
  airspace: 'live' | 'stale' | 'offline'
  verified: 'live' | 'stale' | 'offline'
  lastSuccessfulFetch: number | null
  lastAttempt: number | null
  consecutiveFailures: number
  errors: string[]
  verificationSummary: Record<string, number> | null
}

export interface PipelineData {
  prices: PriceData | null
  incidents: Incident[]
  airspace: AirspaceData | null
  health: PipelineHealth
}

const STALE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

async function fetchWithFallback<T>(primary: string, fallback: string): Promise<{ data: T | null; error: string | null }> {
  try {
    const r = await fetch(primary + '?t=' + Date.now())
    if (!r.ok) throw new Error(`HTTP ${r.status} from ${primary}`)
    return { data: await r.json() as T, error: null }
  } catch (e1) {
    const primaryErr = e1 instanceof Error ? e1.message : String(e1)
    try {
      const r2 = await fetch(fallback + '?t=' + Date.now())
      if (!r2.ok) throw new Error(`HTTP ${r2.status} from ${fallback}`)
      return { data: await r2.json() as T, error: null }
    } catch (e2) {
      const fallbackErr = e2 instanceof Error ? e2.message : String(e2)
      return { data: null, error: `${primaryErr}; fallback: ${fallbackErr}` }
    }
  }
}

function computeSourceHealth(data: unknown, lastSuccess: number | null): 'live' | 'stale' | 'offline' {
  if (data === null) return 'offline'
  if (lastSuccess && Date.now() - lastSuccess > STALE_THRESHOLD_MS) return 'stale'
  return 'live'
}

export function useDataPipeline() {
  const [data, setData] = useState<PipelineData>({
    prices: null,
    incidents: [],
    airspace: null,
    health: {
      incidents: 'offline',
      prices: 'offline',
      airspace: 'offline',
      verified: 'offline',
      lastSuccessfulFetch: null,
      lastAttempt: null,
      consecutiveFailures: 0,
      errors: [],
      verificationSummary: null,
    },
  })

  const refresh = useCallback(async () => {
    const now = Date.now()
    const errors: string[] = []

    const [pricesRaw, incidentsRaw, airspaceRaw, verifiedRaw] = await Promise.all([
      fetchWithFallback<unknown>('public/prices.json', 'prices.json'),
      fetchWithFallback<unknown>('public/incidents.json', 'incidents.json'),
      fetchWithFallback<unknown>('public/airspace.json', 'airspace.json'),
      fetchWithFallback<unknown>('public/verified_incidents.json', 'verified_incidents.json'),
    ])

    if (pricesRaw.error) errors.push(`prices: ${pricesRaw.error}`)
    if (incidentsRaw.error) errors.push(`incidents: ${incidentsRaw.error}`)
    if (airspaceRaw.error) errors.push(`airspace: ${airspaceRaw.error}`)
    if (verifiedRaw.error) errors.push(`verified: ${verifiedRaw.error}`)

    // Runtime schema validation — catch malformed API responses
    const pricesValidated = pricesRaw.data ? safeParse(PricesPayloadSchema, pricesRaw.data, 'prices') : { data: null, error: null }
    const incidentsValidated = incidentsRaw.data ? safeParse(IncidentsPayloadSchema, incidentsRaw.data, 'incidents') : { data: null, error: null }
    const airspaceValidated = airspaceRaw.data ? safeParse(AirspacePayloadSchema, airspaceRaw.data, 'airspace') : { data: null, error: null }
    const verifiedValidated = verifiedRaw.data ? safeParse(VerifiedIncidentsPayloadSchema, verifiedRaw.data, 'verified') : { data: null, error: null }

    if (pricesValidated.error) errors.push(pricesValidated.error)
    if (incidentsValidated.error) errors.push(incidentsValidated.error)
    if (airspaceValidated.error) errors.push(airspaceValidated.error)
    if (verifiedValidated.error) errors.push(verifiedValidated.error)

    const prices = pricesValidated.data?.prices as PriceData | null ?? null
    const rawIncidents = (incidentsValidated.data?.incidents ?? []) as Incident[]
    const airspace = airspaceValidated.data as AirspaceData | null

    // Merge: prefer verified groups (richer metadata), fall back to raw incidents
    const verifiedIncidents = verifiedValidated.data ? flattenVerifiedGroups(verifiedValidated.data as VerifiedIncidentsPayload) : []
    const verifiedTitles = new Set(verifiedIncidents.map(v => v.title?.toLowerCase()))
    // Deduplicate: keep verified version, add raw incidents not already covered
    const dedupedRaw = rawIncidents.filter(r => !verifiedTitles.has(r.title?.toLowerCase()))
    const incidents = [...verifiedIncidents, ...dedupedRaw]

    const verificationSummary = (verifiedValidated.data as VerifiedIncidentsPayload | null)?.verification_summary ?? null

    const anySuccess = prices !== null || incidents.length > 0 || airspace !== null
    const allFailed = prices === null && incidents.length === 0 && airspace === null

    if (errors.length > 0) {
      console.warn('[HADAL Pipeline]', errors.join(' | '))
    }

    setData(prev => ({
      prices,
      incidents,
      airspace,
      health: {
        incidents: computeSourceHealth(incidents.length > 0 ? incidents : null, anySuccess ? now : prev.health.lastSuccessfulFetch),
        prices: computeSourceHealth(prices, anySuccess ? now : prev.health.lastSuccessfulFetch),
        airspace: computeSourceHealth(airspace, anySuccess ? now : prev.health.lastSuccessfulFetch),
        verified: computeSourceHealth(verifiedIncidents.length > 0 ? verifiedIncidents : null, anySuccess ? now : prev.health.lastSuccessfulFetch),
        lastSuccessfulFetch: anySuccess ? now : prev.health.lastSuccessfulFetch,
        lastAttempt: now,
        consecutiveFailures: allFailed ? prev.health.consecutiveFailures + 1 : 0,
        errors,
        verificationSummary,
      },
    }))
  }, [])

  useEffect(() => {
    const initialRefresh = setTimeout(() => {
      void refresh()
    }, 0)
    const id = setInterval(refresh, 60000)
    return () => {
      clearTimeout(initialRefresh)
      clearInterval(id)
    }
  }, [refresh])

  return data
}
