import { useEffect, useRef } from 'react'
import { landPolygons, gulfPolygons, iraqPolygons, iranPolygon } from './land-110m'
import type { Incident } from '../hooks/useDataPipeline'

/* ── City / region labels ── */
const LABELS: { lon: number; lat: number; text: string; color: string }[] = [
  { lon: 51.4, lat: 35.7, text: 'TEHRAN', color: 'rgba(255,140,0,.85)' },
  { lon: 59.6, lat: 36.3, text: 'MASHHAD', color: 'rgba(255,140,0,.6)' },
  { lon: 51.7, lat: 32.7, text: 'ISFAHAN', color: 'rgba(255,140,0,.55)' },
  { lon: 55.3, lat: 25.2, text: 'DUBAI', color: 'rgba(218,255,74,.75)' },
  { lon: 54.4, lat: 24.4, text: 'ABU DHABI', color: 'rgba(218,255,74,.65)' },
  { lon: 46.7, lat: 24.6, text: 'RIYADH', color: 'rgba(218,255,74,.55)' },
  { lon: 47.9, lat: 29.4, text: 'KUWAIT', color: 'rgba(218,255,74,.65)' },
  { lon: 51.5, lat: 25.3, text: 'DOHA', color: 'rgba(218,255,74,.6)' },
  { lon: 50.6, lat: 26.2, text: 'BAHRAIN', color: 'rgba(218,255,74,.55)' },
  { lon: 58.4, lat: 23.6, text: 'MUSCAT', color: 'rgba(218,255,74,.55)' },
  { lon: 44.4, lat: 33.3, text: 'BAGHDAD', color: 'rgba(218,255,74,.6)' },
  { lon: 44.2, lat: 15.4, text: 'SANAA', color: 'rgba(218,255,74,.5)' },
  { lon: 56.3, lat: 27.0, text: 'HORMUZ', color: 'rgba(255,140,0,.7)' },
  { lon: 43.3, lat: 12.6, text: 'BAB AL-MANDAB', color: 'rgba(255,140,0,.6)' },
  { lon: 35.5, lat: 33.9, text: 'BEIRUT', color: 'rgba(218,255,74,.5)' },
  { lon: 35.2, lat: 31.8, text: 'JERUSALEM', color: 'rgba(218,255,74,.5)' },
  { lon: 36.3, lat: 33.5, text: 'DAMASCUS', color: 'rgba(218,255,74,.5)' },
]

/* ── Classify incident severity for rendering ── */
function isKinetic(type: string): boolean {
  const t = type.toLowerCase()
  return ['missile', 'airstrike', 'drone', 'strike', 'attack', 'bombing', 'shelling'].some(k => t.includes(k))
}

/* ── Pressure grid: aggregate incidents into geographic cells ── */
interface PressureCell {
  lon: number
  lat: number
  pressure: number
  kineticRatio: number
  count: number
  maxCred: number
  hasVerified: boolean
}

const CELL_DEG = 3

function buildPressureGrid(incidents: Incident[]): PressureCell[] {
  const cells = new Map<string, PressureCell>()
  for (const inc of incidents) {
    const lat = inc.location?.lat
    const lng = inc.location?.lng
    if (lat == null || lng == null) continue
    const cLat = Math.round(lat / CELL_DEG) * CELL_DEG
    const cLon = Math.round(lng / CELL_DEG) * CELL_DEG
    const key = `${cLat},${cLon}`
    const kinetic = isKinetic(inc.type || '')
    const cred = (inc.credibility ?? 50) / 100
    const vMul = inc.verificationBadge === 'VERIFIED' ? 1.5
               : inc.verificationBadge === 'LIKELY' ? 1.2 : 1.0
    const casMul = ((inc.casualties?.total ?? 0) > 0) ? 1.5 : 1.0
    const weight = cred * (kinetic ? 2.5 : 1.0) * vMul * casMul
    if (!cells.has(key)) {
      cells.set(key, { lon: cLon, lat: cLat, pressure: 0, kineticRatio: 0, count: 0, maxCred: 0, hasVerified: false })
    }
    const c = cells.get(key)!
    c.kineticRatio = (c.kineticRatio * c.count + (kinetic ? 1 : 0)) / (c.count + 1)
    c.count++
    c.pressure += weight
    c.maxCred = Math.max(c.maxCred, inc.credibility ?? 50)
    if (inc.verificationBadge === 'VERIFIED') c.hasVerified = true
  }
  return Array.from(cells.values())
}

export function useGlobe(incidents: Incident[] = []) {
  const ref = useRef<HTMLCanvasElement>(null)
  const incidentsRef = useRef<Incident[]>(incidents)
  incidentsRef.current = incidents

  useEffect(() => {
    const C = ref.current
    if (!C) return
    const x = C.getContext('2d')
    if (!x) return
    const W = 560, H = 560, cx = W / 2, cy = H / 2, R = 260, PI = Math.PI

    const Lx = -.55, Ly = -.65, Lz = .52

    let rotY = -50
    let rotX = -15
    let raf: number

    // Mouse drag rotation
    let dragging = false
    let dragStartX = 0
    let dragStartY = 0
    let rotYAtDragStart = 0
    let rotXAtDragStart = 0
    let velocityY = 0
    let velocityX = 0
    let lastDragX = 0
    let lastDragY = 0
    let lastDragTime = 0
    let idleTimer = 0
    const AUTO_SPEED = .048
    const FRICTION = .92
    const IDLE_RESUME_MS = 2000

    // Pressure grid cache
    let cachedGrid: PressureCell[] = []
    let cachedIncRef: Incident[] = []

    // Cached trig values
    let cosRY = 0, sinRY = 0, cosRX = 0, sinRX = 0

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      dragStartX = e.clientX
      dragStartY = e.clientY
      lastDragX = e.clientX
      lastDragY = e.clientY
      lastDragTime = Date.now()
      rotYAtDragStart = rotY
      rotXAtDragStart = rotX
      velocityY = 0
      velocityX = 0
      idleTimer = 0
      C.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const now = Date.now()
      const dx = e.clientX - lastDragX
      const dy = e.clientY - lastDragY
      const dt = Math.max(1, now - lastDragTime)
      velocityY = (dx / dt) * 16 * .3
      velocityX = (dy / dt) * 16 * -.3
      lastDragX = e.clientX
      lastDragY = e.clientY
      lastDragTime = now
      rotY = rotYAtDragStart + (e.clientX - dragStartX) * .3
      rotX = rotXAtDragStart + (e.clientY - dragStartY) * -.3
      rotX = Math.max(-85, Math.min(85, rotX))
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      idleTimer = Date.now()
      C.releasePointerCapture(e.pointerId)
    }
    C.addEventListener('pointerdown', onPointerDown)
    C.addEventListener('pointermove', onPointerMove)
    C.addEventListener('pointerup', onPointerUp)
    C.addEventListener('pointercancel', onPointerUp)
    C.style.cursor = 'grab'
    C.style.touchAction = 'none'

    /* ── Full projection (always returns, includes Z for visibility) ── */
    function projFull(lon: number, lat: number, r = R) {
      const th = lon * PI / 180, ph = (90 - lat) * PI / 180
      const sph = Math.sin(ph)
      const X0 = sph * Math.cos(th), Y0 = Math.cos(ph), Z0 = sph * Math.sin(th)
      const X1 = X0 * cosRY + Z0 * sinRY
      const Z1 = -X0 * sinRY + Z0 * cosRY
      const Y2 = Y0 * cosRX - Z1 * sinRX
      const Z2 = Y0 * sinRX + Z1 * cosRX
      const diff = Math.max(0, X1 * Lx + Y2 * (-Ly) + Z2 * Lz)
      return { x: cx + r * X1, y: cy - r * Y2, z: Z2, diff }
    }

    /* ── Front-face-only projection (returns null if behind globe) ── */
    function proj(lon: number, lat: number, r = R): [number, number, number, number] | null {
      const p = projFull(lon, lat, r)
      return p.z < 0 ? null : [p.x, p.y, p.z, p.diff]
    }

    /* ── Binary-search for the horizon crossing between a visible and hidden point ── */
    function horizonPt(vLon: number, vLat: number, hLon: number, hLat: number): [number, number] {
      let aLo = vLon, aLa = vLat, bLo = hLon, bLa = hLat
      for (let i = 0; i < 8; i++) {
        const mLo = (aLo + bLo) / 2, mLa = (aLa + bLa) / 2
        if (projFull(mLo, mLa).z >= 0) { aLo = mLo; aLa = mLa }
        else { bLo = mLo; bLa = mLa }
      }
      const p = projFull(aLo, aLa)
      return [p.x, p.y]
    }

    /* ── Render a filled polygon on the globe with horizon clipping ── */
    function drawPoly(polygon: number[][], rgb: [number, number, number], fillAlpha: number, strokeAlpha: number) {
      if (!x) return

      // Centroid visibility check — skip polygons fully behind globe
      let cLon = 0, cLat = 0
      for (const [lo, la] of polygon) { cLon += lo; cLat += la }
      cLon /= polygon.length; cLat /= polygon.length
      const cp = projFull(cLon, cLat)
      if (cp.z < -0.15) return

      // Build visible path with horizon interpolation
      const path: [number, number][] = []
      const n = polygon.length

      for (let i = 0; i < n; i++) {
        const [lon1, lat1] = polygon[i]
        const j = (i + 1) % n
        const [lon2, lat2] = polygon[j]
        const p1 = projFull(lon1, lat1)
        const p2 = projFull(lon2, lat2)
        const v1 = p1.z >= 0, v2 = p2.z >= 0

        if (v1 && v2) {
          if (path.length === 0) path.push([p1.x, p1.y])
          path.push([p2.x, p2.y])
        } else if (v1 && !v2) {
          if (path.length === 0) path.push([p1.x, p1.y])
          path.push(horizonPt(lon1, lat1, lon2, lat2))
        } else if (!v1 && v2) {
          path.push(horizonPt(lon2, lat2, lon1, lat1))
          path.push([p2.x, p2.y])
        }
      }

      if (path.length < 3) return

      // Diffuse lighting from centroid
      const lit = 0.35 + cp.diff * 0.55
      const [r, g, b] = rgb

      x.beginPath()
      for (let i = 0; i < path.length; i++) {
        i === 0 ? x.moveTo(path[i][0], path[i][1]) : x.lineTo(path[i][0], path[i][1])
      }
      x.closePath()
      x.fillStyle = `rgba(${r},${g},${b},${(fillAlpha * lit).toFixed(3)})`
      x.fill()

      if (strokeAlpha > 0) {
        x.strokeStyle = `rgba(${r},${g},${b},${(strokeAlpha * lit).toFixed(3)})`
        x.lineWidth = 0.6
        x.stroke()
      }
    }

    /* ── Draw dashed political borders (theatre overlays) ── */
    function drawBorder(polygon: number[][], color: string, width: number) {
      if (!x) return
      const path: [number, number][] = []
      const n = polygon.length
      for (let i = 0; i < n; i++) {
        const [lon1, lat1] = polygon[i]
        const j = (i + 1) % n
        const [lon2, lat2] = polygon[j]
        const p1 = projFull(lon1, lat1)
        const p2 = projFull(lon2, lat2)
        const v1 = p1.z >= 0, v2 = p2.z >= 0
        if (v1 && v2) {
          if (path.length === 0) path.push([p1.x, p1.y])
          path.push([p2.x, p2.y])
        } else if (v1 && !v2) {
          if (path.length === 0) path.push([p1.x, p1.y])
          path.push(horizonPt(lon1, lat1, lon2, lat2))
        } else if (!v1 && v2) {
          path.push(horizonPt(lon2, lat2, lon1, lat1))
          path.push([p2.x, p2.y])
        }
      }
      if (path.length < 3) return
      x.beginPath()
      path.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
      x.closePath()
      x.setLineDash([3, 6])
      x.strokeStyle = color
      x.lineWidth = width
      x.stroke()
      x.setLineDash([])
    }

    function drawGlobe() {
      if (!x) return
      x.clearRect(0, 0, W, H)

      const ryRad = rotY * PI / 180, rxRad = rotX * PI / 180
      cosRY = Math.cos(ryRad); sinRY = Math.sin(ryRad)
      cosRX = Math.cos(rxRad); sinRX = Math.sin(rxRad)

      // Ocean base
      const ocean = x.createRadialGradient(cx - R * .28, cy - R * .22, R * .05, cx, cy, R)
      ocean.addColorStop(0, 'rgba(6,18,8,1)')
      ocean.addColorStop(.5, 'rgba(2,10,4,.98)')
      ocean.addColorStop(1, 'rgba(0,4,1,1)')
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      x.fillStyle = ocean; x.fillRect(cx - R, cy - R, R * 2, R * 2)

      // Specular highlight
      const spec = x.createRadialGradient(cx - R * .3, cy - R * .25, 0, cx - R * .3, cy - R * .25, R * .6)
      spec.addColorStop(0, 'rgba(218,255,74,.06)')
      spec.addColorStop(.4, 'rgba(218,255,74,.02)')
      spec.addColorStop(1, 'rgba(218,255,74,0)')
      x.fillStyle = spec; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      x.restore()

      // Grid lines
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      x.setLineDash([2, 8]); x.lineWidth = .35
      for (let ln = -80; ln <= 80; ln += 20) {
        const pts: [number, number][] = []
        for (let lo = -180; lo <= 180; lo += 4) { const p = proj(lo, ln); if (p) pts.push([p[0], p[1]]) }
        if (pts.length > 1) {
          x.beginPath(); pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
          x.strokeStyle = ln === 0 ? 'rgba(218,255,74,.14)' : 'rgba(218,255,74,.05)'; x.stroke()
        }
      }
      for (let lo = 0; lo < 360; lo += 20) {
        const pts: [number, number][] = []
        for (let ln = -80; ln <= 80; ln += 4) { const p = proj(lo, ln); if (p) pts.push([p[0], p[1]]) }
        if (pts.length > 1) {
          x.beginPath(); pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
          x.strokeStyle = 'rgba(218,255,74,.04)'; x.stroke()
        }
      }
      x.setLineDash([])
      x.restore()

      /* ── Filled land polygons ── */
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()

      // General land — subtle green fill with coastline strokes
      for (const poly of landPolygons) drawPoly(poly, [218, 255, 74], 0.18, 0.14)

      // Iraq — medium highlight
      for (const poly of iraqPolygons) drawPoly(poly, [218, 255, 74], 0.28, 0.20)

      // Gulf states — theatre highlight (brighter)
      for (const poly of gulfPolygons) drawPoly(poly, [218, 255, 74], 0.36, 0.24)

      // Iran — warm adversary orange
      drawPoly(iranPolygon, [255, 140, 0], 0.30, 0.20)

      /* ── Political borders (dashed overlays) ── */
      for (let i = 0; i < gulfPolygons.length; i++) drawBorder(gulfPolygons[i], 'rgba(218,255,74,.3)', .6)
      for (let i = 0; i < iraqPolygons.length; i++) drawBorder(iraqPolygons[i], 'rgba(218,255,74,.2)', .5)
      drawBorder(iranPolygon, 'rgba(255,140,0,.35)', .6)

      x.restore()

      // Rim darkening
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      const rim = x.createRadialGradient(cx - R * .25, cy - R * .2, R * .28, cx, cy, R)
      rim.addColorStop(0, 'rgba(0,0,0,0)')
      rim.addColorStop(.62, 'rgba(0,0,0,0)')
      rim.addColorStop(.82, 'rgba(0,0,0,.32)')
      rim.addColorStop(1, 'rgba(0,0,0,.72)')
      x.fillStyle = rim; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      x.restore()

      // Clean static rim
      x.beginPath(); x.arc(cx, cy, R, 0, PI * 2)
      x.strokeStyle = 'rgba(218,255,74,.35)'; x.lineWidth = 1.5; x.stroke()

      /* ── Pressure columns (data-driven intensity) ── */
      const incs = incidentsRef.current
      if (incs !== cachedIncRef) { cachedIncRef = incs; cachedGrid = buildPressureGrid(incs) }

      if (cachedGrid.length > 0) {
        const maxP = Math.max(...cachedGrid.map(c => c.pressure), 1)
        const MAX_H = R * 0.18

        const cols: { bx: number; by: number; tx: number; ty: number; z: number; norm: number; kr: number; hf: number }[] = []

        for (const cell of cachedGrid) {
          const norm = cell.pressure / maxP
          const bH = MAX_H * Math.pow(norm, 0.6)

          // Sub-bars: tight cluster around cell center
          const subs: [number, number, number][] = [[0, 0, 1]]
          if (cell.count >= 4) {
            const o = CELL_DEG * .18
            subs.push([o, 0, .65], [-o, 0, .6])
          }
          if (cell.count >= 8) {
            const o = CELL_DEG * .22
            subs.push([0, o, .5], [0, -o, .45])
          }
          if (cell.count >= 14) {
            const o = CELL_DEG * .25
            subs.push([o, o, .35], [-o, -o, .3])
          }

          for (const [dLo, dLa, hm] of subs) {
            const lo = cell.lon + dLo, la = cell.lat + dLa
            const base = proj(lo, la)
            const tip = proj(lo, la, R + bH * hm)
            if (!base || !tip) continue
            cols.push({ bx: base[0], by: base[1], tx: tip[0], ty: tip[1], z: base[2], norm, kr: cell.kineticRatio, hf: hm })
          }
        }

        // Sort back-to-front for correct depth
        cols.sort((a, b) => a.z - b.z)
        x.lineCap = 'round'

        for (const c of cols) {
          const rr = 218 + Math.round(37 * c.kr)
          const gg = 255 - Math.round(115 * c.kr)
          const bb = 74 - Math.round(74 * c.kr)
          const hf = c.hf, n = c.norm

          // Outer glow
          x.beginPath(); x.moveTo(c.bx, c.by); x.lineTo(c.tx, c.ty)
          x.strokeStyle = `rgba(${rr},${gg},${bb},${((.08 + n * .14) * hf).toFixed(3)})`
          x.lineWidth = 2 + n * 3; x.stroke()

          // Core column
          x.beginPath(); x.moveTo(c.bx, c.by); x.lineTo(c.tx, c.ty)
          x.strokeStyle = `rgba(${rr},${gg},${bb},${((.45 + n * .45) * hf).toFixed(3)})`
          x.lineWidth = 1 + n * 1.5; x.stroke()

          // Base pad
          x.beginPath(); x.arc(c.bx, c.by, 1.2 + n * 1.5, 0, PI * 2)
          x.fillStyle = `rgba(${rr},${gg},${bb},${((.4 + n * .35) * hf).toFixed(3)})`; x.fill()

          // Tip cap on tall bars only
          if (n > .4 && hf > .6) {
            x.beginPath(); x.arc(c.tx, c.ty, .6 + n * .8, 0, PI * 2)
            x.fillStyle = `rgba(${rr},${gg},${bb},${((.2 + n * .25) * hf).toFixed(3)})`; x.fill()
          }
        }
      }

      // City labels — fade when near active pressure zones
      x.font = '10px "Share Tech Mono", monospace'
      for (const lb of LABELS) {
        const p = proj(lb.lon, lb.lat)
        if (!p) continue
        const [px, py] = p
        const nearPressure = cachedGrid.some(c =>
          Math.abs(c.lon - lb.lon) < CELL_DEG * 1.2 && Math.abs(c.lat - lb.lat) < CELL_DEG * 1.2
        )
        if (nearPressure) {
          x.fillStyle = lb.color.replace(/[\d.]+\)$/, m => `${(parseFloat(m) * .35).toFixed(2)})`)
        } else {
          x.fillStyle = lb.color
        }
        x.fillText(lb.text, px + 6, py - 4)
      }

      // Pressure readout
      if (cachedGrid.length > 0) {
        const kZones = cachedGrid.filter(c => c.kineticRatio > .5).length
        const evtCount = cachedGrid.reduce((s, c) => s + c.count, 0)
        x.font = '9px "Share Tech Mono", monospace'
        x.fillStyle = kZones > 3 ? 'rgba(255,140,0,.8)' : 'rgba(218,255,74,.6)'
        const readout = `${evtCount} EVENTS \u00b7 ${cachedGrid.length} HOTSPOTS`
        const tw = x.measureText(readout).width
        x.fillText(readout, cx - tw / 2, cy + R + 16)
      }

      // Momentum & auto-rotation
      if (!dragging) {
        if (Math.abs(velocityY) > .01) {
          rotY += velocityY
          velocityY *= FRICTION
        } else if (idleTimer && Date.now() - idleTimer > IDLE_RESUME_MS) {
          rotY += AUTO_SPEED
        } else if (!idleTimer) {
          rotY += AUTO_SPEED
        }

        if (Math.abs(velocityX) > .01) {
          rotX += velocityX
          velocityX *= FRICTION
          rotX = Math.max(-85, Math.min(85, rotX))
        }
      }
      raf = requestAnimationFrame(drawGlobe)
    }

    // Visibility-based idle
    let paused = false
    const onVisChange = () => {
      if (document.hidden) {
        paused = true
        cancelAnimationFrame(raf)
      } else if (paused) {
        paused = false
        drawGlobe()
      }
    }
    document.addEventListener('visibilitychange', onVisChange)

    drawGlobe()
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisChange)
      C.removeEventListener('pointerdown', onPointerDown)
      C.removeEventListener('pointermove', onPointerMove)
      C.removeEventListener('pointerup', onPointerUp)
      C.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  return ref
}
