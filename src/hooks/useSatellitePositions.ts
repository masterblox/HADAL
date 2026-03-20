import { useState, useEffect, useRef } from 'react'
import { SATELLITE_DATABASE } from '@/data/satellite-tle'
import { getAllPositions, getVisibleSatellites } from '@/lib/satellite-sgp4'
import type { SatellitePosition } from '@/lib/satellite-sgp4'

export interface SatelliteState {
  positions: SatellitePosition[]
  visible: SatellitePosition[]
  lastComputed: number
  count: number
}

// Gulf-centre observer for visibility filtering
const OBS_LAT = 25
const OBS_LON = 54
const MIN_ELEVATION = 5 // degrees above horizon

const DEFAULT_REFRESH_MS = 30_000

export function useSatellitePositions(refreshMs = DEFAULT_REFRESH_MS): SatelliteState {
  const [state, setState] = useState<SatelliteState>(() => {
    const positions = getAllPositions(SATELLITE_DATABASE)
    const visible = getVisibleSatellites(positions, OBS_LAT, OBS_LON, MIN_ELEVATION)
    return { positions, visible, lastComputed: Date.now(), count: positions.length }
  })

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const compute = () => {
      const positions = getAllPositions(SATELLITE_DATABASE)
      const visible = getVisibleSatellites(positions, OBS_LAT, OBS_LON, MIN_ELEVATION)
      setState({ positions, visible, lastComputed: Date.now(), count: positions.length })
    }

    intervalRef.current = setInterval(compute, refreshMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refreshMs])

  return state
}
