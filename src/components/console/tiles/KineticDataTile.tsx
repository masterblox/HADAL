import { useMemo } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'

function classifyType(title: string): 'missile' | 'drone' | 'cruise' | 'other' {
  const t = (title || '').toLowerCase()
  if (/\bcruise\b/i.test(t)) return 'cruise'
  if (/\b(drone|uav)\b/i.test(t)) return 'drone'
  if (/\b(missile|ballistic|intercept)\b/i.test(t)) return 'missile'
  return 'other'
}

export function KineticDataTile({ incidents }: { incidents: Incident[] }) {
  const rows = useMemo(() => {
    const countries = ['United Arab Emirates', 'Kuwait', 'Qatar', 'Bahrain']
    return countries.map(country => {
      const scoped = incidents.filter(incident => (incident.location?.country ?? '').toLowerCase() === country.toLowerCase())
      const missile = scoped.filter(incident => classifyType(incident.title ?? '') === 'missile').length
      const drone = scoped.filter(incident => classifyType(incident.title ?? '') === 'drone').length
      const cruise = scoped.filter(incident => classifyType(incident.title ?? '') === 'cruise').length
      return {
        country: country === 'United Arab Emirates' ? 'UAE' : country.toUpperCase(),
        missile,
        drone,
        cruise,
        total: missile + drone + cruise,
      }
    })
  }, [incidents])

  const total = rows.reduce((sum, row) => sum + row.total, 0)

  return (
    <div className="console-kinetic">
      <div className="console-kinetic-head">
        <span>KINETIC LOAD</span>
        <b>{total}</b>
      </div>
      <div className="console-kinetic-list">
        {rows.map(row => (
          <div key={row.country} className="console-kinetic-row">
            <span>{row.country}</span>
            <span>B {row.missile}</span>
            <span>C {row.cruise}</span>
            <span>D {row.drone}</span>
            <b>{row.total}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
