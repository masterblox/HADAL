import type { AirspaceData } from '@/hooks/useDataPipeline'

export function AirspaceTile({ airspace }: { airspace: AirspaceData | null }) {
  const notams = airspace?.notams?.slice(0, 4) ?? []
  const severityCounts = airspace?.severity_counts ?? {}
  const critical = (severityCounts.critical ?? 0) + (severityCounts.high ?? 0)

  return (
    <div className="console-airspace">
      <div className="console-airspace-grid">
        <div className="console-airspace-cell">
          <span>NOTAMS</span>
          <b>{airspace?.total_notams ?? 0}</b>
        </div>
        <div className="console-airspace-cell warn">
          <span>CRIT/HIGH</span>
          <b>{critical}</b>
        </div>
        <div className="console-airspace-cell">
          <span>AIRPORTS</span>
          <b>{airspace?.airports_tracked ?? 0}</b>
        </div>
        <div className="console-airspace-cell">
          <span>STATE</span>
          <b>{critical > 0 ? 'CONTESTED' : 'GUARDED'}</b>
        </div>
      </div>
      <div className="console-airspace-list">
        {notams.map((notam, index) => (
          <div key={`${notam.country ?? 'zone'}-${index}`} className="console-airspace-row">
            <span>{(notam.country ?? 'REGION').toUpperCase()}</span>
            <span>{(notam.category ?? 'NOTAM').toUpperCase()}</span>
            <span className={/CRITICAL|WARNING/i.test(notam.severity ?? '') ? 'warn' : ''}>
              {(notam.severity ?? 'INFO').toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
