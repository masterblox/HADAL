import { useEffect, useRef } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'

const G = '#DAFF4A'
const G2 = 'rgba(218,255,74,'
const AMB = '#FF9814'
const BG = '#050700'
const TAU = Math.PI * 2

function stamp(x: CanvasRenderingContext2D, sx: number, sy: number, code: string) {
  x.save()
  x.font = '5px "Share Tech Mono"'
  x.fillStyle = `${G2}.12)`
  x.fillText(`▪ ${code}`, sx, sy)
  x.strokeStyle = `${G2}.06)`
  x.lineWidth = 0.5
  x.strokeRect(sx - 2, sy - 6, code.length * 3.5 + 12, 9)
  x.restore()
}

export interface StatsCanvasOpts {
  incidents: Incident[]
  prediction: PredictionResult | null
}

export function useStatsCanvas(opts: StatsCanvasOpts) {
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
      const { incidents, prediction } = optsRef.current

      const pW = W * DPR
      const pH = H * DPR
      if (!cachedNoise || cachedW !== pW || cachedH !== pH) {
        cachedNoise = x.createImageData(pW, pH)
        const d = cachedNoise.data
        for (let i = 0; i < d.length; i += 4) {
          const n = Math.random()
          const v = n < 0.06 ? 0.06 + n * 2 : 0
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

      const total = incidents.length
      const verified = incidents.filter(i => i.verificationBadge === 'VERIFIED').length
      const kinetic = incidents.filter(i =>
        ['missile', 'drone', 'cruise', 'airstrike'].includes((i.type ?? '').toLowerCase())
      ).length
      const critical = incidents.filter(i => (i.credibility ?? 0) >= 80).length
      const countries = new Set(incidents.map(i => i.location?.country).filter(Boolean)).size
      const sources = new Set(incidents.map(i => i.source?.split(' ')[0]).filter(Boolean)).size
      const threat = prediction ? Math.round(prediction.theatreThreatLevel) : null
      const cascade = prediction ? Math.round(prediction.cascadeRisk.contagionScore) : null

      x.strokeStyle = `${G2}.03)`
      x.lineWidth = 0.5
      for (let gx = 40; gx < W; gx += 50) {
        x.beginPath()
        x.moveTo(gx, 0)
        x.lineTo(gx, H)
        x.stroke()
      }
      for (let gy = 40; gy < H; gy += 50) {
        x.beginPath()
        x.moveTo(0, gy)
        x.lineTo(W, gy)
        x.stroke()
      }

      const stripX = W * 0.38
      const stripW = W * 0.08
      x.fillStyle = 'rgba(218,255,74,.03)'
      x.fillRect(stripX, 0, stripW, H)
      x.strokeStyle = `${G2}.12)`
      x.lineWidth = 0.5
      x.beginPath()
      x.moveTo(stripX, 0)
      x.lineTo(stripX, H)
      x.moveTo(stripX + stripW, 0)
      x.lineTo(stripX + stripW, H)
      x.stroke()
      x.fillStyle = `${G2}.2)`
      x.fillRect(stripX + 4, H * 0.7, stripW - 8, 3)
      x.fillStyle = `${G2}.1)`
      x.fillRect(stripX + 3, H * 0.22, stripW - 6, 2)
      for (let i = 0; i < 8; i++) {
        x.fillStyle = `${G2}.04)`
        x.fillRect(stripX + 2, H * 0.1 + i * H * 0.1, stripW - 4, 1)
      }

      const ox = W * 0.2
      const oy = H * 0.08
      const ow = W * 0.62
      const oh = H * 0.82
      x.strokeStyle = G
      x.lineWidth = 1.5
      x.strokeRect(ox, oy, ow, oh)

      x.strokeStyle = `${G2}.4)`
      x.lineWidth = 1.2
      x.strokeRect(W * 0.34, H * 0.32, W * 0.22, H * 0.22)

      const tk = 10
      x.strokeStyle = `${G2}.6)`
      x.lineWidth = 0.8
      const corners: Array<[number, number, number, number]> = [
        [ox, oy, 1, 1],
        [ox + ow, oy, -1, 1],
        [ox, oy + oh, 1, -1],
        [ox + ow, oy + oh, -1, -1],
      ]
      for (const [bx, by, dx, dy] of corners) {
        x.beginPath()
        x.moveTo(bx - dx * tk, by)
        x.lineTo(bx + dx * tk, by)
        x.moveTo(bx, by - dy * tk)
        x.lineTo(bx, by + dy * tk)
        x.stroke()
      }

      x.strokeStyle = `${G2}.5)`
      x.lineWidth = 1.5
      x.beginPath()
      x.arc(W * 0.26, H * 0.14, W * 0.02, 0, TAU)
      x.stroke()

      const ix = stripX + 2
      const iy = H * 0.12
      x.strokeStyle = `${G2}.4)`
      x.lineWidth = 0.8
      x.strokeRect(ix, iy, stripW - 4, H * 0.06)
      x.strokeStyle = `${G2}.2)`
      x.lineWidth = 0.5
      for (let p = 0; p < 3; p++) {
        x.beginPath()
        x.moveTo(ix - 4, iy + 4 + p * 6)
        x.lineTo(ix, iy + 4 + p * 6)
        x.stroke()
        x.beginPath()
        x.moveTo(ix + stripW - 4, iy + 4 + p * 6)
        x.lineTo(ix + stripW, iy + 4 + p * 6)
        x.stroke()
      }

      const cells: Array<{ l: string; b: number | null; wx: number; wy: number; w?: number }> = [
        { l: 'INCIDENTS', b: total, wx: W * 0.05, wy: H * 0.18 },
        { l: 'VERIFIED', b: verified, wx: W * 0.05, wy: H * 0.34 },
        { l: 'KINETIC', b: kinetic, wx: W * 0.05, wy: H * 0.50, w: 1 },
        { l: 'CRITICAL', b: critical, wx: W * 0.05, wy: H * 0.66, w: 1 },
        { l: 'COUNTRIES', b: countries, wx: W * 0.66, wy: H * 0.18 },
        { l: 'SOURCES', b: sources, wx: W * 0.66, wy: H * 0.34 },
        { l: 'THREAT', b: threat, wx: W * 0.66, wy: H * 0.50 },
        { l: 'CASCADE', b: cascade, wx: W * 0.66, wy: H * 0.66, w: 1 },
      ]
      const activeP = Math.floor(t * 1.2) % cells.length

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        const isA = i === activeP
        const padS = W * 0.04
        x.fillStyle = isA ? G : `${G2}.5)`
        x.fillRect(cell.wx, cell.wy, padS, padS * 0.85)
        if (!isA) {
          x.fillStyle = BG
          x.fillRect(cell.wx + padS * 0.2, cell.wy + padS * 0.25, padS * 0.6, padS * 0.35)
        }

        x.font = '500 11px "Teko"'
        x.fillStyle = cell.w ? AMB : G
        x.fillText(cell.b == null ? '---' : String(cell.b), cell.wx + padS + 6, cell.wy + padS * 0.65)
        x.font = '5px "Teko"'
        x.fillStyle = `${G2}.3)`
        x.fillText(cell.l, cell.wx + padS + 6, cell.wy + padS * 0.95)

        x.strokeStyle = `${G2}.08)`
        x.lineWidth = 0.5
        x.beginPath()
        if (cell.wx < W * 0.5) {
          x.moveTo(cell.wx + padS, cell.wy + padS * 0.4)
          x.lineTo(ox, cell.wy + padS * 0.4)
        } else {
          x.moveTo(cell.wx, cell.wy + padS * 0.4)
          x.lineTo(ox + ow, cell.wy + padS * 0.4)
        }
        x.stroke()
      }

      const ckx = W * 0.62
      const cky = H * 0.6
      const ckw = W * 0.12
      const ckh = H * 0.12
      const cs = W * 0.02
      for (let r = 0; r < Math.ceil(ckh / cs); r++) {
        for (let cl = 0; cl < Math.ceil(ckw / cs); cl++) {
          x.fillStyle = (r + cl) % 2 === 0 ? G : `${G2}.15)`
          x.fillRect(
            ckx + cl * cs,
            cky + r * cs,
            Math.min(cs, ckw - cl * cs),
            Math.min(cs, ckh - r * cs),
          )
        }
      }

      x.fillStyle = `${G2}.5)`
      const dots: Array<[number, number]> = [
        [W * 0.12, H * 0.15], [W * 0.28, H * 0.28], [W * 0.72, H * 0.15],
        [W * 0.15, H * 0.85], [W * 0.75, H * 0.85], [W * 0.5, H * 0.9],
      ]
      for (const [dx, dy] of dots) x.fillRect(dx, dy, 3, 3)

      stamp(x, 4, H - 28, 'SYS:STATS-DRV')

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [])

  return canvasRef
}
