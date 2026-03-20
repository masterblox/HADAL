import { useEffect, useRef } from 'react'
import { landPolygons, gulfPolygons, iraqPolygons, iranPolygon } from './land-110m'
import { globeMarkers } from './globe-markers'

interface Particle {
  x: number; y: number; vx: number; vy: number; size: number; opacity: number; phase: number
}

// Point-in-polygon (ray casting)
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

// 0 = general land, 1 = iraq, 2 = gulf, 3 = iran
interface LandDot { lon: number; lat: number; type: number }

function buildLandDots(): LandDot[] {
  const dots: LandDot[] = []
  const STEP = 1.4 // degrees — ~6,000 land dots

  for (let lat = -58; lat <= 78; lat += STEP) {
    for (let lon = -180; lon <= 180; lon += STEP) {
      // Check regions in priority order (most specific first)
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

export function useGlobe() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ref.current
    if (!C) return
    const x = C.getContext('2d')
    if (!x) return
    const W = 420, H = 420, cx = W / 2, cy = H / 2, R = 196, PI = Math.PI

    const Lx = -.55, Ly = -.65, Lz = .52

    // Pre-compute land dots (runs once)
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

    // Particles
    const PARTICLE_COUNT = 100
    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - .5) * .6,
        vy: (Math.random() - .5) * .6,
        size: .8 + Math.random() * 1.2,
        opacity: .05 + Math.random() * .15,
        phase: Math.random() * PI * 2,
      })
    }

    // Cached trig values — set once per frame in drawGlobe
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

    // Thin border outlines for political boundaries
    function drawBorder(ptsArr: number[][], strokeCol: string, strokeW: number) {
      if (!x) return
      const pts = ptsArr.map(([lo, la]) => proj(lo, la)).filter(Boolean) as [number, number, number, number][]
      if (pts.length < 3) return
      x.beginPath()
      pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
      x.closePath()
      x.strokeStyle = strokeCol; x.lineWidth = strokeW; x.stroke()
    }

    function drawParticles(time: number) {
      if (!x) return
      const R2 = (R + 8) * (R + 8)
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x += W
        else if (p.x > W) p.x -= W
        if (p.y < 0) p.y += H
        else if (p.y > H) p.y -= H
        const dx = p.x - cx, dy = p.y - cy
        if (dx * dx + dy * dy < R2) continue
        const flicker = .7 + .3 * Math.sin(time * 2.5 + p.phase)
        const alpha = p.opacity * flicker
        x.fillStyle = `rgba(196,255,44,${alpha})`
        x.fillRect(p.x, p.y, p.size, p.size)
      }
    }

    function drawGlobe() {
      if (!x) return
      x.clearRect(0, 0, W, H)

      const ryRad = rotY * PI / 180, rxRad = rotX * PI / 180
      cosRY = Math.cos(ryRad); sinRY = Math.sin(ryRad)
      cosRX = Math.cos(rxRad); sinRX = Math.sin(rxRad)

      const t0 = Date.now() / 1e3

      // Particles (behind globe)
      drawParticles(t0)

      // Atmosphere
      const atmo = x.createRadialGradient(cx, cy, R * .88, cx, cy, R * 1.22)
      atmo.addColorStop(0, 'rgba(196,255,44,.12)')
      atmo.addColorStop(.45, 'rgba(196,255,44,.05)')
      atmo.addColorStop(.8, 'rgba(196,255,44,.015)')
      atmo.addColorStop(1, 'rgba(196,255,44,0)')
      x.beginPath(); x.arc(cx, cy, R * 1.22, 0, PI * 2); x.fillStyle = atmo; x.fill()

      // Ocean
      const ocean = x.createRadialGradient(cx - R * .28, cy - R * .22, R * .05, cx, cy, R)
      ocean.addColorStop(0, 'rgba(6,18,8,1)')
      ocean.addColorStop(.5, 'rgba(2,10,4,.98)')
      ocean.addColorStop(1, 'rgba(0,4,1,1)')
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      x.fillStyle = ocean; x.fillRect(cx - R, cy - R, R * 2, R * 2)

      // Specular
      const spec = x.createRadialGradient(cx - R * .3, cy - R * .25, 0, cx - R * .3, cy - R * .25, R * .6)
      spec.addColorStop(0, 'rgba(196,255,44,.04)')
      spec.addColorStop(.4, 'rgba(196,255,44,.012)')
      spec.addColorStop(1, 'rgba(196,255,44,0)')
      x.fillStyle = spec; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      x.restore()

      // Grid
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      x.setLineDash([2, 10]); x.lineWidth = .3
      for (let ln = -80; ln <= 80; ln += 20) {
        const pts: [number, number][] = []
        for (let lo = -180; lo <= 180; lo += 4) { const p = proj(lo, ln); if (p) pts.push([p[0], p[1]]) }
        if (pts.length > 1) {
          x.beginPath(); pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
          x.strokeStyle = ln === 0 ? 'rgba(196,255,44,.18)' : 'rgba(196,255,44,.08)'; x.stroke()
        }
      }
      for (let lo = 0; lo < 360; lo += 20) {
        const pts: [number, number][] = []
        for (let ln = -80; ln <= 80; ln += 4) { const p = proj(lo, ln); if (p) pts.push([p[0], p[1]]) }
        if (pts.length > 1) {
          x.beginPath(); pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
          x.strokeStyle = 'rgba(196,255,44,.06)'; x.stroke()
        }
      }
      x.setLineDash([])

      // Terminator
      const TLon = 30 + rotY
      const termPts: [number, number][] = []
      for (let lat = -90; lat <= 90; lat += 2) { const p = proj(TLon, lat); if (p) termPts.push([p[0], p[1]]) }
      if (termPts.length > 1) {
        x.beginPath(); termPts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
        x.strokeStyle = 'rgba(196,255,44,.1)'; x.lineWidth = .8; x.stroke()
      }

      // Night side
      const termX = proj(TLon, 0)
      if (termX) {
        const ng = x.createRadialGradient(termX[0] + 60, termX[1], 0, termX[0] + 60, termX[1], R * 1.4)
        ng.addColorStop(0, 'rgba(0,0,0,.3)'); ng.addColorStop(1, 'rgba(0,0,0,0)')
        x.fillStyle = ng; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      }
      x.restore()

      // ═══ DOT-BASED LAND RENDERING ═══
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()

      for (let i = 0; i < landDots.length; i++) {
        const d = landDots[i]
        const p = proj(d.lon, d.lat)
        if (!p) continue
        const [px, py, , diff] = p
        // Lighting factor: brighter on sun side
        const lit = .25 + diff * .6

        switch (d.type) {
          case 0: // General land — subtle green dots
            x.fillStyle = `rgba(196,255,44,${(.12 + lit * .18).toFixed(3)})`
            x.fillRect(px - .7, py - .7, 1.4, 1.4)
            break
          case 1: // Iraq — slightly brighter
            x.fillStyle = `rgba(196,255,44,${(.18 + lit * .25).toFixed(3)})`
            x.fillRect(px - .8, py - .8, 1.6, 1.6)
            break
          case 2: // Gulf states — brightest green
            x.fillStyle = `rgba(196,255,44,${(.28 + lit * .4).toFixed(3)})`
            x.fillRect(px - .9, py - .9, 1.8, 1.8)
            break
          case 3: // Iran — orange dots
            x.fillStyle = `rgba(255,140,0,${(.22 + lit * .4).toFixed(3)})`
            x.fillRect(px - .9, py - .9, 1.8, 1.8)
            break
        }
      }

      // Thin political borders (outlines only, no fill)
      x.setLineDash([3, 4])
      for (let i = 0; i < gulfPolygons.length; i++) {
        drawBorder(gulfPolygons[i], 'rgba(196,255,44,.3)', .8)
      }
      drawBorder(iranPolygon, 'rgba(255,140,0,.35)', .8)
      for (let i = 0; i < iraqPolygons.length; i++) {
        drawBorder(iraqPolygons[i], 'rgba(196,255,44,.2)', .6)
      }
      x.setLineDash([])

      // Iran glow
      const ip = proj(53, 32)
      if (ip) {
        const iranGlow = x.createRadialGradient(ip[0], ip[1], 0, ip[0], ip[1], 40)
        iranGlow.addColorStop(0, 'rgba(255,140,0,.12)'); iranGlow.addColorStop(1, 'rgba(255,140,0,0)')
        x.fillStyle = iranGlow; x.beginPath(); x.arc(ip[0], ip[1], 40, 0, PI * 2); x.fill()
      }
      // Gulf glow
      const gp = proj(52, 26)
      if (gp) {
        const gg = x.createRadialGradient(gp[0], gp[1], 0, gp[0], gp[1], 36)
        gg.addColorStop(0, 'rgba(196,255,44,.12)'); gg.addColorStop(1, 'rgba(196,255,44,0)')
        x.fillStyle = gg; x.beginPath(); x.arc(gp[0], gp[1], 36, 0, PI * 2); x.fill()
      }
      x.restore()

      // Rim darkening
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      const rim = x.createRadialGradient(cx - R * .25, cy - R * .2, R * .28, cx, cy, R)
      rim.addColorStop(0, 'rgba(0,0,0,0)')
      rim.addColorStop(.62, 'rgba(0,0,0,0)')
      rim.addColorStop(.82, 'rgba(0,0,0,.28)')
      rim.addColorStop(1, 'rgba(0,0,0,.65)')
      x.fillStyle = rim; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      const sh = x.createRadialGradient(cx - R * .32, cy - R * .28, 0, cx - R * .32, cy - R * .28, R * .38)
      sh.addColorStop(0, 'rgba(196,255,44,.06)')
      sh.addColorStop(.5, 'rgba(196,255,44,.02)')
      sh.addColorStop(1, 'rgba(196,255,44,0)')
      x.fillStyle = sh; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      x.restore()

      // Globe rim — clean, no pulsing glow
      x.beginPath(); x.arc(cx, cy, R, 0, PI * 2)
      x.strokeStyle = 'rgba(196,255,44,.25)'; x.lineWidth = 1; x.stroke()
      x.beginPath(); x.arc(cx, cy, R + 2, 0, PI * 2)
      x.strokeStyle = 'rgba(196,255,44,.06)'; x.lineWidth = 1.5; x.stroke()

      // Markers
      const t = t0
      globeMarkers.forEach(m => {
        const p = proj(m.lon, m.lat)
        if (!p) return
        const [px, py] = p
        const pulse = .5 + .5 * Math.abs(Math.sin(t * 2.2 + m.lon * .3))
        if (m.t === 'l') {
          x.beginPath(); x.arc(px, py, 2.5, 0, PI * 2); x.fillStyle = 'rgba(255,100,0,.9)'
          x.fill()
          x.beginPath(); x.arc(px, py, 5 + pulse * 6, 0, PI * 2)
          x.strokeStyle = `rgba(255,100,0,${.3 * pulse})`; x.lineWidth = .8; x.stroke()
        } else {
          x.beginPath(); x.arc(px, py, 2, 0, PI * 2); x.fillStyle = 'rgba(196,255,44,.9)'
          x.fill()
          x.beginPath(); x.arc(px, py, 4 + pulse * 5, 0, PI * 2)
          x.strokeStyle = `rgba(196,255,44,${.35 * pulse})`; x.lineWidth = .8; x.stroke()
        }
      })

      // Labels
      x.font = '400 10px "Share Tech Mono",monospace'
      x.textBaseline = 'middle'

      const labels: Array<{ lon: number; lat: number; name: string; color: string; ox: number; oy: number }> = [
        { lon: 51.4, lat: 35.6, name: 'TEHRAN', color: 'rgba(255,140,0,.9)', ox: 7, oy: -5 },
        { lon: 59.6, lat: 36.3, name: 'MASHHAD', color: 'rgba(255,140,0,.6)', ox: 6, oy: -5 },
        { lon: 51.7, lat: 32.7, name: 'ISFAHAN', color: 'rgba(255,140,0,.55)', ox: 6, oy: 0 },
        { lon: 55.3, lat: 25.2, name: 'DUBAI', color: 'rgba(196,255,44,.85)', ox: 6, oy: 10 },
        { lon: 54.4, lat: 24.5, name: 'ABU DHABI', color: 'rgba(196,255,44,.65)', ox: 6, oy: 8 },
        { lon: 46.7, lat: 24.6, name: 'RIYADH', color: 'rgba(196,255,44,.65)', ox: 6, oy: 0 },
        { lon: 47.0, lat: 29.4, name: 'KUWAIT', color: 'rgba(196,255,44,.65)', ox: 6, oy: -5 },
        { lon: 51.5, lat: 25.3, name: 'DOHA', color: 'rgba(196,255,44,.65)', ox: 6, oy: 0 },
        { lon: 50.6, lat: 26.2, name: 'BAHRAIN', color: 'rgba(196,255,44,.55)', ox: 6, oy: -5 },
        { lon: 58.5, lat: 23.6, name: 'MUSCAT', color: 'rgba(196,255,44,.55)', ox: 6, oy: 0 },
        { lon: 44.4, lat: 33.3, name: 'BAGHDAD', color: 'rgba(196,255,44,.65)', ox: 6, oy: -5 },
        { lon: 44.2, lat: 15.4, name: 'SANAA', color: 'rgba(255,140,0,.65)', ox: 6, oy: 0 },
        { lon: 56.3, lat: 26.6, name: 'HORMUZ', color: 'rgba(255,140,0,.7)', ox: 6, oy: 0 },
        { lon: 43.3, lat: 12.6, name: 'BAB AL-MANDAB', color: 'rgba(255,140,0,.6)', ox: 6, oy: 8 },
        { lon: 35.5, lat: 33.9, name: 'BEIRUT', color: 'rgba(196,255,44,.5)', ox: -52, oy: 0 },
        { lon: 35.2, lat: 31.8, name: 'JERUSALEM', color: 'rgba(196,255,44,.5)', ox: -68, oy: 0 },
        { lon: 36.3, lat: 33.5, name: 'DAMASCUS', color: 'rgba(196,255,44,.45)', ox: 6, oy: -5 },
      ]

      for (const lbl of labels) {
        const p = proj(lbl.lon, lbl.lat)
        if (!p) continue
        x.fillStyle = lbl.color
        x.fillRect(p[0] - 1, p[1] - 1, 2, 2)
        x.fillText(lbl.name, p[0] + lbl.ox, p[1] + lbl.oy)
      }
      x.textBaseline = 'alphabetic'

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

    // Visibility-based idle: pause RAF when tab is hidden
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
