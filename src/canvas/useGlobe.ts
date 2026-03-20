import { useEffect, useRef } from 'react'
import { landPolygons, gulfPolygons, iraqPolygons, iranPolygon } from './land-110m'
import { globeMarkers } from './globe-markers'

/* ── Point-in-polygon (ray casting) ── */
function pip(px: number, py: number, poly: number[][]) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/* ── Pre-compute land dots at mount time ── */
interface LandDot { lon: number; lat: number; type: number } // 0=land, 1=iraq, 2=gulf, 3=iran

function buildLandDots(): LandDot[] {
  const dots: LandDot[] = []
  const STEP = 1.4
  for (let lat = -58; lat <= 78; lat += STEP) {
    for (let lon = -180; lon <= 180; lon += STEP) {
      if (pip(lon, lat, iranPolygon)) {
        dots.push({ lon, lat, type: 3 })
      } else if (gulfPolygons.some(p => pip(lon, lat, p))) {
        dots.push({ lon, lat, type: 2 })
      } else if (iraqPolygons.some(p => pip(lon, lat, p))) {
        dots.push({ lon, lat, type: 1 })
      } else if (landPolygons.some(p => pip(lon, lat, p))) {
        dots.push({ lon, lat, type: 0 })
      }
    }
  }
  return dots
}

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

export function useGlobe() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ref.current
    if (!C) return
    const x = C.getContext('2d')
    if (!x) return
    const W = 420, H = 420, cx = W / 2, cy = H / 2, R = 196, PI = Math.PI

    const Lx = -.55, Ly = -.65, Lz = .52

    /* Pre-compute land dots (runs once) */
    const landDots = buildLandDots()

    let rotY = 40
    let rotX = 0
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

    function proj(lon: number, lat: number): [number, number, number, number] | null {
      const th = lon * PI / 180, ph = (90 - lat) * PI / 180
      const sph = Math.sin(ph)
      const X0 = sph * Math.cos(th), Y0 = Math.cos(ph), Z0 = sph * Math.sin(th)
      const X1 = X0 * cosRY + Z0 * sinRY
      const Z1 = -X0 * sinRY + Z0 * cosRY
      const Y2 = Y0 * cosRX - Z1 * sinRX
      const Z2 = Y0 * sinRX + Z1 * cosRX
      if (Z2 < 0) return null
      const diff = Math.max(0, X1 * Lx + Y2 * (-Ly) + Z2 * Lz)
      return [cx + R * X1, cy - R * Y2, Z2, diff]
    }

    /* ── Draw thin dashed political borders ── */
    function drawBorder(ptsArr: number[][], color: string, width: number) {
      if (!x) return
      const pts = ptsArr.map(([lo, la]) => proj(lo, la)).filter(Boolean) as [number, number, number, number][]
      if (pts.length < 3) return
      x.beginPath()
      pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
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

      /* ── Dot-based land rendering ── */
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      for (let i = 0; i < landDots.length; i++) {
        const d = landDots[i]
        const p = proj(d.lon, d.lat)
        if (!p) continue
        const [px, py, , diff] = p
        const lit = .25 + diff * .6

        switch (d.type) {
          case 0: // General land
            x.fillStyle = `rgba(218,255,74,${(.1 + lit * .18).toFixed(3)})`
            x.fillRect(px - .7, py - .7, 1.4, 1.4)
            break
          case 1: // Iraq
            x.fillStyle = `rgba(218,255,74,${(.16 + lit * .25).toFixed(3)})`
            x.fillRect(px - .8, py - .8, 1.6, 1.6)
            break
          case 2: // Gulf states
            x.fillStyle = `rgba(218,255,74,${(.25 + lit * .4).toFixed(3)})`
            x.fillRect(px - .9, py - .9, 1.8, 1.8)
            break
          case 3: // Iran (orange)
            x.fillStyle = `rgba(255,140,0,${(.2 + lit * .4).toFixed(3)})`
            x.fillRect(px - .9, py - .9, 1.8, 1.8)
            break
        }
      }

      /* ── Political borders (thin dashed lines) ── */
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

      // Markers
      globeMarkers.forEach(m => {
        const p = proj(m.lon, m.lat)
        if (!p) return
        const [px, py] = p
        if (m.t === 'l') {
          x.beginPath(); x.arc(px, py, 3.5, 0, PI * 2); x.fillStyle = 'rgba(255,100,0,.9)'; x.fill()
          x.beginPath(); x.arc(px, py, 5, 0, PI * 2)
          x.strokeStyle = 'rgba(255,100,0,.3)'; x.lineWidth = 1; x.stroke()
        } else {
          x.beginPath(); x.arc(px, py, 2.5, 0, PI * 2); x.fillStyle = 'rgba(218,255,74,.9)'; x.fill()
          x.beginPath(); x.arc(px, py, 4.5, 0, PI * 2)
          x.strokeStyle = 'rgba(218,255,74,.25)'; x.lineWidth = 1; x.stroke()
        }
      })

      // City labels
      x.font = '10px "Share Tech Mono", monospace'
      for (const lb of LABELS) {
        const p = proj(lb.lon, lb.lat)
        if (!p) continue
        const [px, py] = p
        x.fillStyle = lb.color
        x.fillText(lb.text, px + 6, py - 4)
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
