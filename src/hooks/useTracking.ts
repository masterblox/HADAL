import { useState, useEffect, useCallback } from 'react'
import { useSatellitePositions } from '@/hooks/useSatellitePositions'
import type { SatellitePosition } from '@/lib/satellite-sgp4'

export interface TrackedObject {
  id: string
  type: 'aircraft' | 'satellite' | 'maritime'
  callsign: string
  lat: number
  lng: number
  alt?: number
  speed?: number
  heading?: number
  lastSeen: number // timestamp
}

interface TrackingState {
  objects: TrackedObject[]
  counts: { aircraft: number; satellite: number; maritime: number }
  lastUpdate: number
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE'
  totalTracked: number
}

// Simulated tracking data for aircraft/maritime — replace with real endpoints when available
// GulfWatch used: /aircraft.json, /maritime.json

const GULF_CENTER = { lat: 25, lng: 54 }
const SPREAD = 8

function randomInGulf(): { lat: number; lng: number } {
  return {
    lat: GULF_CENTER.lat + (Math.random() - 0.5) * SPREAD * 2,
    lng: GULF_CENTER.lng + (Math.random() - 0.5) * SPREAD * 2,
  }
}

const CALLSIGNS_AIR = ['UAE721', 'QTR44', 'BAW116', 'EK412', 'SVA306', 'KAC513', 'GFA210', 'OMA652', 'RJ182', 'ETH707', 'THY803', 'ACA091']
const CALLSIGNS_MAR = ['STENA-IMP', 'MSC-ELMA', 'EVER-ACE', 'AL-MARJAN', 'HAFNIA-PHX', 'NISSOS-KOS', 'TORM-LOKE', 'CRUDE-SKY']

function generateSeed(): TrackedObject[] {
  const objs: TrackedObject[] = []
  // Aircraft (simulated)
  for (let i = 0; i < 8; i++) {
    const pos = randomInGulf()
    objs.push({
      id: `A${i}`,
      type: 'aircraft',
      callsign: CALLSIGNS_AIR[i % CALLSIGNS_AIR.length],
      ...pos,
      alt: 28000 + Math.floor(Math.random() * 14000),
      speed: 380 + Math.floor(Math.random() * 160),
      heading: Math.floor(Math.random() * 360),
      lastSeen: Date.now() - Math.floor(Math.random() * 15000),
    })
  }
  // Maritime (simulated)
  for (let i = 0; i < 5; i++) {
    const pos = randomInGulf()
    objs.push({
      id: `M${i}`,
      type: 'maritime',
      callsign: CALLSIGNS_MAR[i % CALLSIGNS_MAR.length],
      ...pos,
      speed: 8 + Math.floor(Math.random() * 18),
      heading: Math.floor(Math.random() * 360),
      lastSeen: Date.now() - Math.floor(Math.random() * 60000),
    })
  }
  return objs
}

function drift(objs: TrackedObject[]): TrackedObject[] {
  return objs.map(o => {
    // Only drift aircraft and maritime — satellites are SGP4-computed
    if (o.type === 'satellite') return o
    const d = o.type === 'aircraft' ? 0.02 : 0.005
    return {
      ...o,
      lat: o.lat + (Math.random() - 0.5) * d,
      lng: o.lng + (Math.random() - 0.5) * d,
      heading: (o.heading || 0) + Math.floor((Math.random() - 0.5) * 6),
      speed: o.type === 'maritime'
        ? Math.max(4, (o.speed || 12) + Math.floor((Math.random() - 0.5) * 3))
        : o.speed,
      lastSeen: Date.now(),
    }
  })
}

/** Convert SGP4 satellite position → TrackedObject */
function satToTracked(pos: SatellitePosition): TrackedObject {
  return {
    id: `SAT-${pos.noradId}`,
    type: 'satellite',
    callsign: pos.name,
    lat: pos.lat,
    lng: pos.lng,
    alt: pos.alt * 1000, // SGP4 returns km, tracking uses meters-ish display
    speed: Math.round(pos.velocity * 1000), // km/s → m/s for display consistency
    heading: Math.round(pos.heading),
    lastSeen: Date.now(),
  }
}

export function useTracking(): TrackingState {
  const { positions: satPositions } = useSatellitePositions()
  const [simObjects, setSimObjects] = useState<TrackedObject[]>(() => generateSeed())
  const [status, setStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE')
  const [lastUpdate, setLastUpdate] = useState(() => Date.now())

  const update = useCallback(() => {
    setSimObjects(prev => drift(prev))
    setLastUpdate(Date.now())
    setStatus('ONLINE')
  }, [])

  useEffect(() => {
    const iv = setInterval(update, 10000)
    return () => clearInterval(iv)
  }, [update])

  // Merge: simulated aircraft/maritime + real SGP4 satellites
  const satellites = satPositions.map(satToTracked)
  const objects = [...simObjects, ...satellites]

  const counts = {
    aircraft: simObjects.filter(o => o.type === 'aircraft').length,
    satellite: satellites.length,
    maritime: simObjects.filter(o => o.type === 'maritime').length,
  }

  const totalTracked = objects.length

  return { objects, counts, lastUpdate, status, totalTracked }
}
