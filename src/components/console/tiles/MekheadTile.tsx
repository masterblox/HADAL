import { useEffect, useRef } from 'react'
import { G, G2, AMB, TAU, rasterBase, stamp, hdSetup } from '@/canvas/canvasKit'

export function MekheadTile() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const vidRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    const vid = vidRef.current
    if (!cv || !vid) return
    const DPR = window.devicePixelRatio || 1

    const offC = document.createElement('canvas')
    const offX = offC.getContext('2d')!
    const blurC = document.createElement('canvas')
    const blurX = blurC.getContext('2d')!
    let lastVidTime = -1
    let vidProcessed = false
    let blurSized = false
    let rafId: number

    function processVideoFrame(W: number, H: number) {
      const vw = vid!.videoWidth, vh = vid!.videoHeight
      if (!vw || !vh) return
      const scale = Math.max(W / vw, H / vh) * 1.05
      const dw = vw * scale, dh = vh * scale
      const dx = (W - dw) / 2 - W * 0.06, dy = (H - dh) / 2 + H * 0.15

      offC.width = W * DPR; offC.height = H * DPR
      offX.setTransform(DPR, 0, 0, DPR, 0, 0)
      offX.clearRect(0, 0, W, H)
      offX.filter = 'grayscale(1) brightness(1.1) contrast(1.35) sepia(0.85) hue-rotate(50deg) saturate(2.8)'
      offX.drawImage(vid!, dx, dy, dw, dh)
      offX.filter = 'none'

      const imgData = offX.getImageData(0, 0, offC.width, offC.height)
      const px = imgData.data
      const threshold = 35
      for (let i = 0; i < px.length; i += 4) {
        const lum = px[i] * 0.3 + px[i + 1] * 0.59 + px[i + 2] * 0.11
        if (lum < threshold) { px[i + 3] = 0 }
        else {
          const boost = Math.min(1, (lum - threshold) / 120)
          px[i] = Math.floor(px[i] * boost * 0.7)
          px[i + 1] = Math.floor(Math.min(255, px[i + 1] * boost * 1.2))
          px[i + 2] = Math.floor(px[i + 2] * boost * 0.4)
          px[i + 3] = Math.floor(boost * 220)
        }
      }
      offX.putImageData(imgData, 0, 0)

      if (!blurSized) { blurC.width = Math.floor(W * DPR * 0.25); blurC.height = Math.floor(H * DPR * 0.25); blurSized = true }
      blurX.clearRect(0, 0, blurC.width, blurC.height)
      blurX.filter = 'blur(8px)'
      blurX.drawImage(offC, 0, 0, blurC.width, blurC.height)
      blurX.filter = 'none'
      vidProcessed = true
    }

    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      const t = Date.now() / 1000

      rasterBase(x, W, H, 0.12, DPR)

      const mcx = W * 0.44, mcy = H * 0.52
      for (let i = 0; i < 700; i++) {
        const nx = Math.random() * W, ny = Math.random() * H
        const distSq = ((nx - mcx) / W) * ((nx - mcx) / W) + ((ny - mcy) / H) * ((ny - mcy) / H)
        const nearCenter = Math.max(0, 1 - distSq * 3.5)
        const alpha = (0.015 + nearCenter * 0.05) * Math.random()
        x.fillStyle = G2 + alpha.toFixed(3) + ')'; x.fillRect(nx, ny, 1, 1)
      }

      const bandY1 = Math.sin(t * 0.3) * H * 0.3 + H * 0.5
      x.fillStyle = G2 + '.012)'; x.fillRect(0, bandY1 - 12, W, 24)
      x.strokeStyle = G2 + '.018)'; x.lineWidth = 0.5
      for (let i = 0; i < W; i += 20) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke() }
      for (let i = 0; i < H; i += 20) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke() }

      // Video
      if (vid && vid.readyState >= 2) {
        const vt = Math.floor(vid.currentTime * 30)
        if (vt !== lastVidTime) { lastVidTime = vt; processVideoFrame(W, H) }
        if (vidProcessed) {
          x.save(); x.globalAlpha = 0.12; x.globalCompositeOperation = 'screen'
          x.drawImage(offC, 0, 0, W * DPR, H * DPR, -W * 0.03, -H * 0.02, W * 1.06, H * 1.04)
          x.restore()
          x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.9
          x.drawImage(offC, 0, 0, W * DPR, H * DPR, 0, 0, W, H)
          x.restore()
          x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.15
          x.drawImage(blurC, 0, 0, W, H)
          x.restore()
        }
      }

      // Top grain
      for (let i = 0; i < 400; i++) { x.fillStyle = G2 + (Math.random() * 0.05).toFixed(3) + ')'; x.fillRect(Math.random() * W, Math.random() * H, 1, 1) }

      // Glitch
      if (Math.random() > 0.78) {
        const gy = Math.floor(Math.random() * H), gh = 3 + Math.floor(Math.random() * 12)
        const gshift = Math.floor(Math.random() * 16) - 8
        try { const slice = x.getImageData(0, gy * DPR, cv.width, gh * DPR); x.putImageData(slice, gshift * DPR, gy * DPR) } catch (_) {}
      }

      // Reticle
      const retCx = W * 0.44, retCy = H * 0.42, retR = Math.min(W, H) * 0.18
      x.strokeStyle = G2 + '.06)'; x.lineWidth = 1; x.setLineDash([3, 8])
      x.beginPath(); x.arc(retCx, retCy, retR, 0, TAU); x.stroke(); x.setLineDash([])
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 0.5
      const ch2 = 6
      x.beginPath(); x.moveTo(retCx - ch2, retCy); x.lineTo(retCx + ch2, retCy); x.stroke()
      x.beginPath(); x.moveTo(retCx, retCy - ch2); x.lineTo(retCx, retCy + ch2); x.stroke()

      // Corners
      const bk = 16, pd = 4
      ;([[pd, pd, 1, 1], [W - pd, pd, -1, 1], [pd, H - pd, 1, -1], [W - pd, H - pd, -1, -1]] as [number, number, number, number][]).forEach(([bx, by, dx, dy]) => {
        x.strokeStyle = G; x.lineWidth = 2
        x.beginPath(); x.moveTo(bx, by + dy * bk); x.lineTo(bx, by); x.lineTo(bx + dx * bk, by); x.stroke()
      })

      // Callouts
      const callouts = [
        { label: 'EAR FINS', jp: 'イヤーフィン', tx: W * 0.12, ty: H * 0.28, mx: W * 0.38, my: H * 0.34 },
        { label: 'SENSOR', jp: 'ブラスセンサー', tx: W * 0.08, ty: H * 0.46, mx: W * 0.35, my: H * 0.46 },
        { label: 'OPTICAL', jp: 'センサー', tx: W * 0.1, ty: H * 0.64, mx: W * 0.38, my: H * 0.58 },
        { label: 'INTERNALS', jp: 'インターナル', tx: W * 0.12, ty: H * 0.8, mx: W * 0.4, my: H * 0.72 },
      ]
      callouts.forEach(co => {
        x.strokeStyle = G2 + '.08)'; x.lineWidth = 0.5
        x.beginPath(); x.moveTo(co.tx + 36, co.ty); x.lineTo(co.mx, co.my); x.stroke()
        x.fillStyle = G2 + '.4)'; x.fillRect(co.mx - 1.5, co.my - 1.5, 3, 3)
        x.fillStyle = 'rgba(6,8,0,.7)'; x.fillRect(co.tx - 2, co.ty - 9, 40, 14)
        x.strokeStyle = G2 + '.06)'; x.lineWidth = 0.5; x.strokeRect(co.tx - 2, co.ty - 9, 40, 14)
        x.font = '4px "Share Tech Mono"'; x.fillStyle = G2 + '.15)'; x.fillText(co.jp, co.tx, co.ty - 2)
        x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.35)'; x.fillText(co.label, co.tx, co.ty + 5)
      })

      // Typewriter
      const fullStr = 'HADAL_MEKHEAD_HD-07_ISR_PROTOTYPE'
      const charCount = Math.floor(t * 3) % (fullStr.length + 8)
      const visStr = fullStr.slice(0, Math.min(charCount, fullStr.length))
      const cursor = charCount <= fullStr.length ? (Math.floor(t * 4) % 2 === 0 ? '_' : ' ') : ''
      x.font = '6px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'; x.fillText('>' + visStr + cursor, 8, H - 38)

      // Classification
      x.fillStyle = 'rgba(6,8,0,.7)'; x.fillRect(6, 6, W * 0.45, 30)
      x.strokeStyle = G2 + '.05)'; x.lineWidth = 0.5; x.strokeRect(6, 6, W * 0.45, 30)
      x.font = 'bold 10px "Teko"'; x.fillStyle = G; x.fillText('HD-07 — MEKHEAD', 12, 20)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'; x.fillText('TACTICAL INTELLIGENCE UNIT', 12, 30)

      // Telemetry
      const rx2 = W * 0.6, rw2 = W * 0.38
      x.fillStyle = 'rgba(6,8,0,.65)'; x.fillRect(rx2, 6, rw2, H * 0.4)
      x.strokeStyle = G2 + '.05)'; x.lineWidth = 0.5; x.strokeRect(rx2, 6, rw2, H * 0.4)
      x.font = '5px "Share Tech Mono"'
      ;(['STATUS:ONLINE:false', 'THREAT:ELEVATED:true', 'CLASS:ISR-MECH:false', 'SCAN:DEGRADED:true', 'INTEG:0.74:false', 'ARCHIVE:LOCKED:false'] as string[]).forEach((row, i) => {
        const [k, v, warn] = row.split(':')
        const ty = 20 + i * 14
        x.fillStyle = G2 + '.18)'; x.fillText(k, rx2 + 6, ty)
        if (warn === 'true' && k === 'THREAT') {
          const pulse = Math.sin(t * 1.5) * 0.15 + 0.55
          x.fillStyle = 'rgba(255,152,20,' + pulse.toFixed(2) + ')'
        } else x.fillStyle = warn === 'true' ? AMB : G2 + '.5)'
        x.fillText(v, rx2 + 50, ty)
      })

      // Amber bar
      x.fillStyle = 'rgba(255,152,20,.05)'; x.fillRect(6, H - 28, W * 0.45, 14)
      x.strokeStyle = 'rgba(255,152,20,.12)'; x.lineWidth = 0.5; x.strokeRect(6, H - 28, W * 0.45, 14)
      x.font = 'bold 5px "Share Tech Mono"'; x.fillStyle = 'rgba(255,152,20,.45)'
      x.fillText('CLASSIFIED — MEKHEAD', 12, H - 19)

      stamp(x, 6, H - 8, 'SYS:HD-07')
      rafId = requestAnimationFrame(draw)
    }

    vid.addEventListener('canplay', draw, { once: true })
    if (vid.readyState >= 3) draw()
    else draw() // Start drawing even without video

    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <video
        ref={vidRef}
        src="/reference-shots/mech-loop.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 10 }} />
    </div>
  )
}
