import { useEffect, useRef } from 'react'
import { G, G2, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

// Frame sequence — 60 images, linear carousel
// Index 0  = strong left  (L00, ~0.2s)
// Index 28 = mild left    (L28, ~2.1s)
// Index 29 = CENTER front (C00, 12.0s)  ← default
// Index 30 = mild right   (f29, ~11.9s)
// Index 59 = strong right (f00, 9.0s)
const FRAME_URLS: string[] = [
  ...Array.from({ length: 29 }, (_, i) => `/mekhead-frames/L${String(i).padStart(2, '0')}.jpg`),
  `/mekhead-frames/C00.jpg`,
  ...Array.from({ length: 30 }, (_, i) => `/mekhead-frames/f${String(29 - i).padStart(2, '0')}.jpg`),
]
const TOTAL_FRAMES = FRAME_URLS.length  // 60
const CENTER_IDX   = 29

function cursorToFrame(cx: number): number {
  if (Math.abs(cx) < 0.04) return CENTER_IDX
  return Math.round(((cx + 1) / 2) * (TOTAL_FRAMES - 1))
}

export function MekheadTile() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseTargetX  = useRef(0)
  const smoothFrame   = useRef(CENTER_IDX as number)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const DPR = window.devicePixelRatio || 1

    // Pre-loaded raw images
    const rawImgs: HTMLImageElement[] = FRAME_URLS.map(url => {
      const img = new Image()
      img.src = url
      return img
    })

    // Processed frames cache — filled once on first draw after all images are loaded
    const processedFrames: ImageData[] = []
    let lastProcessW = 0, lastProcessH = 0

    const offC = document.createElement('canvas')
    const offX = offC.getContext('2d')!
    const blurC = document.createElement('canvas')
    const blurX = blurC.getContext('2d')!
    let blurSized = false
    let rafId: number

    const handleMouse = (e: MouseEvent) => {
      mouseTargetX.current = (e.clientX / window.innerWidth - 0.5) * 2
    }
    const handleMouseLeave = () => { mouseTargetX.current = 0 }
    document.addEventListener('mousemove', handleMouse)
    document.addEventListener('mouseleave', handleMouseLeave)

    function processAllFrames(W: number, H: number) {
      const tw = Math.round(W * DPR)
      const th = Math.round(H * DPR)
      if (tw === lastProcessW && th === lastProcessH && processedFrames.length === TOTAL_FRAMES) return true

      // Check all images are loaded
      if (!rawImgs.every(img => img.complete && img.naturalWidth > 0)) return false

      offC.width  = tw
      offC.height = th

      const tmpC = document.createElement('canvas')
      const tmpX = tmpC.getContext('2d')!
      tmpC.width  = tw
      tmpC.height = th

      processedFrames.length = 0

      for (const img of rawImgs) {
        const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight) * 0.90
        const dw = img.naturalWidth * scale
        const dh = img.naturalHeight * scale
        const dx = (W - dw) / 2
        const dy = (H - dh) / 2 - H * 0.06  // slight upward nudge — face over torso

        tmpX.setTransform(DPR, 0, 0, DPR, 0, 0)
        tmpX.clearRect(0, 0, W, H)
        tmpX.filter = 'grayscale(1) brightness(1.1) contrast(1.35) sepia(0.85) hue-rotate(50deg) saturate(2.8)'
        tmpX.drawImage(img, dx, dy, dw, dh)
        tmpX.filter = 'none'

        const imgData = tmpX.getImageData(0, 0, tw, th)
        const px = imgData.data
        const threshold = 25
        for (let i = 0; i < px.length; i += 4) {
          const lum = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11
          if (lum < threshold) { px[i + 3] = 0 }
          else {
            const boost = Math.min(1, (lum - threshold) / 120)
            px[i]     = Math.floor(px[i] * boost * 0.7)
            px[i + 1] = Math.floor(Math.min(255, px[i + 1] * boost * 1.2))
            px[i + 2] = Math.floor(px[i + 2] * boost * 0.4)
            px[i + 3] = Math.floor(boost * 220)
          }
        }
        processedFrames.push(imgData)
      }

      lastProcessW = tw
      lastProcessH = th
      return true
    }

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      const t = Date.now() / 1000

      // Smooth frame index — single-stage adaptive lerp
      const targetFrame = cursorToFrame(mouseTargetX.current)
      const frameGap = Math.abs(targetFrame - smoothFrame.current)
      const lerpFactor = frameGap > 8 ? 0.35 : 0.22
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

      // Horizontal scan band shimmer
      const bandY1 = Math.sin(t * 0.3) * H * 0.3 + H * 0.5
      x.fillStyle = G2 + '.012)'; x.fillRect(0, bandY1 - 12, W, 24)

      // Composite frame — pre-process on first call, instant thereafter
      const ready = processAllFrames(W, H)
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
      for (let i = 0; i < 400; i++) { x.fillStyle = G2 + (Math.random() * 0.05).toFixed(3) + ')'; x.fillRect(Math.random() * W, Math.random() * H, 1, 1) }

      // Glitch accent — rare, thin, low alpha
      if (Math.random() > 0.997) {
        const gyCss = Math.floor(Math.random() * (H - 10))
        const ghCss = 2 + Math.floor(Math.random() * 3)
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
      for (let side = 0; side < 6; side++) {
        const angle = (Math.PI / 180) * (60 * side - 30)
        const vx = hcx + hr * Math.cos(angle), vy = hcy + hr * Math.sin(angle)
        if (side === 0) x.moveTo(vx, vy); else x.lineTo(vx, vy)
      }
      x.closePath(); x.stroke(); x.setLineDash([])

      // Hex outline
      const outlineVerts: [number, number][] = [
        [W * 0.2478, H * 0.0732], [W * 0.7522, H * 0.0732],
        [W * 0.9462, H * 0.5000], [W * 0.7522, H * 0.9268],
        [W * 0.2478, H * 0.9268], [W * 0.0538, H * 0.5000],
      ]
      x.strokeStyle = G2 + '.40)'; x.lineWidth = 1.5
      x.beginPath()
      outlineVerts.forEach(([vx, vy], i) => i === 0 ? x.moveTo(vx, vy) : x.lineTo(vx, vy))
      x.closePath(); x.stroke()

      // Reticle
      const retCx = W * 0.48, retCy = H * 0.46
      const retR = Math.min(W, H) * 0.30
      x.strokeStyle = G2 + '.22)'; x.lineWidth = 1.5; x.setLineDash([4, 10])
      x.beginPath(); x.arc(retCx, retCy, retR, 0, TAU); x.stroke(); x.setLineDash([])
      x.strokeStyle = G2 + '.10)'; x.lineWidth = 1; x.setLineDash([2, 6])
      x.beginPath(); x.arc(retCx, retCy, retR * 0.55, 0, TAU); x.stroke(); x.setLineDash([])
      const ch2 = 12
      x.strokeStyle = G2 + '.16)'; x.lineWidth = 1
      x.beginPath(); x.moveTo(retCx - ch2, retCy); x.lineTo(retCx + ch2, retCy); x.stroke()
      x.beginPath(); x.moveTo(retCx, retCy - ch2); x.lineTo(retCx, retCy + ch2); x.stroke()
      for (let side = 0; side < 6; side++) {
        const angle = (Math.PI / 180) * (60 * side - 30)
        const r1 = retR - 9, r2 = retR + 9
        x.strokeStyle = G2 + '.35)'; x.lineWidth = 2
        x.beginPath()
        x.moveTo(retCx + Math.cos(angle) * r1, retCy + Math.sin(angle) * r1)
        x.lineTo(retCx + Math.cos(angle) * r2, retCy + Math.sin(angle) * r2)
        x.stroke()
      }

      // Callouts
      const callouts = [
        { label: 'EAR FINS',     jp: 'イヤーフィン',    tx: W * 0.07, ty: H * 0.22, mx: W * 0.38, my: H * 0.34 },
        { label: 'SENSOR ARRAY', jp: 'センサー',         tx: W * 0.05, ty: H * 0.46, mx: W * 0.34, my: H * 0.46 },
        { label: 'OPTICAL',      jp: 'オプティカル',     tx: W * 0.07, ty: H * 0.70, mx: W * 0.36, my: H * 0.60 },
        { label: 'INTERNALS',    jp: 'インターナル',     tx: W * 0.63, ty: H * 0.25, mx: W * 0.64, my: H * 0.38 },
        { label: 'COMBAT AI',    jp: '戦闘 AI',          tx: W * 0.63, ty: H * 0.70, mx: W * 0.62, my: H * 0.60 },
      ]
      callouts.forEach(co => {
        x.strokeStyle = G2 + '.10)'; x.lineWidth = 0.5
        x.beginPath(); x.moveTo(co.tx + 44, co.ty); x.lineTo(co.mx, co.my); x.stroke()
        x.fillStyle = G2 + '.50)'; x.fillRect(co.mx - 2, co.my - 2, 4, 4)
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.18)'; x.fillText(co.jp, co.tx, co.ty - 3)
        x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.45)'; x.fillText(co.label, co.tx, co.ty + 6)
      })

      // Typewriter
      const fullStr = 'HADAL_MEKHEAD_HD-07_ISR_PROTOTYPE'
      const charCount = Math.floor(t * 3) % (fullStr.length + 8)
      const visStr = fullStr.slice(0, Math.min(charCount, fullStr.length))
      const csr = charCount <= fullStr.length ? (Math.floor(t * 4) % 2 === 0 ? '_' : ' ') : ''
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.38)'; x.fillText('>' + visStr + csr, W * 0.22, H - 32)

      // Status labels
      x.font = 'bold 8px "Teko"'; x.fillStyle = G; x.fillText('HD-07', W * 0.24, H * 0.12)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.28)'; x.fillText('MEKHEAD · TRACK · ISR', W * 0.34, H * 0.12)
      x.fillStyle = 'rgba(255,152,20,.45)'; x.fillText('THREAT:ELEVATED', W * 0.22, H - 18)
      x.fillStyle = G2 + '.22)'; x.fillText('INTEG:0.74', W * 0.48, H - 18)
      x.fillStyle = G2 + '.22)'; x.fillText('CLASS:ISR-MECH', W * 0.64, H - 18)

      // Corner brackets
      const bk = 16
      const hexSafe: [number, number, number, number][] = [
        [W * 0.26, H * 0.08, 1, 1], [W * 0.74, H * 0.08, -1, 1],
        [W * 0.26, H * 0.92, 1, -1], [W * 0.74, H * 0.92, -1, -1],
      ]
      hexSafe.forEach(([bx, by, dx, dy]) => {
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
