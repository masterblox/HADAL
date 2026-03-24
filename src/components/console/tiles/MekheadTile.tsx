import { useEffect, useRef } from 'react'
import { G, G2, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

// Symmetric carousel — 61 logical frames around a center pivot
//
// Source assets: f00.jpg (9.0s, strong right) … f29.jpg (11.9s, mild right) + C00.jpg (12.0s, front)
// All left-side frames are the RIGHT frames drawn horizontally mirrored.
// This eliminates the temporal seam: both sides are equidistant from center in video time.
//
//   Index  0: strong left  (f00, mirrored)   ← cursor -1
//   Index 29: mild left    (f29, mirrored)
//   Index 30: CENTER front (C00)              ← cursor  0 / default
//   Index 31: mild right   (f29, normal)
//   Index 60: strong right (f00, normal)      ← cursor +1
//
// Continuity at center: f29 (11.9s) ↔ C00 (12.0s) ↔ f29 mirrored — adjacent frames, no seam.

const F_COUNT   = 30
const F_URLS    = Array.from({ length: F_COUNT }, (_, i) =>
  `/mekhead-frames/f${String(i).padStart(2, '0')}.jpg`)
const C_URL     = `/mekhead-frames/C00.jpg`

const TOTAL_FRAMES = 61   // 30 left + 1 center + 30 right
const CENTER_IDX   = 30

function cursorToFrame(cx: number): number {
  if (Math.abs(cx) < 0.04) return CENTER_IDX
  return Math.round(((cx + 1) / 2) * (TOTAL_FRAMES - 1))
}

export function MekheadTile() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const mouseTargetX = useRef(0)
  const smoothFrame  = useRef<number>(CENTER_IDX)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const DPR = window.devicePixelRatio || 1

    // Pre-load source images (30 f-frames + 1 center)
    const fImgs: HTMLImageElement[] = F_URLS.map(url => {
      const img = new Image(); img.src = url; return img
    })
    const cImg = new Image(); cImg.src = C_URL

    const offC = document.createElement('canvas')
    const offX = offC.getContext('2d')!
    const blurC = document.createElement('canvas')
    const blurX = blurC.getContext('2d')!

    // Flat cache of all 61 pre-processed ImageData objects
    const processedFrames: ImageData[] = []
    let lastProcW = 0, lastProcH = 0
    let blurSized = false
    let rafId: number

    const handleMouse     = (e: MouseEvent) => {
      mouseTargetX.current = (e.clientX / window.innerWidth - 0.5) * 2
    }
    const handleMouseLeave = () => { mouseTargetX.current = 0 }
    document.addEventListener('mousemove', handleMouse)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Process one image → ImageData with green treatment + threshold pass
    // mirror=true flips horizontally so right-side frames become left-facing
    function processImg(img: HTMLImageElement, W: number, H: number, mirror: boolean): ImageData {
      const tw = Math.round(W * DPR)
      const th = Math.round(H * DPR)
      const tmp = document.createElement('canvas')
      tmp.width = tw; tmp.height = th
      const tx = tmp.getContext('2d')!

      const sc  = Math.max(W / img.naturalWidth, H / img.naturalHeight) * 0.90
      const dw  = img.naturalWidth  * sc
      const dh  = img.naturalHeight * sc
      const dx  = (W - dw) / 2
      const dy  = (H - dh) / 2 - H * 0.06   // slight upward nudge — face over torso

      tx.setTransform(DPR, 0, 0, DPR, 0, 0)
      if (mirror) { tx.save(); tx.translate(W, 0); tx.scale(-1, 1) }
      tx.filter = 'grayscale(1) brightness(1.1) contrast(1.35) sepia(0.85) hue-rotate(50deg) saturate(2.8)'
      tx.drawImage(img, dx, dy, dw, dh)
      tx.filter = 'none'
      if (mirror) tx.restore()

      const id = tx.getImageData(0, 0, tw, th)
      const px = id.data
      const threshold = 25
      for (let i = 0; i < px.length; i += 4) {
        const lum = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11
        if (lum < threshold) {
          px[i + 3] = 0
        } else {
          const boost = Math.min(1, (lum - threshold) / 120)
          px[i]     = Math.floor(px[i]     * boost * 0.7)
          px[i + 1] = Math.floor(Math.min(255, px[i + 1] * boost * 1.2))
          px[i + 2] = Math.floor(px[i + 2] * boost * 0.4)
          px[i + 3] = Math.floor(boost * 220)
        }
      }
      return id
    }

    // Build full 61-frame cache — called once when all images are ready and canvas has dimensions
    function buildCache(W: number, H: number): boolean {
      const tw = Math.round(W * DPR), th = Math.round(H * DPR)
      if (tw === lastProcW && th === lastProcH && processedFrames.length === TOTAL_FRAMES) return true
      if (!fImgs.every(img => img.complete && img.naturalWidth > 0)) return false
      if (!cImg.complete || !cImg.naturalWidth) return false

      processedFrames.length = 0
      offC.width = tw; offC.height = th

      // Indices 0..29 — left side: f00..f29 drawn mirrored
      // f00 (strong right mirrored) = strong left; f29 (mild right mirrored) = mild left
      for (let i = 0; i < F_COUNT; i++) {
        processedFrames.push(processImg(fImgs[i], W, H, true))
      }

      // Index 30 — center: C00, no mirror
      processedFrames.push(processImg(cImg, W, H, false))

      // Indices 31..60 — right side: f29..f00 (reversed, no mirror)
      // f29 (mild right) near center; f00 (strong right) at extreme
      for (let i = F_COUNT - 1; i >= 0; i--) {
        processedFrames.push(processImg(fImgs[i], W, H, false))
      }

      lastProcW = tw; lastProcH = th
      return true
    }

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      const t = Date.now() / 1000

      // Adaptive lerp: fast through large gaps (cross-center), slow inside window
      const targetFrame  = cursorToFrame(mouseTargetX.current)
      const frameGap     = Math.abs(targetFrame - smoothFrame.current)
      const lerpFactor   = frameGap > 8 ? 0.35 : 0.22
      smoothFrame.current += (targetFrame - smoothFrame.current) * lerpFactor
      const frameIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(smoothFrame.current)))

      rasterBase(x, W, H, 0.12, DPR)

      // Center-weighted particle haze
      const mcx = W * 0.44, mcy = H * 0.52
      for (let i = 0; i < 700; i++) {
        const nx = Math.random() * W, ny = Math.random() * H
        const distSq = ((nx - mcx) / W) ** 2 + ((ny - mcy) / H) ** 2
        const nearCenter = Math.max(0, 1 - distSq * 3.5)
        const alpha = (0.015 + nearCenter * 0.05) * Math.random()
        x.fillStyle = G2 + alpha.toFixed(3) + ')'; x.fillRect(nx, ny, 1, 1)
      }

      // Chip substrate grid
      x.strokeStyle = G2 + '.016)'; x.lineWidth = 0.5
      for (let i = 0; i < W; i += 20) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke() }
      for (let i = 0; i < H; i += 20) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke() }

      // Scan band shimmer
      const bandY1 = Math.sin(t * 0.3) * H * 0.3 + H * 0.5
      x.fillStyle = G2 + '.012)'; x.fillRect(0, bandY1 - 12, W, 24)

      // Composite — uses pre-processed ImageData, no video seeking ever
      const ready = buildCache(W, H)
      if (ready && processedFrames[frameIdx]) {
        offX.putImageData(processedFrames[frameIdx], 0, 0)

        if (!blurSized) {
          blurC.width  = Math.floor(W * DPR * 0.25)
          blurC.height = Math.floor(H * DPR * 0.25)
          blurSized = true
        }
        blurX.clearRect(0, 0, blurC.width, blurC.height)
        blurX.filter = 'blur(8px)'
        blurX.drawImage(offC, 0, 0, offC.width, offC.height, 0, 0, blurC.width, blurC.height)
        blurX.filter = 'none'

        x.save(); x.globalAlpha = 0.12; x.globalCompositeOperation = 'screen'
        x.drawImage(blurC, -W * 0.03, -H * 0.02, W * 1.06, H * 1.04)
        x.restore()

        x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 1.0
        x.drawImage(offC, 0, 0, W, H)
        x.restore()

        x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.15
        x.drawImage(blurC, 0, 0, W, H)
        x.restore()
      }

      // Fine grain
      for (let i = 0; i < 400; i++) {
        x.fillStyle = G2 + (Math.random() * 0.05).toFixed(3) + ')'
        x.fillRect(Math.random() * W, Math.random() * H, 1, 1)
      }

      // Glitch accent — rare, secondary to motion
      if (Math.random() > 0.997) {
        const gyCss  = Math.floor(Math.random() * (H - 10))
        const ghCss  = 2 + Math.floor(Math.random() * 3)
        const gshift = Math.floor(Math.random() * 5) - 2
        x.save(); x.globalAlpha = 0.30; x.globalCompositeOperation = 'source-over'
        x.drawImage(cv!, 0, gyCss * DPR, cv!.width, ghCss * DPR, gshift, gyCss, W, ghCss)
        x.restore()
      }

      // Hex ring echo
      const hcx = W * 0.50, hcy = H * 0.50
      const hr = Math.min(W, H) * 0.46
      x.strokeStyle = G2 + '.06)'; x.lineWidth = 1; x.setLineDash([5, 14])
      x.beginPath()
      for (let s = 0; s < 6; s++) {
        const a = (Math.PI / 180) * (60 * s - 30)
        const vx = hcx + hr * Math.cos(a), vy = hcy + hr * Math.sin(a)
        if (s === 0) x.moveTo(vx, vy); else x.lineTo(vx, vy)
      }
      x.closePath(); x.stroke(); x.setLineDash([])

      // Hex outline — static, face tracks behind it
      const ov: [number, number][] = [
        [W * 0.2478, H * 0.0732], [W * 0.7522, H * 0.0732],
        [W * 0.9462, H * 0.5000], [W * 0.7522, H * 0.9268],
        [W * 0.2478, H * 0.9268], [W * 0.0538, H * 0.5000],
      ]
      x.strokeStyle = G2 + '.40)'; x.lineWidth = 1.5
      x.beginPath(); ov.forEach(([vx, vy], i) => i === 0 ? x.moveTo(vx, vy) : x.lineTo(vx, vy))
      x.closePath(); x.stroke()

      // Reticle — static
      const retCx = W * 0.48, retCy = H * 0.46
      const retR  = Math.min(W, H) * 0.30
      x.strokeStyle = G2 + '.22)'; x.lineWidth = 1.5; x.setLineDash([4, 10])
      x.beginPath(); x.arc(retCx, retCy, retR, 0, TAU); x.stroke(); x.setLineDash([])
      x.strokeStyle = G2 + '.10)'; x.lineWidth = 1; x.setLineDash([2, 6])
      x.beginPath(); x.arc(retCx, retCy, retR * 0.55, 0, TAU); x.stroke(); x.setLineDash([])
      const ch2 = 12
      x.strokeStyle = G2 + '.16)'; x.lineWidth = 1
      x.beginPath(); x.moveTo(retCx - ch2, retCy); x.lineTo(retCx + ch2, retCy); x.stroke()
      x.beginPath(); x.moveTo(retCx, retCy - ch2); x.lineTo(retCx, retCy + ch2); x.stroke()
      for (let s = 0; s < 6; s++) {
        const a = (Math.PI / 180) * (60 * s - 30)
        const r1 = retR - 9, r2 = retR + 9
        x.strokeStyle = G2 + '.35)'; x.lineWidth = 2
        x.beginPath()
        x.moveTo(retCx + Math.cos(a) * r1, retCy + Math.sin(a) * r1)
        x.lineTo(retCx + Math.cos(a) * r2, retCy + Math.sin(a) * r2)
        x.stroke()
      }

      // Callouts
      const callouts = [
        { label: 'EAR FINS',     jp: 'イヤーフィン',  tx: W * 0.07, ty: H * 0.22, mx: W * 0.38, my: H * 0.34 },
        { label: 'SENSOR ARRAY', jp: 'センサー',       tx: W * 0.05, ty: H * 0.46, mx: W * 0.34, my: H * 0.46 },
        { label: 'OPTICAL',      jp: 'オプティカル',   tx: W * 0.07, ty: H * 0.70, mx: W * 0.36, my: H * 0.60 },
        { label: 'INTERNALS',    jp: 'インターナル',   tx: W * 0.63, ty: H * 0.25, mx: W * 0.64, my: H * 0.38 },
        { label: 'COMBAT AI',    jp: '戦闘 AI',        tx: W * 0.63, ty: H * 0.70, mx: W * 0.62, my: H * 0.60 },
      ]
      callouts.forEach(co => {
        x.strokeStyle = G2 + '.10)'; x.lineWidth = 0.5
        x.beginPath(); x.moveTo(co.tx + 44, co.ty); x.lineTo(co.mx, co.my); x.stroke()
        x.fillStyle = G2 + '.50)'; x.fillRect(co.mx - 2, co.my - 2, 4, 4)
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.18)'; x.fillText(co.jp, co.tx, co.ty - 3)
        x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.45)'; x.fillText(co.label, co.tx, co.ty + 6)
      })

      // Typewriter
      const fullStr   = 'HADAL_MEKHEAD_HD-07_ISR_PROTOTYPE'
      const charCount = Math.floor(t * 3) % (fullStr.length + 8)
      const visStr    = fullStr.slice(0, Math.min(charCount, fullStr.length))
      const csr       = charCount <= fullStr.length ? (Math.floor(t * 4) % 2 === 0 ? '_' : ' ') : ''
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.38)'
      x.fillText('>' + visStr + csr, W * 0.22, H - 32)

      // Status
      x.font = 'bold 8px "Teko"'; x.fillStyle = G; x.fillText('HD-07', W * 0.24, H * 0.12)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.28)'
      x.fillText('MEKHEAD · TRACK · ISR', W * 0.34, H * 0.12)
      x.fillStyle = 'rgba(255,152,20,.45)'; x.fillText('THREAT:ELEVATED', W * 0.22, H - 18)
      x.fillStyle = G2 + '.22)'; x.fillText('INTEG:0.74', W * 0.48, H - 18)
      x.fillStyle = G2 + '.22)'; x.fillText('CLASS:ISR-MECH', W * 0.64, H - 18)

      // Corner brackets
      const bk = 16
      const corners: [number, number, number, number][] = [
        [W * 0.26, H * 0.08, 1, 1], [W * 0.74, H * 0.08, -1, 1],
        [W * 0.26, H * 0.92, 1, -1], [W * 0.74, H * 0.92, -1, -1],
      ]
      corners.forEach(([bx, by, dx, dy]) => {
        x.strokeStyle = G; x.lineWidth = 2
        x.beginPath(); x.moveTo(bx, by + dy * bk); x.lineTo(bx, by); x.lineTo(bx + dx * bk, by); x.stroke()
      })

      // Status dot
      const dotR = Math.sin(t * 1.2) * 0.05 + 0.15
      x.fillStyle = 'rgba(255,152,20,' + dotR.toFixed(2) + ')'
      x.beginPath(); x.arc(retCx, retCy, 3, 0, TAU); x.fill()

      stamp(x, W * 0.24, H - 8, 'SYS:HD-07')
      rafId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(rafId)
      document.removeEventListener('mousemove', handleMouse)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10 }} />
    </div>
  )
}
