import { useEffect, useRef } from 'react'

export function usePizzaSlice() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ref.current
    if (!C) return
    const x = C.getContext('2d')
    if (!x) return
    const W = 110, H = 90, cx = 55, cy = 50
    const R = 38, T = 6, ANGLE = Math.PI / 2.8, N = 10
    const FOC = 240, TX = -0.42
    let rot = 0
    let raf: number

    function proj(px: number, py: number, pz: number) {
      const rx = px * Math.cos(rot) + pz * Math.sin(rot)
      const ry = py
      const rz = -px * Math.sin(rot) + pz * Math.cos(rot)
      const ry2 = ry * Math.cos(TX) - rz * Math.sin(TX)
      const rz2 = ry * Math.sin(TX) + rz * Math.cos(TX)
      const sc = FOC / (FOC + rz2 + 50)
      return { x: cx + rx * sc, y: cy + ry2 * sc, z: rz2 }
    }

    function arc(y: number) {
      const a: [number, number, number][] = []
      for (let i = 0; i <= N; i++) {
        const ang = -ANGLE / 2 + (i / N) * ANGLE
        a.push([R * Math.sin(ang), y, R * Math.cos(ang)])
      }
      return a
    }

    function faceZ(pts: [number, number, number][]) {
      const s = pts.map(p => proj(p[0], p[1], p[2]))
      return s.reduce((a, b) => a + b.z, 0) / s.length
    }

    function fillFace(pts3: [number, number, number][], fill?: string, stroke?: string, lw?: number) {
      if (!x) return
      const p = pts3.map(v => proj(v[0], v[1], v[2]))
      x.beginPath(); x.moveTo(p[0].x, p[0].y)
      for (let i = 1; i < p.length; i++) x.lineTo(p[i].x, p[i].y)
      x.closePath()
      if (fill) { x.fillStyle = fill; x.fill() }
      if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw || 1; x.stroke() }
    }

    function frame() {
      if (!x) return
      x.clearRect(0, 0, W, H)
      const aT = arc(T), aB = arc(-T)
      const apT: [number, number, number] = [0, T, 0]
      const apB: [number, number, number] = [0, -T, 0]

      const faces: { pts: [number, number, number][]; fill: string; stroke: string; lw: number }[] = [
        {pts:[apB, ...aB.slice().reverse()], fill:'rgba(2,6,1,.97)', stroke:'rgba(196,255,44,.2)', lw:.7},
        {pts:[apT, aT[0], aB[0], apB], fill:'rgba(4,11,2,.92)', stroke:'rgba(196,255,44,.45)', lw:.8},
        {pts:[apT, apB, aB[N], aT[N]], fill:'rgba(4,11,2,.92)', stroke:'rgba(196,255,44,.45)', lw:.8},
        {pts:[...aT, ...aB.slice().reverse()], fill:'rgba(8,18,3,.95)', stroke:'rgba(196,255,44,.85)', lw:1.4},
        {pts:[apT, ...aT], fill:'rgba(5,14,2,.92)', stroke:'rgba(196,255,44,.7)', lw:1},
      ]
      faces.sort((a, b) => faceZ(a.pts) - faceZ(b.pts))
      faces.forEach(f => fillFace(f.pts, f.fill, f.stroke, f.lw))

      const n1 = proj(0, T + 1, 0), n2 = proj(0, T - 1, 0)
      if (n1.z < n2.z) {
        const sauceRing: [number, number, number][] = []
        for (let i = 0; i <= 12; i++) {
          const a = -ANGLE / 2 + (i / 12) * ANGLE
          sauceRing.push([R * .55 * Math.sin(a), T + .2, R * .55 * Math.cos(a)])
        }
        const sr = sauceRing.map(v => proj(v[0], v[1], v[2]))
        x.beginPath(); sr.forEach((p, i) => i === 0 ? x.moveTo(p.x, p.y) : x.lineTo(p.x, p.y))
        x.strokeStyle = 'rgba(196,255,44,.2)'; x.lineWidth = .8; x.stroke()

        const tops: [number, number, number][] = [[16, T+.3, 24], [-16, T+.3, 24], [0, T+.3, 30], [10, T+.3, 16], [-10, T+.3, 16], [0, T+.3, 18]]
        tops.forEach(([tx, ty, tz]) => {
          const p = proj(tx, ty, tz)
          x.save(); x.translate(p.x, p.y)
          x.strokeStyle = 'rgba(196,255,44,.75)'; x.lineWidth = .9
          x.strokeRect(-2.2, -2.2, 4.4, 4.4)
          x.restore()
        })

        ;[[0, T+.3, 26], [14, T+.3, 20], [-14, T+.3, 20]].forEach(([tx, ty, tz]) => {
          const p = proj(tx, ty, tz)
          x.beginPath(); x.arc(p.x, p.y, 3, 0, Math.PI * 2)
          x.strokeStyle = 'rgba(196,255,44,.5)'; x.lineWidth = .8; x.stroke()
        })
      }

      rot += .011
      raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [])

  return ref
}
