import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { missileEvents, interceptEvents, airstrikeEvents, groundEvents, combatantEvents, diplomaticEvents } from '@/data/map-events'
import { trajectories } from '@/data/trajectories'
import { thaadSites } from '@/data/thaad-sites'
import { airspaceZones } from '@/data/airspace-zones'
import type { Incident } from '@/hooks/useDataPipeline'
import type { DemoFlight } from '@/data/demo-flights'

/* ── Aircraft rendering helpers (ported from FlightTracker) ── */
const AIRCRAFT_COL: Record<DemoFlight['type'], string> = {
  commercial: 'rgba(218,255,74,.8)',
  military: 'rgba(255,140,0,.9)',
  cargo: 'rgba(120,200,255,.7)',
  surveillance: 'rgba(255,60,60,.85)',
}

function chevronSvg(heading: number, col: string) {
  return `<div style="transform:rotate(${heading}deg);width:20px;height:20px;display:flex;align-items:center;justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M9 2 L15 14 L9 10 L3 14 Z" fill="${col.replace(/[\d.]+\)$/, '.25)')}" stroke="${col}" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>
  </div>`
}

function trailPts(lat: number, lng: number, heading: number, len: number): [number, number][] {
  const rad = ((heading + 180) % 360) * Math.PI / 180
  const pts: [number, number][] = []
  for (let i = 0; i <= 4; i++) {
    const d = (i / 4) * len
    pts.push([lat + d * Math.cos(rad), lng + d * Math.sin(rad) / Math.cos(lat * Math.PI / 180)])
  }
  return pts
}

function buildAircraftTooltip(f: DemoFlight) {
  const col = AIRCRAFT_COL[f.type]
  return `<div class="ft-tip"><span style="color:${col};font-weight:700;">${f.callsign}</span> <span style="opacity:.5">${f.aircraft}</span><br/>FL${f.alt} · ${f.speed}kt · ${f.heading.toFixed(0)}\u00b0<br/><span style="opacity:.4">${f.origin} \u2192 ${f.dest}</span></div>`
}

function mkPopup(title: string, type: string, lat: number, lon: number, conf: number, src: string, time: string, detail?: string) {
  const typeColors: Record<string, string> = {missile:'rgba(255,140,0,.9)',airstrike:'rgba(255,130,0,.9)',ground:'rgba(218,255,74,.65)',intercept:'rgba(218,255,74,.9)',combatants:'rgba(218,255,74,.9)',diplomatic:'rgba(180,120,255,.9)'}
  const col = typeColors[type] || 'rgba(218,255,74,.8)'
  return `<div class="iwl-popup"><div class="iwl-popup-head"><div class="iwl-popup-dot" style="background:${col};box-shadow:0 0 6px ${col};"></div><span class="iwl-popup-title">${title}</span></div><div class="iwl-popup-grid"><span class="iwl-popup-k">TYPE</span><span class="iwl-popup-v">${type.toUpperCase()}</span><span class="iwl-popup-k">COORDS</span><span class="iwl-popup-v">${lat.toFixed(4)}°N ${lon.toFixed(4)}°E</span><span class="iwl-popup-k">CONFIDENCE</span><span class="iwl-popup-v">${conf}%</span><span class="iwl-popup-k">SOURCE</span><span class="iwl-popup-v">${src}</span><span class="iwl-popup-k">TIME</span><span class="iwl-popup-v">${time}</span></div>${detail ? `<div class="iwl-popup-detail">${detail}</div>` : ''}</div>`
}

interface LeafletMapProps {
  layerVisibility: Record<string, boolean>
  incidents: Incident[]
  flights?: DemoFlight[]
  onSyncUpdate: (s: string) => void
  onDatalinkUpdate: (s: string) => void
}

interface AircraftEntry {
  marker: L.Marker
  trail: L.Polyline
  type: DemoFlight['type']
}

export function LeafletMap({ layerVisibility, incidents, flights, onSyncUpdate, onDatalinkUpdate }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const layerGroups = useRef<Record<string, L.LayerGroup>>({})
  const syncUpdateRef = useRef(onSyncUpdate)
  const datalinkUpdateRef = useRef(onDatalinkUpdate)
  const aircraftCache = useRef<Map<string, AircraftEntry>>(new Map())
  const lastAircraftGroup = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    syncUpdateRef.current = onSyncUpdate
    datalinkUpdateRef.current = onDatalinkUpdate
  }, [onSyncUpdate, onDatalinkUpdate])

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return

    const map = L.map(mapRef.current, {
      center: [28, 46], zoom: 5, zoomControl: true, attributionControl: false, minZoom: 3, maxZoom: 12,
    })
    mapInstance.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map)

    const groups: Record<string, L.LayerGroup> = {}
    ;['missile','airstrike','ground','intercept','combatants','diplomatic','airspace-lyr','live-incidents','aircraft'].forEach(n => {
      groups[n] = L.layerGroup().addTo(map)
    })
    layerGroups.current = groups

    // ── LIVE INCIDENT MARKERS (Gulf Watch pipeline) ──
    incidents.forEach(inc => {
      const lat = inc.location?.lat
      const lng = inc.location?.lng
      if (lat == null || lng == null) return

      const title = inc.title || 'Unknown event'
      const cred = inc.credibility ?? 50
      const isCritical = cred >= 90
      const isHigh = cred >= 70
      const col = isCritical ? 'rgba(255,60,60,.9)' : isHigh ? 'rgba(255,140,0,.9)' : 'rgba(218,255,74,.8)'
      const d = (Math.random() * 2).toFixed(2)
      const html = `<div style="position:relative;width:16px;height:16px;cursor:pointer;"><div class="iwl-ripple-ring" style="inset:-4px;border-color:${col.replace('.9','.4').replace('.8','.3')};animation-delay:${d}s;"></div><svg width="16" height="16" viewBox="0 0 16 16" style="position:absolute;inset:0;"><circle cx="8" cy="8" r="4" fill="${col.replace('.9','.15').replace('.8','.1')}" stroke="${col}" stroke-width="1.5"/><circle cx="8" cy="8" r="1.5" fill="${col}"/></svg></div>`
      const icon = L.divIcon({ html, className: '', iconSize: [16, 16], iconAnchor: [8, 8] })
      const source = inc.source || 'OSINT'
      const time = inc.published ? new Date(inc.published).toISOString().slice(0, 16).replace('T', ' ') : '—'
      const country = inc.location?.country || '—'
      L.marker([lat, lng], { icon }).addTo(groups['live-incidents'])
        .bindPopup(mkPopup(title, inc.type || 'event', lat, lng, cred, source, time, `Country: ${country}`), { maxWidth: 280 })
        .bindTooltip(`<b style="color:${col}">${title.slice(0, 60)}</b>`, { direction: 'top', offset: [0, -10] })
    })

    // Missile markers
    missileEvents.forEach(e => {
      const d = (Math.random() * 2).toFixed(2)
      const html = `<div style="position:relative;width:20px;height:20px;cursor:pointer;"><div class="iwl-ripple-ring" style="inset:-4px;border-color:rgba(255,140,0,.6);animation-delay:${d}s;"></div><svg width="20" height="20" viewBox="0 0 20 20" style="position:absolute;inset:0;"><circle cx="10" cy="10" r="5" fill="rgba(255,140,0,.15)" stroke="rgba(255,140,0,.9)" stroke-width="1.5"/><circle cx="10" cy="10" r="2" fill="rgba(255,140,0,1)"/></svg></div>`
      const icon = L.divIcon({ html, className: '', iconSize: [20, 20], iconAnchor: [10, 10] })
      L.marker([e.lat, e.lon], { icon }).addTo(groups['missile'])
        .bindPopup(mkPopup(e.title, 'missile', e.lat, e.lon, e.conf!, e.src!, e.time!), { maxWidth: 280 })
        .bindTooltip(`<b style="color:rgba(255,140,0,.9)">⚠ ${e.title}</b>`, { direction: 'top', offset: [0, -10] })
    })

    // Intercept markers
    interceptEvents.forEach(e => {
      const html = `<div style="position:relative;width:16px;height:16px;cursor:pointer;"><div class="iwl-ripple-ring" style="inset:-5px;border-color:rgba(218,255,74,.35);"></div><svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1 15,8 8,15 1,8" fill="rgba(218,255,74,.12)" stroke="rgba(218,255,74,.85)" stroke-width="1.5"/><line x1="5" y1="5" x2="11" y2="11" stroke="rgba(218,255,74,.9)" stroke-width="1.2"/><line x1="11" y1="5" x2="5" y2="11" stroke="rgba(218,255,74,.9)" stroke-width="1.2"/></svg></div>`
      const icon = L.divIcon({ html, className: '', iconSize: [16, 16], iconAnchor: [8, 8] })
      L.marker([e.lat, e.lon], { icon }).addTo(groups['intercept'])
        .bindPopup(mkPopup(e.title, 'intercept', e.lat, e.lon, e.conf!, e.src!, e.time!, e.detail), { maxWidth: 280 })
    })

    // Airstrike markers
    airstrikeEvents.forEach(e => {
      const html = `<div style="position:relative;width:18px;height:18px;cursor:pointer;animation:iwl-pulse 2s infinite;"><svg width="18" height="18" viewBox="0 0 18 18"><polygon points="9,1 17,16 1,16" fill="rgba(255,120,0,.2)" stroke="rgba(255,140,0,.9)" stroke-width="1.5"/></svg></div>`
      const icon = L.divIcon({ html, className: '', iconSize: [18, 18], iconAnchor: [9, 16] })
      L.marker([e.lat, e.lon], { icon }).addTo(groups['airstrike'])
        .bindPopup(mkPopup(e.title, 'airstrike', e.lat, e.lon, e.conf!, e.src!, e.time!, e.detail), { maxWidth: 280 })
    })

    // Ground markers
    groundEvents.forEach(e => {
      const html = `<svg width="14" height="14" viewBox="0 0 14 14" style="cursor:pointer;"><rect x="1" y="1" width="12" height="12" fill="rgba(218,255,74,.06)" stroke="rgba(218,255,74,.5)" stroke-width="1.5"/><line x1="4" y1="7" x2="10" y2="7" stroke="rgba(218,255,74,.55)" stroke-width="1.2"/><line x1="7" y1="4" x2="7" y2="10" stroke="rgba(218,255,74,.55)" stroke-width="1.2"/></svg>`
      const icon = L.divIcon({ html, className: '', iconSize: [14, 14], iconAnchor: [7, 7] })
      L.marker([e.lat, e.lon], { icon }).addTo(groups['ground'])
        .bindTooltip(`<span style="color:rgba(218,255,74,.65)">${e.title}</span>`)
    })

    // Combatant markers
    combatantEvents.forEach(e => {
      const html = `<svg width="16" height="16" viewBox="0 0 16 16" style="cursor:pointer;animation:iwl-pulse 3s infinite;"><polygon points="8,1 15,8 8,15 1,8" fill="rgba(218,255,74,.15)" stroke="rgba(218,255,74,.8)" stroke-width="1.5"/></svg>`
      const icon = L.divIcon({ html, className: '', iconSize: [16, 16], iconAnchor: [8, 8] })
      L.marker([e.lat, e.lon], { icon }).addTo(groups['combatants'])
        .bindPopup(mkPopup(e.title, 'combatants', e.lat, e.lon, 95, 'CENTCOM', 'LIVE', e.detail), { maxWidth: 280 })
    })

    // Diplomatic markers
    diplomaticEvents.forEach(e => {
      const html = `<svg width="14" height="14" viewBox="0 0 14 14" style="cursor:pointer;"><polygon points="7,1 13,5 11,13 3,13 1,5" fill="rgba(180,120,255,.1)" stroke="rgba(180,120,255,.6)" stroke-width="1.2"/></svg>`
      const icon = L.divIcon({ html, className: '', iconSize: [14, 14], iconAnchor: [7, 7] })
      L.marker([e.lat, e.lon], { icon }).addTo(groups['diplomatic'])
        .bindTooltip(`<span style="color:rgba(180,120,255,.8)">${e.title}</span>`)
    })

    // Trajectories
    function arcPts(o: number[], t: number[], steps: number, bulge: number) {
      const pts: [number, number][] = []
      for (let i = 0; i <= steps; i++) {
        const r = i / steps
        pts.push([o[0] + (t[0] - o[0]) * r + Math.sin(r * Math.PI) * bulge * .3, o[1] + (t[1] - o[1]) * r])
      }
      return pts
    }
    trajectories.forEach(tr => {
      const isBallistic = tr.type === 'ballistic'
      const col = isBallistic ? 'rgba(255,140,0,.5)' : 'rgba(255,130,0,.5)'
      const pts = arcPts(tr.o, tr.t, 50, isBallistic ? 4 : 1.5)
      L.polyline(pts, { color: col, weight: isBallistic ? 2 : 1.4, dashArray: isBallistic ? undefined : '5 4', opacity: .8 })
        .addTo(groups['missile'])
        .bindTooltip(`<span style="font-size:var(--fs-micro);">${tr.label} · CONF ${tr.conf}%</span>`)
    })

    // THAAD rings
    thaadSites.forEach(s => {
      const dead = ['DESTROYED', 'HIT'].includes(s.status)
      L.circle([s.lat, s.lon], {
        radius: 150000,
        color: dead ? 'rgba(255,140,0,.35)' : 'rgba(218,255,74,.25)', weight: 1,
        fillColor: dead ? 'rgba(255,140,0,.04)' : 'rgba(218,255,74,.03)', fillOpacity: 1,
        dashArray: dead ? '4 6' : '',
      }).addTo(groups['missile'])
        .bindTooltip(`THAAD · ${s.label} · ${s.status}`, { sticky: true })
    })

    // Airspace zones
    airspaceZones.forEach(z => {
      L.polygon(z.poly, {
        color: z.closed ? 'rgba(255,140,0,.35)' : 'rgba(255,140,0,.25)', weight: 1,
        fillColor: z.closed ? 'rgba(255,20,20,.06)' : 'rgba(255,140,0,.04)', fillOpacity: 1,
        dashArray: '3 5',
      }).addTo(groups['airspace-lyr'])
        .bindTooltip(`<b>${z.country}</b> · ${z.closed ? 'AIRSPACE CLOSED' : 'RESTRICTED'}`, { sticky: true })
    })

    // Status reflects actual pipeline state
    if (incidents.length > 0) {
      syncUpdateRef.current(`OSINT PIPELINE · ${incidents.length} EVENTS LOADED`)
      datalinkUpdateRef.current(`PIPELINE ACTIVE · ${incidents.length} INCIDENTS · ${new Date().toISOString().slice(0, 16)}Z`)
    } else {
      syncUpdateRef.current('OSINT PIPELINE · NO LIVE DATA')
      datalinkUpdateRef.current('PIPELINE OFFLINE · STATIC REFERENCE OVERLAYS ONLY')
    }

    return () => { map.remove(); mapInstance.current = null }
  }, [incidents.length])

  // Sync layer visibility
  useEffect(() => {
    const map = mapInstance.current
    const groups = layerGroups.current
    if (!map) return
    Object.entries(layerVisibility).forEach(([name, visible]) => {
      const lyr = groups[name]
      if (!lyr) return
      if (visible && !map.hasLayer(lyr)) map.addLayer(lyr)
      if (!visible && map.hasLayer(lyr)) map.removeLayer(lyr)
    })
  }, [layerVisibility])

  // Aircraft markers + heading trails — keyed by callsign, updated in place
  useEffect(() => {
    const map = mapInstance.current
    const group = layerGroups.current['aircraft']
    if (!map || !group) return

    const cache = aircraftCache.current

    // Map was recreated (incidents.length changed) — old layer refs are dead
    if (group !== lastAircraftGroup.current) {
      cache.clear()
      lastAircraftGroup.current = group
    }

    const seen = new Set<string>()

    if (flights && flights.length > 0) {
      for (const f of flights) {
        seen.add(f.callsign)
        const col = AIRCRAFT_COL[f.type]
        const existing = cache.get(f.callsign)

        if (existing) {
          // Position — cheap CSS transform via Leaflet
          existing.marker.setLatLng([f.lat, f.lng])

          // Heading — rotate the icon's inner div directly (no DOM rebuild)
          const el = existing.marker.getElement()
          if (el) {
            const inner = el.firstElementChild as HTMLElement | null
            if (inner) inner.style.transform = `rotate(${f.heading}deg)`
          }

          // Trail path update
          existing.trail.setLatLngs(trailPts(f.lat, f.lng, f.heading, 0.5))

          // Tooltip content
          existing.marker.setTooltipContent(buildAircraftTooltip(f))

          // Type change (rare — live reclassification) — requires icon + trail color rebuild
          if (existing.type !== f.type) {
            existing.marker.setIcon(L.divIcon({
              html: chevronSvg(f.heading, col),
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }))
            existing.trail.setStyle({ color: col.replace(/[\d.]+\)$/, '.2)') })
            existing.type = f.type
          }
        } else {
          // New aircraft — create marker + trail
          const trail = L.polyline(trailPts(f.lat, f.lng, f.heading, 0.5), {
            color: col.replace(/[\d.]+\)$/, '.2)'),
            weight: 1,
            dashArray: '3 4',
          }).addTo(group)

          const icon = L.divIcon({
            html: chevronSvg(f.heading, col),
            className: '',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })
          const marker = L.marker([f.lat, f.lng], { icon })
            .addTo(group)
            .bindTooltip(buildAircraftTooltip(f), {
              direction: 'right',
              offset: [12, 0],
              className: 'ft-tooltip',
              permanent: false,
            })

          cache.set(f.callsign, { marker, trail, type: f.type })
        }
      }
    }

    // Remove aircraft that left the airspace
    for (const [callsign, entry] of cache) {
      if (!seen.has(callsign)) {
        group.removeLayer(entry.marker)
        group.removeLayer(entry.trail)
        cache.delete(callsign)
      }
    }
  }, [flights, incidents.length])

  return <div ref={mapRef} id="iwl-map" />
}
