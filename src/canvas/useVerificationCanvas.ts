import { useEffect, useRef } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'

const G = '#DAFF4A'
const G2 = 'rgba(218,255,74,'

interface VerificationCanvasOpts {
  incidents: Incident[]
}

interface SourceFamily {
  name: string
  sigs: number
  rel: number
  glyph: string
}

const FAMILY_NAMES = ['GOVERNMENT', 'NEWS WIRE', 'CHATTER/SOCIAL', 'SENSOR/SIGINT', 'COMMERCIAL', 'UNIFIED FEED'] as const
const FAMILY_GLYPHS: Record<string, string> = {
  GOVERNMENT: '◆',
  'NEWS WIRE': '◈',
  'CHATTER/SOCIAL': '◬',
  'SENSOR/SIGINT': '▣',
  COMMERCIAL: '▤',
  'UNIFIED FEED': '⊞',
}
const FAMILY_ABBREV: Record<string, string> = {
  GOVERNMENT: 'GOV',
  'NEWS WIRE': 'NEWS',
  'CHATTER/SOCIAL': 'CHAT',
  'SENSOR/SIGINT': 'SNSR',
  COMMERCIAL: 'COMM',
  'UNIFIED FEED': 'UNFD',
}

function classifySource(incident: Incident): string {
  if (incident.is_government) return 'GOVERNMENT'
  const src = (incident.source ?? '').toLowerCase()
  if (/news|reuters|bbc|al[\s-]?jazeera|associated press|afp|ap news/.test(src)) return 'NEWS WIRE'
  if (/twitter|telegram|social|x\.com/.test(src)) return 'CHATTER/SOCIAL'
  if (/sensor|sigint|satellite/.test(src)) return 'SENSOR/SIGINT'
  if (/commercial|market/.test(src)) return 'COMMERCIAL'
  return 'UNIFIED FEED'
}

function deriveFamilies(incidents: Incident[]): SourceFamily[] {
  const buckets: Record<string, Incident[]> = {}
  for (const name of FAMILY_NAMES) buckets[name] = []
  for (const inc of incidents) {
    buckets[classifySource(inc)].push(inc)
  }
  return FAMILY_NAMES.map(name => {
    const group = buckets[name]
    const avgRel = group.length > 0
      ? group.reduce((s, i) => s + (i.credibility ?? 0), 0) / group.length / 100
      : 0
    return { name, sigs: group.length, rel: avgRel, glyph: FAMILY_GLYPHS[name] }
  })
}

function deriveCorroboration(families: SourceFamily[], incidents: Incident[]) {
  const activeFamilies = families.filter(f => f.sigs > 0).length
  const agree = `${activeFamilies}/${families.length}`
  const xsrc = incidents.length > 0
    ? (incidents.reduce((s, i) => s + (i.verificationScore ?? 0), 0) / incidents.length / 100).toFixed(2)
    : '---'
  const indep = (activeFamilies / families.length).toFixed(2)
  const unified = activeFamilies >= 3 ? 'YES' : 'NO'
  return [
    `AGREE:  ${agree}`,
    `XSRC:   ${xsrc}`,
    'CONTR:  0',
    `INDEP:  ${indep}`,
    'CONV:   ---',
    `UNIFIED:${unified}`,
  ]
}

function deriveProvenance(incidents: Incident[]): Array<{ t: string; src: string; d: number }> {
  const sorted = incidents
    .filter(i => i.published)
    .sort((a, b) => new Date(b.published!).getTime() - new Date(a.published!).getTime())
    .slice(0, 6)

  if (sorted.length === 0) return []

  const latest = new Date(sorted[0].published!).getTime()
  return sorted.map(inc => {
    const dt = new Date(inc.published!)
    const hh = dt.getUTCHours().toString().padStart(2, '0')
    const mm = dt.getUTCMinutes().toString().padStart(2, '0')
    const diffMin = Math.max(0, Math.round((latest - dt.getTime()) / 60000))
    return {
      t: `${hh}:${mm}Z`,
      src: FAMILY_ABBREV[classifySource(inc)],
      d: Math.min(diffMin, 9),
    }
  })
}

function deriveVerifiedBadge(incidents: Incident[]): string {
  if (incidents.length === 0) return 'NO DATA'
  const counts: Record<string, number> = {}
  for (const inc of incidents) {
    const badge = inc.verificationBadge ?? 'UNCONFIRMED'
    counts[badge] = (counts[badge] ?? 0) + 1
  }
  let best = 'UNCONFIRMED'
  let bestCount = 0
  for (const [k, v] of Object.entries(counts)) {
    if (v > bestCount) {
      best = k
      bestCount = v
    }
  }
  const activeFamilies = new Set(incidents.map(classifySource)).size
  return `${best} — ${activeFamilies} FAMILIES`
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

export function useVerificationCanvas(opts: VerificationCanvasOpts) {
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

    let cachedIncidents: Incident[] | null = null
    let cachedFamilies: ReturnType<typeof deriveFamilies> = []
    let cachedCorrob: string[] = []
    let cachedProv: ReturnType<typeof deriveProvenance> = []
    let cachedBadge = ''

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

      const incidents = optsRef.current.incidents
      rasterBase(x, W, H, 0.12)

      if (incidents !== cachedIncidents) {
        cachedIncidents = incidents
        cachedFamilies = deriveFamilies(incidents)
        cachedCorrob = deriveCorroboration(cachedFamilies, incidents)
        cachedProv = deriveProvenance(incidents)
        cachedBadge = deriveVerifiedBadge(incidents)
      }

      const families = cachedFamilies
      const corrobLines = cachedCorrob
      const provenance = cachedProv
      const badgeText = cachedBadge

      const mx = 6
      const mw = W * 0.48
      const mh = H * 0.14

      families.forEach((f, i) => {
        const my = 52 + i * (mh + 4)
        x.fillStyle = `${G2}.025)`
        x.fillRect(mx, my, mw, mh)
        x.strokeStyle = `${G2}.12)`
        x.lineWidth = 2
        x.strokeRect(mx, my, mw, mh)
        x.fillStyle = f.rel > 0.9 ? `${G2}.4)` : f.rel > 0.7 ? `${G2}.2)` : `${G2}.1)`
        x.fillRect(mx, my, 4, mh)
        x.font = '18px "Share Tech Mono"'
        x.fillStyle = `${G2}.15)`
        x.fillText(f.glyph, mw - 14, my + mh - 6)
        x.font = 'bold 9px "Teko"'
        x.fillStyle = `${G2}.55)`
        x.fillText(f.name, mx + 10, my + 14)

        const displaySigs = Math.min(f.sigs, 10)
        for (let s = 0; s < displaySigs; s++) {
          x.fillStyle = `${G2}.55)`
          x.fillRect(mx + 10 + s * 14, my + 20, 10, 10)
          x.strokeStyle = `${G2}.2)`
          x.strokeRect(mx + 10 + s * 14, my + 20, 10, 10)
        }

        x.fillStyle = `${G2}.05)`
        x.fillRect(mx + 10, my + mh - 14, mw - 24, 6)
        x.fillStyle = `${G2}.45)`
        x.fillRect(mx + 10, my + mh - 14, (mw - 24) * f.rel, 6)
        x.font = '5px "Share Tech Mono"'
        x.fillStyle = `${G2}.3)`
        x.fillText(f.rel > 0 ? `${Math.floor(f.rel * 100)}` : '---', mx + mw - 16, my + mh - 8)

        const cy2 = my + mh / 2
        x.strokeStyle = `${G2}.08)`
        x.lineWidth = 1.5
        x.beginPath()
        x.moveTo(mx + mw + 2, cy2)
        x.lineTo(W * 0.58, cy2)
        x.stroke()
        const midX = mx + mw + 2 + (W * 0.58 - mx - mw - 2) * 0.5
        x.fillStyle = G
        x.fillRect(midX - 4, cy2 - 2.5, 8, 5)
      })

      const rx = W * 0.6
      const rw = W * 0.38
      x.fillStyle = 'rgba(5,7,0,.7)'
      x.fillRect(rx, 48, rw, H - 76)
      x.strokeStyle = `${G2}.15)`
      x.lineWidth = 2
      x.strokeRect(rx, 48, rw, H - 76)
      x.fillStyle = `${G2}.2)`
      x.fillRect(rx, 48, rw, 3)

      x.font = 'bold 9px "Teko"'
      x.fillStyle = `${G2}.5)`
      x.fillText('CORROBORATION', rx + 8, 66)
      x.font = '6px "Share Tech Mono"'
      x.fillStyle = `${G2}.35)`
      corrobLines.forEach((s, i) => x.fillText(s, rx + 8, 84 + i * 14))

      x.font = '6px "Teko"'
      x.fillStyle = `${G2}.35)`
      x.fillText('PROVENANCE', rx + 8, 178)

      if (provenance.length === 0) {
        x.font = '5px "Share Tech Mono"'
        x.fillStyle = `${G2}.25)`
        x.fillText('--- NO DATA ---', rx + 12, 195)
      } else {
        provenance.forEach((ev, i) => {
          const ey = 178 + i * 16
          x.fillStyle = `${G2}.04)`
          x.fillRect(rx + 8, ey, rw - 16, 10)
          x.fillStyle = `${G2}${(0.45 - 0.05 * i).toFixed(2)})`
          x.fillRect(rx + 8 + (ev.d / 9) * 50, ey, 8, 10)
          x.font = '5px "Share Tech Mono"'
          x.fillStyle = `${G2}.25)`
          x.fillText(`${ev.t} ${ev.src}`, rx + 12, ey + 7)
        })
      }

      x.fillStyle = `${G2}.2)`
      x.fillRect(rx + 8, H - 64, rw - 16, 20)
      x.strokeStyle = `${G2}.35)`
      x.strokeRect(rx + 8, H - 64, rw - 16, 20)
      x.font = 'bold 8px "Share Tech Mono"'
      x.fillStyle = G
      x.textAlign = 'center'
      x.fillText(badgeText, rx + rw / 2, H - 50)
      x.textAlign = 'left'

      stamp(x, 4, H - 28, 'SYS:XSRC-V')

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
