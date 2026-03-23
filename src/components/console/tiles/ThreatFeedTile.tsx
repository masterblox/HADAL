import type { Incident } from '@/hooks/useDataPipeline'

function severityLabel(incident: Incident) {
  const score = incident.credibility ?? 0
  if (score >= 90) return 'CRITICAL'
  if (score >= 75) return 'HIGH'
  return 'MEDIUM'
}

export function ThreatFeedTile({ incidents }: { incidents: Incident[] }) {
  const queue = incidents.slice(0, 8)

  return (
    <div className="console-feed">
      <div className="console-feed-head">
        <span>ACTIVE QUEUE</span>
        <span>{queue.length} ITEMS</span>
      </div>
      <div className="console-feed-list">
        {queue.map((incident, index) => (
          <div key={`${incident.title ?? 'incident'}-${index}`} className="console-feed-row">
            <span className="console-feed-id">TH-{String(index + 1).padStart(3, '0')}</span>
            <div className="console-feed-main">
              <span className="console-feed-title">{incident.title ?? 'UNKNOWN EVENT'}</span>
              <span className="console-feed-meta">
                {(incident.location?.country ?? 'GULF').toUpperCase()} · {(incident.source ?? 'OSINT').toUpperCase()}
              </span>
            </div>
            <span className={`console-feed-severity ${severityLabel(incident).toLowerCase()}`}>
              {severityLabel(incident)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
