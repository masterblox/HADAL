import { useState, useEffect, useCallback } from 'react'

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
  location?: { lat?: number; lng?: number; country?: string }
  casualties?: { military?: number; civilian?: number }
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

export interface PipelineData {
  prices: PriceData | null
  incidents: Incident[]
  airspace: AirspaceData | null
}

async function fetchWithFallback<T>(primary: string, fallback: string): Promise<T | null> {
  try {
    const r = await fetch(primary + '?t=' + Date.now())
    if (!r.ok) throw new Error(String(r.status))
    return await r.json() as T
  } catch {
    try {
      const r2 = await fetch(fallback + '?t=' + Date.now())
      if (!r2.ok) throw new Error(String(r2.status))
      return await r2.json() as T
    } catch {
      return null
    }
  }
}

export function useDataPipeline() {
  const [data, setData] = useState<PipelineData>({ prices: null, incidents: [], airspace: null })

  const refresh = useCallback(async () => {
    const [pricesRaw, incidentsRaw, airspace] = await Promise.all([
      fetchWithFallback<{ prices?: PriceData }>('public/prices.json', 'prices.json'),
      fetchWithFallback<{ incidents?: Incident[] }>('public/incidents.json', 'incidents.json'),
      fetchWithFallback<AirspaceData>('public/airspace.json', 'airspace.json'),
    ])
    setData({
      prices: pricesRaw?.prices ?? null,
      incidents: incidentsRaw?.incidents ?? [],
      airspace,
    })
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 60000)
    return () => clearInterval(id)
  }, [refresh])

  return data
}
