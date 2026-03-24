import { useEffect, useRef } from 'react'

const G = '#DAFF4A'
const G2 = 'rgba(218,255,74,'
const AMB = '#FF9814'
const BG = '#050700'

export interface EseCanvasOpts {
  threatLevel: number | null
  incidentCount: number
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean }
}

export function useEseCanvas(opts: EseCanvasOpts) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  useEffect(() => {
    if (!canvasRef.current) return

    const DPR = window.devicePixelRatio || 1
    let raf = 0
    let cachedNoise: ImageData | null = null
    let cachedW = 0
    let cachedH = 0

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) return
      const el = canvas.parentElement
      if (!el) return
      const W = el.clientWidth
      const H = el.clientHeight
      if (W === 0 || H === 0) {
        raf = requestAnimationFrame(draw)
        return
      }

      canvas.width = W * DPR
      canvas.height = H * DPR
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`

      const x = canvas.getContext('2d')
      if (!x) return
      x.setTransform(DPR, 0, 0, DPR, 0, 0)

      const t = Date.now() / 1000
      const o = optsRef.current
      const tl = o.threatLevel ?? 0
      const incidentCount = o.incidentCount
      const pipeline = o.pipelineStatus

      const sigN = incidentCount > 0 ? incidentCount : 7
      const evtN = incidentCount > 0 ? Math.ceil(incidentCount * 0.3) : 1
      const entN = incidentCount > 0 ? Math.ceil(incidentCount * 0.5) : 4
      const pulseSpeed = 60 + tl * 0.6

      const pW = W * DPR
      const pH = H * DPR
      if (!cachedNoise || cachedW !== pW || cachedH !== pH) {
        cachedNoise = x.createImageData(pW, pH)
        const d = cachedNoise.data
        const density = 0.08
        for (let i = 0; i < d.length; i += 4) {
          const n = Math.random()
          const v = n < density ? 0.06 + n * 2 : 0
          d[i] = Math.floor(218 * v * 0.5)
          d[i + 1] = Math.floor(255 * v)
          d[i + 2] = Math.floor(74 * v * 0.3)
          d[i + 3] = 255
        }
        cachedW = pW
        cachedH = pH
      }
      x.putImageData(cachedNoise, 0, 0)
      x.setTransform(DPR, 0, 0, DPR, 0, 0)

      x.strokeStyle = `${G2}.04)`
      x.lineWidth = 1
      for (let i = 0; i < W; i += 10) {
        x.beginPath()
        x.moveTo(i, 0)
        x.lineTo(i, H)
        x.stroke()
      }
      for (let i = 0; i < H; i += 10) {
        x.beginPath()
        x.moveTo(0, i)
        x.lineTo(W, i)
        x.stroke()
      }

      const buses = [
        { y: H * 0.2, label: 'SIG', n: sigN },
        { y: H * 0.5, label: 'EVT', n: evtN },
        { y: H * 0.8, label: 'ENT', n: entN },
      ]

      buses.forEach((b, bi) => {
        x.fillStyle = `${G2}.03)`
        x.fillRect(0, b.y - 6, W, 12)
        x.strokeStyle = `${G2}.25)`
        x.lineWidth = 3
        x.beginPath()
        x.moveTo(0, b.y)
        x.lineTo(W, b.y)
        x.stroke()
        x.strokeStyle = `${G2}.08)`
        x.lineWidth = 1
        x.beginPath()
        x.moveTo(0, b.y - 4)
        x.lineTo(W, b.y - 4)
        x.stroke()
        x.beginPath()
        x.moveTo(0, b.y + 4)
        x.lineTo(W, b.y + 4)
        x.stroke()
        x.fillStyle = `${G2}.06)`
        x.fillRect(2, b.y - 14, 30, 10)
        x.font = 'bold 9px "Teko"'
        x.fillStyle = `${G2}.5)`
        x.fillText(`${b.label} ×${b.n}`, 4, b.y - 6)

        for (let p = 0; p < 5; p++) {
          const px = (t * pulseSpeed + p * 65 + bi * 50) % W
          x.fillStyle = G
          x.fillRect(px - 8, b.y - 2.5, 16, 5)
          x.fillStyle = `${G2}.3)`
          x.fillRect(px - 32, b.y - 1.5, 24, 3)
          x.fillStyle = `${G2}.1)`
          x.fillRect(px - 56, b.y - 1, 24, 2)
        }
      })

      const vxPositions = [W * 0.18, W * 0.32, W * 0.48, W * 0.62, W * 0.78]
      vxPositions.forEach((vx, i) => {
        x.strokeStyle = `${G2}.1)`
        x.lineWidth = 1.5
        x.beginPath()
        x.moveTo(vx, H * 0.2)
        x.lineTo(vx, H * 0.5)
        x.stroke()
        x.beginPath()
        x.moveTo(vx, H * 0.5)
        x.lineTo(vx, H * 0.8)
        x.stroke()

        const junctionYs = [H * 0.2, H * 0.5, H * 0.8]
        junctionYs.forEach(py => {
          x.fillStyle = `${G2}.6)`
          x.fillRect(vx - 4, py - 4, 8, 8)
          x.fillStyle = BG
          x.fillRect(vx - 1.5, py - 1.5, 3, 3)
        })

        const p1 = (t * 0.5 + i * 0.13) % 1
        x.fillStyle = G
        x.fillRect(vx - 3, H * 0.2 + H * 0.3 * p1 - 3, 6, 6)
        const p2 = (t * 0.4 + i * 0.17 + 0.5) % 1
        x.fillRect(vx - 3, H * 0.5 + H * 0.3 * p2 - 3, 6, 6)
      })

      const ics = [
        { px: W * 0.25, py: H * 0.35, label: 'FUSE' },
        { px: W * 0.55, py: H * 0.35, label: 'DEDUP' },
        { px: W * 0.4, py: H * 0.65, label: 'GRAPH' },
        { px: W * 0.7, py: H * 0.65, label: 'NORM' },
      ]
      ics.forEach(ic => {
        const w = 52
        const h = 26
        x.fillStyle = `${G2}.06)`
        x.fillRect(ic.px - w / 2, ic.py - h / 2, w, h)
        x.strokeStyle = `${G2}.4)`
        x.lineWidth = 2
        x.strokeRect(ic.px - w / 2, ic.py - h / 2, w, h)
        for (let p = 0; p < 5; p++) {
          x.fillStyle = `${G2}.35)`
          x.fillRect(ic.px - w / 2 - 4, ic.py - h / 2 + 3 + p * 4, 3, 2)
          x.fillRect(ic.px + w / 2 + 1, ic.py - h / 2 + 3 + p * 4, 3, 2)
        }
        x.font = 'bold 8px "Teko"'
        x.fillStyle = G
        x.textAlign = 'center'
        x.fillText(ic.label, ic.px, ic.py + 3)
        x.textAlign = 'left'
      })

      const severity = tl >= 80 ? 'CRITICAL' : tl >= 60 ? 'HIGH' : tl >= 40 ? 'MEDIUM' : tl > 0 ? 'LOW' : '---'

      x.fillStyle = 'rgba(5,7,0,.7)'
      x.fillRect(W - 100, 54, 94, H - 80)
      x.strokeStyle = `${G2}.12)`
      x.strokeRect(W - 100, 54, 94, H - 80)
      x.font = '6px "Teko"'
      x.fillStyle = `${G2}.4)`
      x.fillText('EVT RECORD', W - 94, 68)

      const rows: [string, string, boolean][] = [
        ['ID', incidentCount > 0 ? `EVT-${String(incidentCount).padStart(5, '0')}` : '---', false],
        ['TYPE', incidentCount > 0 ? 'MULTI' : '---', false],
        ['SEV', severity, severity === 'CRITICAL'],
        ['SIG', incidentCount > 0 ? `${sigN} FUSED` : '---', false],
        ['ENT', incidentCount > 0 ? `${entN} LINKED` : '---', false],
        ['', '', false],
        ['INC', pipeline.incidents ? 'LIVE' : 'OFF', !pipeline.incidents],
        ['MKT', pipeline.prices ? 'LIVE' : 'OFF', !pipeline.prices],
        ['AIR', pipeline.airspace ? 'LIVE' : 'OFF', !pipeline.airspace],
        ['', '', false],
        ['SIG-001', incidentCount > 0 ? 'GOV' : '---', false],
        ['SIG-002', incidentCount > 0 ? 'SNSR' : '---', false],
        ['SIG-003', incidentCount > 0 ? 'NEWS' : '---', false],
        ['SIG-004', incidentCount > 0 ? 'OSINT' : '---', false],
      ]

      x.font = '5px "Share Tech Mono"'
      rows.forEach((row, i) => {
        if (!row[0] && !row[1]) return
        x.fillStyle = `${G2}.2)`
        x.fillText(row[0], W - 94, 80 + i * 13)
        x.fillStyle = row[2] ? AMB : `${G2}.45)`
        x.fillText(row[1], W - 58, 80 + i * 13)
      })

      x.save()
      x.font = '5px "Share Tech Mono"'
      x.fillStyle = `${G2}.12)`
      x.fillText('▪ SYS:ESE-ARCH', 4, H - 28)
      x.strokeStyle = `${G2}.06)`
      x.lineWidth = 0.5
      x.strokeRect(2, H - 34, 'SYS:ESE-ARCH'.length * 3.5 + 12, 9)
      x.restore()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [])

  return canvasRef
}
