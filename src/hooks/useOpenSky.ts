/* ══════════════════════════════════════════════════════════
   useOpenSky — live aircraft data from hardened OpenSky proxy
   Ported from Gulf Watch upstream reliability patterns.

   - Fetches from /api/aircraft every 30s
   - Falls back to demo data on failure
   - Tracks data source status: LIVE / STALE / OFFLINE / SIMULATED
   ══════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { DemoFlight } from '@/data/demo-flights'
import { demoFlights } from '@/data/demo-flights'

export type OpenSkyStatus = 'LIVE' | 'STALE' | 'OFFLINE' | 'SIMULATED'

export interface OpenSkyState {
  flights: DemoFlight[]
  status: OpenSkyStatus
  lastUpdate: number
  error: string | null
  source: 'opensky' | 'demo'
}

const REFRESH_MS = 30_000 // 30s — matches proxy cache TTL
const STALE_THRESHOLD_MS = 90_000 // data older than 90s = stale
const PROXY_URL = '/api/aircraft'

/* OpenSky state vector indices (from API docs) */
const IDX = {
  ICAO24: 0, CALLSIGN: 1, ORIGIN_COUNTRY: 2,
  LONGITUDE: 5, LATITUDE: 6, BARO_ALT: 7,
  ON_GROUND: 8, VELOCITY: 9, TRUE_TRACK: 10,
  SQUAWK: 14, CATEGORY: 17,
} as const

type FlightType = DemoFlight['type']

function classifyAircraft(callsign: string, category: number | null): FlightType {
  const cs = (callsign || '').trim().toUpperCase()
  // Military patterns
  if (/^(VIPER|FURY|DOOM|TORCH|SPECTRE|REAPER|HAWK|RAPTOR|EAGLE)/.test(cs)) return 'military'
  if (/^(RQ|MQ|RC|E[0-9]|KC|C17|C130|P8|FORTE)/.test(cs)) return 'surveillance'
  // Cargo carriers
  if (/^(FDX|UPS|GTI|CLX|ABW|CKK|BOX|MPH)/.test(cs)) return 'cargo'
  // Category 0 = no info, 4 = heavy (could be mil), etc.
  if (category === 5 || category === 6) return 'military'
  return 'commercial'
}

function normalizeState(state: unknown[]): DemoFlight | null {
  const lat = state[IDX.LATITUDE] as number | null
  const lng = state[IDX.LONGITUDE] as number | null
  if (lat == null || lng == null) return null
  if (state[IDX.ON_GROUND]) return null // skip ground traffic

  const callsign = ((state[IDX.CALLSIGN] as string) || 'UNK').trim()
  const alt = state[IDX.BARO_ALT] as number | null
  const velocity = state[IDX.VELOCITY] as number | null
  const heading = state[IDX.TRUE_TRACK] as number | null
  const squawk = (state[IDX.SQUAWK] as string) || '0000'
  const category = state[IDX.CATEGORY] as number | null
  const country = (state[IDX.ORIGIN_COUNTRY] as string) || ''

  const type = classifyAircraft(callsign, category)

  return {
    callsign: callsign || 'UNK',
    type,
    aircraft: country.slice(0, 3).toUpperCase() || '---',
    lat,
    lng,
    alt: alt ? Math.round(alt / 30.48) : 0, // meters → FL
    speed: velocity ? Math.round(velocity * 1.944) : 0, // m/s → knots
    heading: heading ?? 0,
    squawk,
    origin: country.slice(0, 4).toUpperCase(),
    dest: '---',
  }
}

export function useOpenSky(): OpenSkyState {
  const [state, setState] = useState<OpenSkyState>({
    flights: demoFlights,
    status: 'SIMULATED',
    lastUpdate: 0,
    error: null,
    source: 'demo',
  })
  const retryCount = useRef(0)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    // Abort previous in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(PROXY_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const detail = (body as Record<string, string>).status || `HTTP ${res.status}`
        throw new Error(detail)
      }

      const data = await res.json()
      const cacheHeader = res.headers.get('X-Cache') || ''
      const states: unknown[][] = data?.states || []

      if (states.length === 0) {
        throw new Error('NO_DATA')
      }

      const flights = states
        .map(normalizeState)
        .filter((f): f is DemoFlight => f !== null)

      if (flights.length === 0) {
        throw new Error('NO_AIRBORNE')
      }

      const isStale = cacheHeader === 'STALE'
      retryCount.current = 0

      setState({
        flights,
        status: isStale ? 'STALE' : 'LIVE',
        lastUpdate: Date.now(),
        error: null,
        source: 'opensky',
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') return

      retryCount.current++
      const msg = (err as Error).message

      // If we had live data before, keep it but mark stale
      setState(prev => {
        if (prev.source === 'opensky' && (Date.now() - prev.lastUpdate) < STALE_THRESHOLD_MS) {
          return { ...prev, status: 'STALE', error: msg }
        }
        // Fall back to demo
        return {
          flights: demoFlights,
          status: prev.source === 'opensky' ? 'OFFLINE' : 'SIMULATED',
          lastUpdate: prev.lastUpdate,
          error: msg,
          source: 'demo',
        }
      })
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_MS)
    return () => {
      clearInterval(id)
      abortRef.current?.abort()
    }
  }, [fetchData])

  // Track staleness + demo drift in single interval
  useEffect(() => {
    const id = setInterval(() => {
      setState(prev => {
        // Staleness check for live data
        if (prev.source === 'opensky') {
          const age = Date.now() - prev.lastUpdate
          if (age > STALE_THRESHOLD_MS && prev.status === 'LIVE') {
            return { ...prev, status: 'STALE' as const }
          }
          return prev
        }
        // Demo drift: animate positions for visual realism
        return {
          ...prev,
          flights: prev.flights.map(f => {
            const rad = f.heading * Math.PI / 180
            const d = 0.012 + Math.random() * 0.008
            return {
              ...f,
              lat: f.lat + d * Math.cos(rad),
              lng: f.lng + d * Math.sin(rad) / Math.cos(f.lat * Math.PI / 180),
              heading: f.heading + (Math.random() - 0.5) * 3,
              speed: f.speed + Math.floor((Math.random() - 0.5) * 6),
              alt: f.alt + Math.floor((Math.random() - 0.5) * 4),
            }
          }),
        }
      })
    }, 8000)
    return () => clearInterval(id)
  }, [])

  return state
}
