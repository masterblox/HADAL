import type { AirspaceData } from '@/hooks/useDataPipeline'

interface AirspaceTabProps {
  airspace: AirspaceData | null
}

const SEV_COLORS: Record<string, string> = {
  CRITICAL: 'rgba(255,140,0,.9)',
  WARNING: 'rgba(255,140,0,.7)',
  ELEVATED: 'rgba(255,140,0,.5)',
  INFORMATION: 'var(--g5)',
}

const SEV_ICONS: Record<string, string> = {
  CRITICAL: '■ CLOSED',
  WARNING: '◆ RESTRICTED',
  ELEVATED: '◆ ELEVATED',
  INFORMATION: '● OPEN',
}

export function AirspaceTab({ airspace }: AirspaceTabProps) {
  const rows = airspace?.notams?.map(n => ({
    country: n.country ?? '—',
    status: SEV_ICONS[n.severity ?? ''] ?? '● NORMAL',
    col: SEV_COLORS[n.severity ?? ''] ?? 'var(--g5)',
    date: n.valid_until ? new Date(n.valid_until).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—',
    fl: n.category ?? '—',
    src: n.icao ?? 'NOTAM',
  }))

  const hasData = rows && rows.length > 0

  return (
    <div className="iwl-tabcontent active">
      <div className="iwl-section-h">REGIONAL AIRSPACE STATUS</div>
      <p style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-small)',color:'var(--g3)',marginBottom:'14px'}}>
        {hasData
          ? `Live tracking: ${airspace!.total_notams ?? 0} NOTAMs · ${(airspace!.severity_counts?.CRITICAL ?? 0) + (airspace!.severity_counts?.WARNING ?? 0)} critical/warning · ${airspace!.airports_tracked ?? 0} airports monitored.`
          : 'Airspace data unavailable — awaiting pipeline.'}
      </p>
      {hasData ? (
        <table className="iwl-table">
          <thead><tr><th>COUNTRY</th><th>STATUS</th><th>LAST UPDATED</th><th>FLIGHT LEVEL</th><th>SOURCE</th></tr></thead>
          <tbody>
            {rows!.map(r => (
              <tr key={r.country}><td>{r.country}</td><td style={{color:r.col}}>{r.status}</td><td>{r.date}</td><td>{r.fl}</td><td>{r.src}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-small)',color:'var(--g3)',padding:'24px 0',textAlign:'center',borderTop:'1px solid var(--g07)',borderBottom:'1px solid var(--g07)'}}>
          NO LIVE AIRSPACE DATA — AWAITING PIPELINE
        </div>
      )}
    </div>
  )
}
