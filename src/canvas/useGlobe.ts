import { useEffect, useRef } from 'react'
import { continents, iranPts } from './continents'
import { globeMarkers } from './globe-markers'

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

    let rot = 40
    let raf: number

    function proj(lon: number, lat: number): [number, number, number, number] | null {
      const th = (lon + rot) * PI / 180, ph = (90 - lat) * PI / 180
      const X = Math.sin(ph) * Math.cos(th), Y = Math.cos(ph), Z = Math.sin(ph) * Math.sin(th)
      if (Z < 0) return null
      const diff = Math.max(0, X * Lx + Y * (-Ly) + Z * Lz)
      return [cx + R * X, cy - R * Y, Z, diff]
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

    function drawGlobe() {
      if (!x) return
      x.clearRect(0, 0, W, H)

      // Atmosphere
      const atmo = x.createRadialGradient(cx, cy, R * .88, cx, cy, R * 1.22)
      atmo.addColorStop(0, 'rgba(196,255,44,.18)')
      atmo.addColorStop(.45, 'rgba(196,255,44,.07)')
      atmo.addColorStop(.8, 'rgba(196,255,44,.02)')
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
      spec.addColorStop(0, 'rgba(196,255,44,.055)')
      spec.addColorStop(.4, 'rgba(196,255,44,.018)')
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
      const TLon = 30 + rot
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

      // Continents
      x.save(); x.beginPath(); x.arc(cx, cy, R, 0, PI * 2); x.clip()
      continents.forEach(c => {
        if (c.hot) drawPoly(c.pts, .055, 'rgba(196,255,44,.7)', 1.4, true, .08)
        else drawPoly(c.pts, .04, 'rgba(196,255,44,.35)', .7, false, 0)
      })
      // Iran
      drawPoly(iranPts, .06, 'rgba(255,140,0,.6)', 1.2, false, 0)
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

      // Animated outer glow ring
      const t0 = Date.now() / 1e3
      const pulse0 = .5 + .5 * Math.sin(t0 * 1.6)
      // Outer glow halo (pulsing)
      x.beginPath(); x.arc(cx, cy, R + 6, 0, PI * 2)
      x.shadowColor = `rgba(196,255,44,${.15 + pulse0 * .2})`
      x.shadowBlur = 18 + pulse0 * 14
      x.strokeStyle = `rgba(196,255,44,${.06 + pulse0 * .08})`; x.lineWidth = 4; x.stroke()
      x.shadowBlur = 0
      // Bright inner border
      x.beginPath(); x.arc(cx, cy, R, 0, PI * 2)
      x.strokeStyle = `rgba(196,255,44,${.32 + pulse0 * .15})`; x.lineWidth = 1.4; x.stroke()
      // Secondary ring
      x.beginPath(); x.arc(cx, cy, R + 3, 0, PI * 2)
      x.strokeStyle = `rgba(196,255,44,${.08 + pulse0 * .06})`; x.lineWidth = 2; x.stroke()

      // Markers
      const t = Date.now() / 1e3
      globeMarkers.forEach(m => {
        const p = proj(m.lon, m.lat)
        if (!p) return
        const [px, py] = p
        const pulse = .5 + .5 * Math.abs(Math.sin(t * 2.2 + m.lon * .3))
        if (m.t === 'l') {
          x.beginPath(); x.arc(px, py, 3.5, 0, PI * 2); x.fillStyle = 'rgba(255,100,0,.95)'
          x.shadowColor = 'rgba(255,80,0,1)'; x.shadowBlur = 12; x.fill(); x.shadowBlur = 0
          x.beginPath(); x.arc(px, py, 7 + pulse * 8, 0, PI * 2)
          x.strokeStyle = `rgba(255,100,0,${.35 * pulse})`; x.lineWidth = 1.2; x.stroke()
        } else {
          x.beginPath(); x.arc(px, py, 3, 0, PI * 2); x.fillStyle = 'rgba(196,255,44,.95)'
          x.shadowColor = 'rgba(196,255,44,1)'; x.shadowBlur = 10; x.fill(); x.shadowBlur = 0
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

      rot += .048
      raf = requestAnimationFrame(drawGlobe)
    }
    drawGlobe()
    return () => cancelAnimationFrame(raf)
  }, [])

  return ref
}
