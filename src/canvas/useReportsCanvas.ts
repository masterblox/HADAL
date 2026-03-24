import { useEffect, useRef } from 'react'
import type { PredictionResult } from '@/lib/prediction/types'
import type { Incident } from '@/hooks/useDataPipeline'

const G = '#DAFF4A'
const G2 = 'rgba(218,255,74,'
const AMB2 = 'rgba(255,152,20,'

interface ReportsCanvasOpts {
  prediction: PredictionResult | null
  incidents: Incident[]
}

interface ReportLines {
  serial: string
  dtg: string
  situation: string[]
  judgments: string[]
  outlook: string[]
}

function formatSerial(date: Date, incidentCount: number) {
  const y = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const cnt = String(incidentCount).padStart(3, '0')
  return `HADAL-${y}-${mm}${dd}-${cnt}`
}

function formatDTG(date: Date) {
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${dd}${hh}${mm}Z ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

function deriveReportLines(prediction: PredictionResult | null, incidents: Incident[]): ReportLines {
  const now = new Date()
  if (!prediction || !prediction.sufficient) {
    return {
      serial: formatSerial(now, 0),
      dtg: formatDTG(now),
      situation: ['NO DATA'],
      judgments: ['NO DATA'],
      outlook: ['NO DATA'],
    }
  }

  if (incidents.length === 0) {
    const generatedAt = new Date(prediction.generated)
    return {
      serial: formatSerial(generatedAt, 0),
      dtg: formatDTG(generatedAt),
      situation: ['NO INCIDENTS'],
      judgments: ['NO INCIDENTS'],
      outlook: ['NO INCIDENTS'],
    }
  }

  const genDate = new Date(prediction.generated)
  const level = prediction.theatreThreatLevel >= 80 ? 'CRITICAL'
    : prediction.theatreThreatLevel >= 60 ? 'HIGH'
    : prediction.theatreThreatLevel >= 40 ? 'MEDIUM'
    : 'LOW'

  const situation = [
    `Theatre threat: ${level} (${Math.round(prediction.theatreThreatLevel)}/100).`,
    `Primary driver: ${prediction.dominantScenario || '---'}.`,
    `${prediction.timeWindows.h24.count} events in 24h window.`,
  ]

  const judgments: string[] = []
  if (prediction.scenarios[0]) {
    judgments.push(`• ${prediction.scenarios[0].outcome} (P=${Math.round(prediction.scenarios[0].probability)}%)`)
  }
  if (prediction.scenarios[1]) {
    judgments.push(`• ${prediction.scenarios[1].outcome} (P=${Math.round(prediction.scenarios[1].probability)}%)`)
  }
  judgments.push(`• Cascade risk: ${Math.round(prediction.cascadeRisk.contagionScore)}/100`)
  judgments.push(`• Most active: ${prediction.trendAnalysis?.mostActiveActor ?? '---'}`)

  const escRate = prediction.trendAnalysis?.escalationRate ?? 0
  const trend = escRate > 0.5 ? 'ESCALATING' : escRate > -0.5 ? 'STABLE' : 'DE-ESCALATING'
  const uniqueSources = new Set(incidents.map(i => i.source ?? 'unknown')).size
  const outlook = [
    `72h: ${trend}. Cascade ${Math.round(prediction.cascadeRisk.contagionScore)}/100.`,
    `Sources: ${incidents.length} incidents from ${uniqueSources} feeds`,
  ]

  return {
    serial: formatSerial(genDate, incidents.length),
    dtg: formatDTG(genDate),
    situation,
    judgments,
    outlook,
  }
}

function stamp(ctx: CanvasRenderingContext2D, sx: number, sy: number, code: string) {
  ctx.save()
  ctx.font = '5px "Share Tech Mono"'
  ctx.fillStyle = `${G2}.12)`
  ctx.fillText(`▪ ${code}`, sx, sy)
  ctx.strokeStyle = `${G2}.06)`
  ctx.lineWidth = 0.5
  ctx.strokeRect(sx - 2, sy - 6, code.length * 3.5 + 12, 9)
  ctx.restore()
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, tx: number, ty: number, maxW: number, lineH: number) {
  if (maxW <= 0) {
    ctx.fillText(text, tx, ty)
    return
  }
  const words = text.split(' ')
  let line = ''
  let y = ty
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, tx, y)
      line = word
      y += lineH
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, tx, y)
}

export function useReportsCanvas(opts: ReportsCanvasOpts) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  useEffect(() => {
    if (!canvasRef.current) return

    const DPR = window.devicePixelRatio || 1
    let raf = 0
    let rasterCache: ImageData | null = null
    let rasterCacheW = 0
    let rasterCacheH = 0

    function rasterBase(ctx: CanvasRenderingContext2D, W: number, H: number, alpha: number) {
      if (rasterCache && rasterCacheW === W && rasterCacheH === H) {
        ctx.putImageData(rasterCache, 0, 0)
        return
      }
      ctx.fillStyle = `rgba(6,8,0,${alpha})`
      ctx.fillRect(0, 0, W, H)
      rasterCache = ctx.getImageData(0, 0, W, H)
      rasterCacheW = W
      rasterCacheH = H
    }

    let cachedPrediction: PredictionResult | null = null
    let cachedIncidents: Incident[] | null = null
    let cachedLines: ReportLines | null = null

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
      x.clearRect(0, 0, W, H)

      const prediction = optsRef.current.prediction
      const incidents = optsRef.current.incidents

      if (prediction !== cachedPrediction || incidents !== cachedIncidents) {
        cachedPrediction = prediction
        cachedIncidents = incidents
        cachedLines = deriveReportLines(prediction, incidents)
      }
      const lines = cachedLines!

      rasterBase(x, W, H, 0.12)

      x.save()
      x.font = `bold ${Math.min(W * 0.35, 120)}px "Teko"`
      x.fillStyle = `${G2}.035)`
      x.textAlign = 'center'
      x.fillText('BRIEF', W * 0.5, H * 0.45)
      x.font = `bold ${Math.min(W * 0.25, 80)}px "Teko"`
      x.fillText('INTEL', W * 0.5, H * 0.7)
      x.textAlign = 'left'
      x.restore()

      const barH = 18
      x.fillStyle = `${AMB2}.85)`
      x.fillRect(0, 0, W, barH)
      x.font = 'bold 10px "Teko"'
      x.fillStyle = '#000'
      x.textAlign = 'center'
      x.fillText('SECRET // NOFORN // HADAL-SIGINT', W / 2, 13)
      x.textAlign = 'left'

      const panelX = 12
      const panelY = barH + 10
      const panelW = W - 24
      const panelH = H - barH - 40
      x.fillStyle = 'rgba(5,7,0,.6)'
      x.fillRect(panelX, panelY, panelW, panelH)
      x.strokeStyle = `${G2}.15)`
      x.lineWidth = 1.5
      x.strokeRect(panelX, panelY, panelW, panelH)
      x.fillStyle = `${G2}.25)`
      x.fillRect(panelX, panelY, panelW, 2)

      const hx = panelX + 10
      let hy = panelY + 18
      x.font = 'bold 12px "Teko"'
      x.fillStyle = G
      x.fillText('INTELLIGENCE BRIEFING', hx, hy)

      hy += 14
      x.font = '6px "Share Tech Mono"'
      x.fillStyle = `${G2}.4)`
      x.fillText(`SERIAL: ${lines.serial}`, hx, hy)
      hy += 10
      x.fillText(`DTG:    ${lines.dtg}`, hx, hy)
      hy += 10
      x.fillText('CLASS:  SECRET // REL HADAL', hx, hy)

      hy += 8
      x.strokeStyle = `${G2}.12)`
      x.lineWidth = 1
      x.beginPath()
      x.moveTo(hx, hy)
      x.lineTo(panelX + panelW - 10, hy)
      x.stroke()

      const bodyX = hx
      const maxTextW = panelW - 20
      hy += 14

      x.font = 'bold 9px "Teko"'
      x.fillStyle = `${G2}.6)`
      x.fillText('1. SITUATION', bodyX, hy)
      hy += 4
      x.font = '6px "Share Tech Mono"'
      x.fillStyle = `${G2}.45)`
      for (const line of lines.situation) {
        hy += 10
        drawWrappedText(x, line, bodyX + 4, hy, maxTextW - 8, 10)
        hy += Math.max(0, (Math.ceil(x.measureText(line).width / (maxTextW - 8)) - 1) * 10)
      }

      hy += 14
      x.font = 'bold 9px "Teko"'
      x.fillStyle = `${G2}.6)`
      x.fillText('2. KEY JUDGMENTS', bodyX, hy)
      hy += 4
      x.font = '6px "Share Tech Mono"'
      x.fillStyle = `${G2}.45)`
      for (const line of lines.judgments) {
        hy += 10
        drawWrappedText(x, line, bodyX + 4, hy, maxTextW - 8, 10)
        hy += Math.max(0, (Math.ceil(x.measureText(line).width / (maxTextW - 8)) - 1) * 10)
      }

      hy += 14
      x.font = 'bold 9px "Teko"'
      x.fillStyle = `${G2}.6)`
      x.fillText('3. OUTLOOK', bodyX, hy)
      hy += 4
      x.font = '6px "Share Tech Mono"'
      x.fillStyle = `${G2}.45)`
      for (const line of lines.outlook) {
        hy += 10
        drawWrappedText(x, line, bodyX + 4, hy, maxTextW - 8, 10)
        hy += Math.max(0, (Math.ceil(x.measureText(line).width / (maxTextW - 8)) - 1) * 10)
      }

      const footY = panelY + panelH - 20
      x.fillStyle = `${AMB2}.12)`
      x.fillRect(panelX + 4, footY, panelW - 8, 16)
      x.strokeStyle = `${AMB2}.3)`
      x.lineWidth = 1
      x.strokeRect(panelX + 4, footY, panelW - 8, 16)
      x.font = '6px "Share Tech Mono"'
      x.fillStyle = `${AMB2}.7)`
      x.textAlign = 'center'
      x.fillText('DISTRIBUTION LIMITED — HADAL CONSOLE ONLY', panelX + panelW / 2, footY + 11)
      x.textAlign = 'left'

      stamp(x, 4, H - 8, 'SYS:RPT-BRIEF')

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(draw)
    })
    const parent = canvasRef.current?.parentElement
    if (parent) ro.observe(parent)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return canvasRef
}
