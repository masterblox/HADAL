import { useEffect, useRef } from 'react'
import { landPolygons, gulfPolygons, iraqPolygons, iranPolygon } from './land-110m'
import { globeMarkers } from './globe-markers'

interface Particle {
  x: number; y: number; vx: number; vy: number; size: number; opacity: number; phase: number
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

    const hatch = document.createElement('canvas')
    hatch.width = 6; hatch.height = 6
    const hx = hatch.getContext('2d')!
    hx.strokeStyle = 'rgba(196,255,44,.9)'; hx.lineWidth = .6
    hx.beginPath(); hx.moveTo(0, 6); hx.lineTo(6, 0); hx.stroke()
    hx.beginPath(); hx.moveTo(-1, 6); hx.lineTo(6, -1); hx.stroke()
    hx.beginPath(); hx.moveTo(1, 7); hx.lineTo(7, 1); hx.stroke()
    const hPat = x.createPattern(hatch, 'repeat')!

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
      // Spherical → Cartesian
      const sph = Math.sin(ph)
      const X0 = sph * Math.cos(th), Y0 = Math.cos(ph), Z0 = sph * Math.sin(th)
      // Y-rotation by rotY
      const X1 = X0 * cosRY + Z0 * sinRY
      const Z1 = -X0 * sinRY + Z0 * cosRY
      // X-rotation by rotX
      const Y2 = Y0 * cosRX - Z1 * sinRX
      const Z2 = Y0 * sinRX + Z1 * cosRX
      // Back-face cull
      if (Z2 < 0) return null
      // Lighting against fixed light direction
      const diff = Math.max(0, X1 * Lx + Y2 * (-Ly) + Z2 * Lz)
      return [cx + R * X1, cy - R * Y2, Z2, diff]
    }

    function drawPoly(ptsArr: number[][], fillAlpha: number, strokeCol: string, strokeW: number, doHatch: boolean, hatchAlpha: number) {
      if (!x) return
      const pts = ptsArr.map(([lo, la]) => proj(lo, la)).filter(Boolean) as [number, number, number, number][]
      if (pts.length < 3) return
      x.beginPath()
      pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
      x.closePath()
      if (doHatch) {
        x.fillStyle = `rgba(196,255,44,${fillAlpha})`; x.fill()
        x.save(); x.clip(); x.globalAlpha = hatchAlpha; x.fillStyle = hPat; x.fillRect(0, 0, W, H); x.restore(); x.globalAlpha = 1
      } else {
        x.fillStyle = `rgba(196,255,44,${fillAlpha})`; x.fill()
      }
      x.strokeStyle = strokeCol; x.lineWidth = strokeW; x.stroke()
    }

    function drawParticles(time: number) {
      if (!x) return
      const R2 = (R + 8) * (R + 8) // slightly larger than globe disc to avoid edge flicker
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i]
        // Update position
        p.x += p.vx
        p.y += p.vy
        // Wrap at edges
        if (p.x < 0) p.x += W
        else if (p.x > W) p.x -= W
        if (p.y < 0) p.y += H
        else if (p.y > H) p.y -= H
        // Skip if inside globe disc
        const dx = p.x - cx, dy = p.y - cy
        if (dx * dx + dy * dy < R2) continue
        // Flicker
        const flicker = .7 + .3 * Math.sin(time * 2.5 + p.phase)
        const alpha = p.opacity * flicker
        x.fillStyle = `rgba(196,255,44,${alpha})`
        x.fillRect(p.x, p.y, p.size, p.size)
      }
    }

    function drawGlobe() {
      if (!x) return
      x.clearRect(0, 0, W, H)

      // Cache trig for this frame
      const ryRad = rotY * PI / 180, rxRad = rotX * PI / 180
      cosRY = Math.cos(ryRad); sinRY = Math.sin(ryRad)
      cosRX = Math.cos(rxRad); sinRX = Math.sin(rxRad)

      const t0 = Date.now() / 1e3

      // Particles (behind globe)
      drawParticles(t0)

      // Atmosphere
      const atmo = x.createRadialGradient(cx, cy, R * .92, cx, cy, R * 1.15)
      atmo.addColorStop(0, 'rgba(196,255,44,.14)')
      atmo.addColorStop(.35, 'rgba(196,255,44,.07)')
      atmo.addColorStop(.7, 'rgba(196,255,44,.02)')
      atmo.addColorStop(.85, 'rgba(196,255,44,.005)')
      atmo.addColorStop(1, 'rgba(196,255,44,0)')
      x.beginPath(); x.arc(cx, cy, R * 1.15, 0, PI * 2); x.fillStyle = atmo; x.fill()

      // Ocean
      const ocean = x.createRadialGradient(cx - R * .28, cy - R * .22, R * .05, cx, cy, R)
      ocean.addColorStop(0, 'rgba(6,18,8,1)')
      ocean.addColorStop(.5, 'rgba(2,10,4,.98)')
      ocean.addColorStop(1, 'rgba(0,4,1,1)')
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      x.fillStyle = ocean; x.fillRect(cx - R, cy - R, R * 2, R * 2)

      // Specular
      const spec = x.createRadialGradient(cx - R * .3, cy - R * .25, 0, cx - R * .3, cy - R * .25, R * .6)
      spec.addColorStop(0, 'rgba(196,255,44,.08)')
      spec.addColorStop(.4, 'rgba(196,255,44,.025)')
      spec.addColorStop(1, 'rgba(196,255,44,0)')
      x.fillStyle = spec; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      x.restore()

      // Grid
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      x.setLineDash([2, 8]); x.lineWidth = .35
      for (let ln = -80; ln <= 80; ln += 20) {
        const pts: [number, number][] = []
        for (let lo = -180; lo <= 180; lo += 4) { const p = proj(lo, ln); if (p) pts.push([p[0], p[1]]) }
        if (pts.length > 1) {
          x.beginPath(); pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
          x.strokeStyle = ln === 0 ? 'rgba(196,255,44,.18)' : 'rgba(196,255,44,.07)'; x.stroke()
        }
      }
      for (let lo = 0; lo < 360; lo += 20) {
        const pts: [number, number][] = []
        for (let ln = -80; ln <= 80; ln += 4) { const p = proj(lo, ln); if (p) pts.push([p[0], p[1]]) }
        if (pts.length > 1) {
          x.beginPath(); pts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
          x.strokeStyle = 'rgba(196,255,44,.05)'; x.stroke()
        }
      }
      x.setLineDash([])

      // Terminator
      const TLon = 30 + rotY
      const termPts: [number, number][] = []
      for (let lat = -90; lat <= 90; lat += 2) { const p = proj(TLon, lat); if (p) termPts.push([p[0], p[1]]) }
      if (termPts.length > 1) {
        x.beginPath(); termPts.forEach(([px, py], i) => i === 0 ? x.moveTo(px, py) : x.lineTo(px, py))
        x.strokeStyle = 'rgba(196,255,44,.12)'; x.lineWidth = 1; x.stroke()
      }

      // Night side
      const termX = proj(TLon, 0)
      if (termX) {
        const ng = x.createRadialGradient(termX[0] + 60, termX[1], 0, termX[0] + 60, termX[1], R * 1.4)
        ng.addColorStop(0, 'rgba(0,0,0,.38)'); ng.addColorStop(1, 'rgba(0,0,0,0)')
        x.fillStyle = ng; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      }
      x.restore()

      // Land — Natural Earth 110m
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      // General land
      for (let i = 0; i < landPolygons.length; i++) {
        drawPoly(landPolygons[i], .04, 'rgba(196,255,44,.35)', .7, false, 0)
      }
      // Iraq
      for (let i = 0; i < iraqPolygons.length; i++) {
        drawPoly(iraqPolygons[i], .04, 'rgba(196,255,44,.35)', .7, false, 0)
      }
      // Gulf hot zone (hatched)
      for (let i = 0; i < gulfPolygons.length; i++) {
        drawPoly(gulfPolygons[i], .055, 'rgba(196,255,44,.7)', 1.4, true, .08)
      }
      // Iran (orange highlight)
      drawPoly(iranPolygon, .06, 'rgba(255,140,0,.6)', 1.2, false, 0)
      const ip = proj(53, 32)
      if (ip) {
        const iranGlow = x.createRadialGradient(ip[0], ip[1], 0, ip[0], ip[1], 48)
        iranGlow.addColorStop(0, 'rgba(255,140,0,.18)'); iranGlow.addColorStop(1, 'rgba(255,140,0,0)')
        x.fillStyle = iranGlow; x.beginPath(); x.arc(ip[0], ip[1], 48, 0, PI * 2); x.fill()
      }
      // Gulf glow
      const gp = proj(52, 26)
      if (gp) {
        const gg = x.createRadialGradient(gp[0], gp[1], 0, gp[0], gp[1], 42)
        gg.addColorStop(0, 'rgba(196,255,44,.2)'); gg.addColorStop(1, 'rgba(196,255,44,0)')
        x.fillStyle = gg; x.beginPath(); x.arc(gp[0], gp[1], 42, 0, PI * 2); x.fill()
      }
      x.restore()

      // Rim darkening
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      const rim = x.createRadialGradient(cx - R * .25, cy - R * .2, R * .28, cx, cy, R)
      rim.addColorStop(0, 'rgba(0,0,0,0)')
      rim.addColorStop(.62, 'rgba(0,0,0,0)')
      rim.addColorStop(.82, 'rgba(0,0,0,.32)')
      rim.addColorStop(1, 'rgba(0,0,0,.72)')
      x.fillStyle = rim; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      const sh = x.createRadialGradient(cx - R * .32, cy - R * .28, 0, cx - R * .32, cy - R * .28, R * .38)
      sh.addColorStop(0, 'rgba(196,255,44,.09)')
      sh.addColorStop(.5, 'rgba(196,255,44,.03)')
      sh.addColorStop(1, 'rgba(196,255,44,0)')
      x.fillStyle = sh; x.fillRect(cx - R, cy - R, R * 2, R * 2)
      x.restore()

      // Clean multi-stroke ring (matches portal ring geometry)
      const pulse0 = .5 + .5 * Math.sin(t0 * 1.6)
      const ringAlpha = .35 + pulse0 * .08
      // Main ring at R
      x.beginPath(); x.arc(cx, cy, R, 0, PI * 2)
      x.strokeStyle = `rgba(196,255,44,${ringAlpha})`; x.lineWidth = 2.5; x.stroke()
      // Inner ring at R-6
      x.beginPath(); x.arc(cx, cy, R - 6, 0, PI * 2)
      x.strokeStyle = `rgba(196,255,44,${ringAlpha * .3})`; x.lineWidth = 1; x.stroke()
      // Outer ring at R+6
      x.beginPath(); x.arc(cx, cy, R + 6, 0, PI * 2)
      x.strokeStyle = `rgba(196,255,44,${ringAlpha * .2})`; x.lineWidth = 1; x.stroke()

      // Markers
      const t = t0
      globeMarkers.forEach(m => {
        const p = proj(m.lon, m.lat)
        if (!p) return
        const [px, py] = p
        const pulse = .5 + .5 * Math.abs(Math.sin(t * 2.2 + m.lon * .3))
        if (m.t === 'l') {
          // Concentric halo
          x.beginPath(); x.arc(px, py, 6, 0, PI * 2); x.fillStyle = 'rgba(255,100,0,.12)'; x.fill()
          // Core dot
          x.beginPath(); x.arc(px, py, 3.5, 0, PI * 2); x.fillStyle = 'rgba(255,100,0,.95)'; x.fill()
          // Ping ring
          x.beginPath(); x.arc(px, py, 7 + pulse * 8, 0, PI * 2)
          x.strokeStyle = `rgba(255,100,0,${.35 * pulse})`; x.lineWidth = 1.2; x.stroke()
        } else {
          // Concentric halo
          x.beginPath(); x.arc(px, py, 5, 0, PI * 2); x.fillStyle = 'rgba(196,255,44,.1)'; x.fill()
          // Core dot
          x.beginPath(); x.arc(px, py, 3, 0, PI * 2); x.fillStyle = 'rgba(196,255,44,.95)'; x.fill()
          // Ping ring
          x.beginPath(); x.arc(px, py, 6 + pulse * 7, 0, PI * 2)
          x.strokeStyle = `rgba(196,255,44,${.4 * pulse})`; x.lineWidth = 1; x.stroke()
        }
      })

      // Labels
      const teh = proj(51.4, 35.6)
      if (teh) {
        x.fillStyle = 'rgba(255,100,0,.85)'; x.font = '700 7px "Rajdhani",sans-serif'
        x.fillText('TEHRAN', teh[0] + 6, teh[1] - 4)
      }
      const dxb = proj(55.3, 25.2)
      if (dxb) {
        x.fillStyle = 'rgba(196,255,44,.65)'; x.font = '700 7px "Rajdhani",sans-serif'
        x.fillText('DUBAI', dxb[0] + 5, dxb[1] + 10)
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
    drawGlobe()
    return () => {
      cancelAnimationFrame(raf)
      C.removeEventListener('pointerdown', onPointerDown)
      C.removeEventListener('pointermove', onPointerMove)
      C.removeEventListener('pointerup', onPointerUp)
      C.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  return ref
}
