import { useMemo } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'

export function AnalysisSummaryTile({ incidents }: { incidents: Incident[] }) {
  const stats = useMemo(() => {
    let kinetic = 0
    let casualties = 0
    const countries = new Set<string>()
    for (const incident of incidents) {
      const t = (incident.type || incident.title || '').toLowerCase()
      if (['missile', 'airstrike', 'drone'].some(keyword => t.includes(keyword))) kinetic++
      casualties += incident.casualties?.total ?? 0
      if (incident.location?.country) countries.add(incident.location.country)
    }
    return { total: incidents.length, kinetic, casualties, countries: countries.size }
  }, [incidents])

  const items = [
    { label: 'TOTAL', value: stats.total },
    { label: 'KINETIC', value: stats.kinetic },
    { label: 'CASUALTIES', value: stats.casualties },
    { label: 'COUNTRIES', value: stats.countries },
  ]

  return (
    <div className="console-analysis-summary">
      {items.map(item => (
        <div key={item.label} className="console-analysis-card">
          <span>{item.label}</span>
          <b>{item.value}</b>
        </div>
      ))}
    </div>
  )
}
