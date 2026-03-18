import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { type DemoFlight } from '@/data/demo-flights'
import { useOpenSky, type OpenSkyStatus } from '@/hooks/useOpenSky'

/* ── colour by type ── */
const TYPE_COL: Record<DemoFlight['type'], string> = {
  commercial:   'rgba(196,255,44,.8)',
  military:     'rgba(255,140,0,.9)',
  cargo:        'rgba(120,200,255,.7)',
  surveillance: 'rgba(255,60,60,.85)',
}

const TYPE_LABEL: Record<DemoFlight['type'], string> = {
  commercial: 'CIV', military: 'MIL', cargo: 'CGO', surveillance: 'ISR',
}

/* ── aircraft chevron SVG ── */
function chevronSvg(heading: number, col: string) {
  return `<div style="transform:rotate(${heading}deg);width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M9 2 L15 14 L9 10 L3 14 Z" fill="${col.replace(/[\d.]+\)$/, '.25)')}" stroke="${col}" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>
  </div>`
}

/* ── heading trail (dashed line behind aircraft) ── */
function trailPts(lat: number, lng: number, heading: number, len: number): [number, number][] {
  const rad = ((heading + 180) % 360) * Math.PI / 180
  const pts: [number, number][] = []
  for (let i = 0; i <= 4; i++) {
    const d = (i / 4) * len
    pts.push([lat + d * Math.cos(rad), lng + d * Math.sin(rad) / Math.cos(lat * Math.PI / 180)])
  }
  return pts
}

/* ── flight ticker strip ── */
function FlightTicker({ flights }: { flights: DemoFlight[] }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % flights.length), 2800)
    return () => clearInterval(id)
  }, [flights.length])

  const f = flights[idx]
  const col = TYPE_COL[f.type]
  return (
    <div className="ft-ticker">
      <span className="ft-ticker-tag" style={{ borderColor: col, color: col }}>{TYPE_LABEL[f.type]}</span>
      <span className="ft-ticker-cs" style={{ color: col }}>{f.callsign}</span>
      <span className="ft-ticker-ac">{f.aircraft}</span>
      <span className="ft-ticker-sep">·</span>
      <span className="ft-ticker-v">FL{f.alt}</span>
      <span className="ft-ticker-v">{f.speed}kt</span>
      <span className="ft-ticker-v">{f.heading}°</span>
      <span className="ft-ticker-sep">·</span>
      <span className="ft-ticker-rt">{f.origin} → {f.dest}</span>
      <span className="ft-ticker-sq">SQ {f.squawk}</span>
    </div>
  )
}

/* ── status badge colour ── */
const STATUS_COL: Record<OpenSkyStatus, string> = {
  LIVE: 'var(--g)',
  STALE: 'var(--warn)',
  OFFLINE: 'rgba(255,60,60,.85)',
  SIMULATED: 'var(--g3)',
}

/* ── MAIN ── */
export function FlightTracker() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])


  // Live data from OpenSky proxy (falls back to demo with drift)
  const openSky = useOpenSky()
  const flights = openSky.flights

  // Stable tooltip builder
  const buildTooltip = useCallback((f: DemoFlight) => {
    const col = TYPE_COL[f.type]
    return `<div class="ft-tip"><span style="color:${col};font-weight:700;">${f.callsign}</span> <span style="opacity:.5">${f.aircraft}</span><br/>FL${f.alt} · ${f.speed}kt · ${f.heading.toFixed(0)}°<br/><span style="opacity:.4">${f.origin} → ${f.dest}</span></div>`
  }, [])

  // Init map
  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return

    const map = L.map(mapRef.current, {
      center: [27, 50],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
      minZoom: 4,
      maxZoom: 10,
    })
    mapInstance.current = map

    // Dark green-tinted tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      className: 'ft-tiles',
    }).addTo(map)

    // Zoom control bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    return () => { map.remove(); mapInstance.current = null }
  }, [])

  // Update markers when flights change
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    // Remove old trails
    map.eachLayer(l => { if (l instanceof L.Polyline && !(l instanceof L.Polygon)) map.removeLayer(l) })

    flights.forEach(f => {
      const col = TYPE_COL[f.type]

      // heading trail
      const trail = trailPts(f.lat, f.lng, f.heading, 0.5)
      L.polyline(trail, {
        color: col.replace(/[\d.]+\)$/, '.2)'),
        weight: 1,
        dashArray: '3 4',
      }).addTo(map)

      // aircraft marker
      const icon = L.divIcon({
        html: chevronSvg(f.heading, col),
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
      const marker = L.marker([f.lat, f.lng], { icon })
        .addTo(map)
        .bindTooltip(buildTooltip(f), {
          direction: 'right',
          offset: [12, 0],
          className: 'ft-tooltip',
          permanent: false,
        })
      markersRef.current.push(marker)
    })
  }, [flights, buildTooltip])

  // Counts
  const counts = {
    total: flights.length,
    civ: flights.filter(f => f.type === 'commercial').length,
    mil: flights.filter(f => f.type === 'military').length,
    cgo: flights.filter(f => f.type === 'cargo').length,
    isr: flights.filter(f => f.type === 'surveillance').length,
  }

  return (
    <div className="ft-section sev-nominal">
      <div className="ft-header jp-panel-header">
        <div className="HDR-DOT jp-status-dot active" style={{
          background: openSky.status === 'LIVE' ? 'var(--g)' : openSky.status === 'STALE' ? 'var(--warn)' : 'var(--g3)',
        }} />
        <span className="ft-title">AIRSPACE TRACKER</span>
        <span className="ft-count">{counts.total} TRACKS</span>
        <div className="ft-legend">
          <span className="ft-leg-item" style={{ color: TYPE_COL.commercial }}>● CIV {counts.civ}</span>
          <span className="ft-leg-item" style={{ color: TYPE_COL.military }}>● MIL {counts.mil}</span>
          <span className="ft-leg-item" style={{ color: TYPE_COL.cargo }}>● CGO {counts.cgo}</span>
          <span className="ft-leg-item" style={{ color: TYPE_COL.surveillance }}>● ISR {counts.isr}</span>
        </div>
        <span className="prov-badge" style={{ marginLeft: 'auto', color: STATUS_COL[openSky.status] }}>{openSky.status}</span>
      </div>

      <div className="ft-body">
        <div ref={mapRef} className="ft-map" />
      </div>

      <FlightTicker flights={flights} />
    </div>
  )
}
