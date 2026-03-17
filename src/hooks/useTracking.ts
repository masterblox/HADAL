import { useState, useEffect, useCallback } from 'react'

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
}

// Simulated tracking data — replace with real endpoints when available
// GulfWatch used: /aircraft.json, /satellites.json, /maritime.json

const GULF_CENTER = { lat: 25, lng: 54 }
const SPREAD = 8

function randomInGulf(): { lat: number; lng: number } {
  return {
    lat: GULF_CENTER.lat + (Math.random() - 0.5) * SPREAD * 2,
    lng: GULF_CENTER.lng + (Math.random() - 0.5) * SPREAD * 2,
  }
}

const CALLSIGNS_AIR = ['UAE721', 'QTR44', 'BAW116', 'EK412', 'SVA306', 'KAC513', 'GFA210', 'OMA652', 'RJ182', 'ETH707', 'THY803', 'ACA091']
const CALLSIGNS_SAT = ['NROL-82', 'COSMO-4', 'SAR-LUP3', 'WGS-10', 'GSSAP-6', 'SBIRS-5', 'MUSIS-1', 'CSO-3']
const CALLSIGNS_MAR = ['STENA-IMP', 'MSC-ELMA', 'EVER-ACE', 'AL-MARJAN', 'HAFNIA-PHX', 'NISSOS-KOS', 'TORM-LOKE', 'CRUDE-SKY']

function generateSeed(): TrackedObject[] {
  const objs: TrackedObject[] = []
  // Aircraft
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
  // Satellites
  for (let i = 0; i < 4; i++) {
    const pos = randomInGulf()
    objs.push({
      id: `S${i}`,
      type: 'satellite',
      callsign: CALLSIGNS_SAT[i % CALLSIGNS_SAT.length],
      ...pos,
      alt: 400000 + Math.floor(Math.random() * 200000),
      speed: 7200 + Math.floor(Math.random() * 600),
      heading: Math.floor(Math.random() * 360),
      lastSeen: Date.now() - Math.floor(Math.random() * 30000),
    })
  }
  // Maritime
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
    const d = o.type === 'aircraft' ? 0.02 : o.type === 'satellite' ? 0.05 : 0.005
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

export function useTracking(): TrackingState {
  const [objects, setObjects] = useState<TrackedObject[]>(() => generateSeed())
  const [status, setStatus] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE')

  const update = useCallback(() => {
    setObjects(prev => drift(prev))
    // Occasionally toggle status for realism
    setStatus(Math.random() > 0.92 ? 'DEGRADED' : 'ONLINE')
  }, [])

  useEffect(() => {
    const iv = setInterval(update, 10000) // 10s refresh like GulfWatch
    return () => clearInterval(iv)
  }, [update])

  const counts = {
    aircraft: objects.filter(o => o.type === 'aircraft').length,
    satellite: objects.filter(o => o.type === 'satellite').length,
    maritime: objects.filter(o => o.type === 'maritime').length,
  }

  return { objects, counts, lastUpdate: Date.now(), status }
}
