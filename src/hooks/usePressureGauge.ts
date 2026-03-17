import { useState, useEffect } from 'react'

export function usePressureGauge(incidentCount: number) {
  const [pressure, setPressure] = useState(10924)
  useEffect(() => {
    const id = setInterval(() => {
      const base = incidentCount > 0 ? 10924 + incidentCount : 10924
      setPressure(base + Math.floor(Math.random() * 3 - 1))
    }, 2200)
    return () => clearInterval(id)
  }, [incidentCount])
  return pressure
}
