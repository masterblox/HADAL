import type { AirspaceData } from '@/hooks/useDataPipeline'

interface AirspaceTabProps {
  airspace: AirspaceData | null
}

const staticData = [
  {country:'IRAN',status:'■ CLOSED',col:'rgba(255,140,0,.9)',date:'MAR 10, 03:14 UTC',fl:'ALL',src:'NOTAM'},
  {country:'IRAQ',status:'■ CLOSED',col:'rgba(255,140,0,.9)',date:'MAR 09, 21:00 UTC',fl:'ALL',src:'NOTAM'},
  {country:'YEMEN',status:'■ CLOSED',col:'rgba(255,140,0,.9)',date:'MAR 01, 00:00 UTC',fl:'ALL',src:'ICAO'},
  {country:'JORDAN',status:'◆ RESTRICTED',col:'rgba(255,140,0,.7)',date:'MAR 08, 18:30 UTC',fl:'FL200–FL400',src:'RJAC'},
  {country:'UAE',status:'◆ RESTRICTED',col:'rgba(255,140,0,.7)',date:'MAR 10, 06:00 UTC',fl:'PARTIAL',src:'GCAA'},
  {country:'QATAR',status:'◆ RESTRICTED',col:'rgba(255,140,0,.7)',date:'MAR 03, 14:00 UTC',fl:'PARTIAL',src:'CAA'},
  {country:'KUWAIT',status:'● OPEN',col:'var(--g5)',date:'MAR 07, 08:00 UTC',fl:'ALL',src:'DGCA'},
  {country:'SAUDI ARABIA',status:'● OPEN',col:'var(--g5)',date:'MAR 06, 12:00 UTC',fl:'ALL',src:'GACA'},
  {country:'BAHRAIN',status:'◆ RESTRICTED',col:'rgba(255,140,0,.7)',date:'MAR 05, 09:00 UTC',fl:'FL000–FL100',src:'CAA'},
  {country:'OMAN',status:'● OPEN',col:'var(--g5)',date:'MAR 08, 00:00 UTC',fl:'ALL',src:'CAA'},
]

export function AirspaceTab({ airspace }: AirspaceTabProps) {
  const sevColors: Record<string, string> = {CRITICAL:'rgba(255,140,0,.9)',WARNING:'rgba(255,140,0,.7)',ELEVATED:'rgba(255,140,0,.5)',INFORMATION:'var(--g5)'}
  const sevIcons: Record<string, string> = {CRITICAL:'■ CLOSED',WARNING:'◆ RESTRICTED',ELEVATED:'◆ ELEVATED',INFORMATION:'● OPEN'}

  const rows = airspace?.notams?.map(n => ({
    country: n.country ?? '—',
    status: sevIcons[n.severity ?? ''] ?? '● NORMAL',
    col: sevColors[n.severity ?? ''] ?? 'var(--g5)',
    date: n.valid_until ? new Date(n.valid_until).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—',
    fl: n.category ?? '—',
    src: n.icao ?? 'NOTAM',
  })) ?? staticData

  return (
    <div className="iwl-tabcontent active">
      <div className="iwl-section-h">REGIONAL AIRSPACE STATUS</div>
      <p className="iwl-section-intro">
        {airspace?.notams
          ? `Live tracking: ${airspace.total_notams ?? 0} NOTAMs · ${(airspace.severity_counts?.CRITICAL ?? 0) + (airspace.severity_counts?.WARNING ?? 0)} critical/warning · ${airspace.airports_tracked ?? 0} airports monitored.`
          : 'Live tracking of commercial airspace closures and flight restrictions.'}
      </p>
      <table className="iwl-table">
        <thead><tr><th>COUNTRY</th><th>STATUS</th><th>LAST UPDATED</th><th>FLIGHT LEVEL</th><th>SOURCE</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.country}><td>{r.country}</td><td style={{color:r.col}}>{r.status}</td><td>{r.date}</td><td>{r.fl}</td><td>{r.src}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
