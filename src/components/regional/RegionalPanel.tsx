import { useState, useEffect } from 'react'

/* ── types ── */
interface CountryStats {
  flag: string
  name: string
  trend: string
  casualties: { total: number; military: number; civilian: number }
  missiles: { launched: number; intercepted: number; landed: number }
  airstrikes: { total: number }
  drones: { total: number; downed: number }
  incidents: { type: string; title: string; casualties: number }[]
}

interface RegionalData {
  lastUpdated: string
  regional: {
    casualties: { total: number; military: number; civilian: number }
    missiles: { launched: number; intercepted: number; landed: number }
    airstrikes: { total: number }
    drones: { total: number; downed: number }
  }
  countries: Record<string, CountryStats>
}

/* ── country list ── */
const COUNTRIES = [
  { code: 'all', display: 'ALL' },
  { code: 'uae', display: 'UAE' },
  { code: 'saudi', display: 'SAUDI' },
  { code: 'qatar', display: 'QATAR' },
  { code: 'kuwait', display: 'KUWAIT' },
  { code: 'bahrain', display: 'BAHRAIN' },
  { code: 'oman', display: 'OMAN' },
  { code: 'israel', display: 'ISRAEL' },
  { code: 'iran', display: 'IRAN' },
  { code: 'lebanon', display: 'LEBANON' },
  { code: 'palestine', display: 'GAZA' },
  { code: 'syria', display: 'SYRIA' },
  { code: 'yemen', display: 'YEMEN' },
  { code: 'iraq', display: 'IRAQ' },
]

const TYPE_LABELS: Record<string, string> = {
  missile: 'MSL', airstrike: 'AIR', drone: 'UAV', general: 'INC',
}

export function RegionalPanel() {
  const [selected, setSelected] = useState('all')
  const [data, setData] = useState<RegionalData | null>(null)

  useEffect(() => {
    const load = () => {
      fetch(`/data/regional_stats.json?t=${Date.now()}`)
        .catch(() => fetch(`public/data/regional_stats.json?t=${Date.now()}`))
        .then(r => r.json())
        .then(setData)
        .catch(() => {})
    }
    load()
    const iv = setInterval(load, 300000) // 5min
    return () => clearInterval(iv)
  }, [])

  const country = selected !== 'all' && data ? data.countries[selected] : null

  return (
    <section className="regional-section jp-panel">
      {/* Header */}
      <div className="regional-header jp-panel-header">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 8 }}>
          <circle cx="7" cy="7" r="6" stroke="var(--g3)" strokeWidth="1" />
          <path d="M2 5h10M2 9h10M7 1c-2 2-2 10 0 12M7 1c2 2 2 10 0 12" stroke="var(--g3)" strokeWidth=".7" fill="none" />
        </svg>
        <span className="regional-title section-title">REGIONAL ANALYSIS</span>
      </div>

      {/* Filter Pills */}
      <div className="filter-pills">
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            className={`filter-pill ${selected === c.code ? 'active' : ''}`}
            onClick={() => setSelected(c.code)}
          >
            {c.display}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      {data && selected === 'all' && (
        <div className="regional-stats-grid">
          <StatBox label="CASUALTIES" value={data.regional.casualties.total} detail={`${data.regional.casualties.military} mil / ${data.regional.casualties.civilian} civ`} />
          <StatBox label="MISSILES" value={data.regional.missiles.launched} detail={`${data.regional.missiles.intercepted} int / ${data.regional.missiles.landed} land`} />
          <StatBox label="AIRSTRIKES" value={data.regional.airstrikes.total} detail="total strikes" />
          <StatBox label="DRONES" value={data.regional.drones.total} detail={`${data.regional.drones.downed} downed`} />
        </div>
      )}

      {/* Country View */}
      {country && (
        <div className="country-view">
          <div className="country-header-row">
            <span className="country-flag">{country.flag}</span>
            <span className="country-name">{country.name}</span>
            <span className={`trend-badge ${country.trend}`}>{country.trend.toUpperCase()}</span>
          </div>

          <div className="regional-stats-grid">
            <StatBox label="CASUALTIES" value={country.casualties.total} detail={`${country.casualties.military} mil / ${country.casualties.civilian} civ`} />
            <StatBox label="MISSILES" value={country.missiles.launched} detail={`${country.missiles.intercepted} int / ${country.missiles.landed} land`} />
            <StatBox label="AIRSTRIKES" value={country.airstrikes.total} detail="total strikes" />
            <StatBox label="DRONES" value={country.drones.total} detail={`${country.drones.downed} downed`} />
          </div>

          {country.incidents.length > 0 && (
            <div className="recent-events">
              <div className="events-header">RECENT EVENTS ({country.incidents.length})</div>
              {country.incidents.slice().reverse().slice(0, 8).map((inc, i) => (
                <div key={i} className="event-row">
                  <span className={`event-type-badge ${inc.type}`}>
                    {TYPE_LABELS[inc.type] || inc.type.toUpperCase().slice(0, 3)}
                  </span>
                  <span className="event-title">{inc.title}</span>
                  {inc.casualties > 0 && <span className="event-casualties">{inc.casualties}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data && (
        <div className="regional-updated">
          Updated: {new Date(data.lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {!data && (
        <div className="regional-loading">LOADING REGIONAL DATA...</div>
      )}
    </section>
  )
}

/* ── StatBox ── */
function StatBox({ label, value, detail }: {
  label: string
  value: number
  detail: string
}) {
  return (
    <div className="stat-box jp-panel">
      <div className="stat-label jp-stat-lbl">{label}</div>
      <div className="stat-value jp-stat-val">{value.toLocaleString()}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  )
}
