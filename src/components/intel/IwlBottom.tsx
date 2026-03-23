import { useState, useEffect } from 'react'
import type { DemoFlight } from '@/data/demo-flights'

/* ── Aircraft type labels/colors for ticker ── */
const TYPE_COL: Record<DemoFlight['type'], string> = {
  commercial: 'rgba(218,255,74,.8)',
  military: 'rgba(255,140,0,.9)',
  cargo: 'rgba(120,200,255,.7)',
  surveillance: 'rgba(255,60,60,.85)',
}
const TYPE_LABEL: Record<DemoFlight['type'], string> = {
  commercial: 'CIV', military: 'MIL', cargo: 'CGO', surveillance: 'ISR',
}

/* ── Flight ticker (ported from FlightTracker) ── */
function FlightTicker({ flights }: { flights: DemoFlight[] }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (flights.length === 0) return
    const id = setInterval(() => setIdx(i => (i + 1) % flights.length), 2800)
    return () => clearInterval(id)
  }, [flights.length])

  if (flights.length === 0) return null
  const f = flights[idx % flights.length]
  if (!f) return null
  const col = TYPE_COL[f.type]
  return (
    <div className="ft-ticker" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-micro)', fontFamily: 'var(--MONO)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
      <span className="ft-ticker-tag" style={{ borderColor: col, color: col, border: '1px solid', padding: '0 3px', fontSize: '8px', lineHeight: '14px' }}>{TYPE_LABEL[f.type]}</span>
      <span style={{ color: col, fontWeight: 700 }}>{f.callsign}</span>
      <span style={{ color: 'var(--g3)' }}>{f.aircraft}</span>
      <span style={{ color: 'var(--g15)' }}>&middot;</span>
      <span style={{ color: 'var(--g5)' }}>FL{f.alt}</span>
      <span style={{ color: 'var(--g5)' }}>{f.speed}kt</span>
      <span style={{ color: 'var(--g5)' }}>{f.heading}&deg;</span>
      <span style={{ color: 'var(--g15)' }}>&middot;</span>
      <span style={{ color: 'var(--g3)' }}>{f.origin} &rarr; {f.dest}</span>
    </div>
  )
}

interface IwlBottomProps {
  datalinkText: string
  onExportSitrep?: () => void
  flights?: DemoFlight[]
}

export function IwlBottom({ datalinkText, onExportSitrep, flights }: IwlBottomProps) {
  return (
    <div className="iwl-bottom">
      <div className="iwl-datalink">
        <span className="iwl-datalink-indicator">&#9608;</span>
        <span>{datalinkText || 'PIPELINE STATUS UNKNOWN'}</span>
      </div>
      <div className="iwl-bot-div" />
      {flights && flights.length > 0 && (
        <>
          <FlightTicker flights={flights} />
          <div className="iwl-bot-div" />
        </>
      )}
      <button className="iwl-export-btn" onClick={onExportSitrep} disabled={!onExportSitrep}>
        &#11015; EXPORT TACTICAL SITREP
      </button>
    </div>
  )
}
