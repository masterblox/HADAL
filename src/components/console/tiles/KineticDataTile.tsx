import { useEffect, useRef } from 'react'
import { G, G2, PI, stamp, hdSetup } from '@/canvas/canvasKit'
import { DevTag } from '@/components/shared/DevTag'

export function KineticDataTile() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const DPR = window.devicePixelRatio || 1
    let rafId: number
    function draw() {
      const r = hdSetup(cv!, DPR); if (!r) { rafId = requestAnimationFrame(draw); return }
      const { W, H, x } = r
      x.fillStyle = '#020400'; x.fillRect(0, 0, W, H)
      const t = Date.now() / 1000
      const cx = W * 0.5, cy = H * 0.48

      // Noise floor
      for (let i = 0; i < 1200; i++) {
        const nx = Math.random() * W, ny = Math.random() * H
        x.fillStyle = G2 + (Math.random() * 0.05).toFixed(3) + ')'
        x.fillRect(nx, ny, 1, 1)
      }

      // FLIR thermal grid
      x.strokeStyle = G2 + '.03)'; x.lineWidth = 0.5
      for (let i = 0; i < W; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke() }
      for (let i = 0; i < H; i += 16) { x.beginPath(); x.moveTo(0, i); x.lineTo(W, i); x.stroke() }

      // Ground terrain hint
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 12; col++) {
          const bx = col * (W / 12), by = H * 0.3 + row * (H * 0.6 / 8)
          const v = Math.sin(row * 1.3 + col * 0.7 + t * 0.05) * 0.02 + 0.01
          x.fillStyle = G2 + v.toFixed(3) + ')'; x.fillRect(bx, by, W / 12, H * 0.6 / 8)
        }
      }

      // Main reticle
      const boxSize = Math.min(W, H) * 0.32
      const bx1 = cx - boxSize / 2, by1 = cy - boxSize / 2
      x.strokeStyle = G2 + '.25)'; x.lineWidth = 1; x.strokeRect(bx1, by1, boxSize, boxSize)
      const tk = 10
      ;([[bx1, by1, 1, 1], [bx1 + boxSize, by1, -1, 1], [bx1, by1 + boxSize, 1, -1], [bx1 + boxSize, by1 + boxSize, -1, -1]] as [number, number, number, number][]).forEach(([px, py, dx, dy]) => {
        x.strokeStyle = G; x.lineWidth = 2
        x.beginPath(); x.moveTo(px, py + dy * tk); x.lineTo(px, py); x.lineTo(px + dx * tk, py); x.stroke()
      })

      // Crosshair
      x.strokeStyle = G; x.lineWidth = 1
      const gap = 6
      x.beginPath(); x.moveTo(cx - gap, cy); x.lineTo(cx - boxSize * 0.3, cy); x.stroke()
      x.beginPath(); x.moveTo(cx + gap, cy); x.lineTo(cx + boxSize * 0.3, cy); x.stroke()
      x.beginPath(); x.moveTo(cx, cy - gap); x.lineTo(cx, cy - boxSize * 0.3); x.stroke()
      x.beginPath(); x.moveTo(cx, cy + gap); x.lineTo(cx, cy + boxSize * 0.3); x.stroke()
      x.fillStyle = G; x.fillRect(cx - 1, cy - 1, 3, 3)

      // Dashed tracking circle
      x.strokeStyle = G2 + '.12)'; x.lineWidth = 1; x.setLineDash([2, 6])
      x.beginPath(); x.arc(cx, cy, boxSize * 0.55, 0, PI * 2); x.stroke()
      x.setLineDash([])

      // Target vehicle silhouette
      const vw = 18, vh = 8
      x.fillStyle = G2 + '.15)'; x.fillRect(cx - vw / 2 + Math.sin(t * 0.2) * 3, cy - vh / 2, vw, vh)

      // Velocity vector
      const vAng = 0.8 + Math.sin(t * 0.15) * 0.1
      x.strokeStyle = G2 + '.2)'; x.lineWidth = 1; x.setLineDash([2, 3])
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(vAng) * 35, cy + Math.sin(vAng) * 35); x.stroke()
      x.setLineDash([])
      x.fillStyle = G; x.fillRect(cx + Math.cos(vAng) * 35 - 2, cy + Math.sin(vAng) * 35 - 2, 4, 4)

      // Left strip — altitude ladder
      const lx = 10
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1
      x.beginPath(); x.moveTo(lx + 36, H * 0.12); x.lineTo(lx + 36, H * 0.88); x.stroke()
      for (let i = 0; i < 18; i++) {
        const ly = H * 0.12 + i * (H * 0.76 / 17)
        const isMaj = i % 4 === 0
        x.strokeStyle = G2 + (isMaj ? '.2)' : '.06)'); x.lineWidth = isMaj ? 1 : 0.5
        x.beginPath(); x.moveTo(lx + 28, ly); x.lineTo(lx + 36, ly); x.stroke()
        if (isMaj) { x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'; x.fillText(String(420 - i * 5), lx, ly + 2) }
      }
      const altY = H * 0.12 + (H * 0.76) * 0.38
      x.fillStyle = G
      x.beginPath(); x.moveTo(lx + 36, altY); x.lineTo(lx + 28, altY - 4); x.lineTo(lx + 28, altY + 4); x.closePath(); x.fill()
      x.font = 'bold 5px "Share Tech Mono"'; x.fillStyle = G; x.fillText('FL340', lx, altY + 2)

      // Right strip — speed tape
      const rx = W - 10
      x.strokeStyle = G2 + '.08)'; x.lineWidth = 1
      x.beginPath(); x.moveTo(rx - 36, H * 0.12); x.lineTo(rx - 36, H * 0.88); x.stroke()
      for (let i = 0; i < 14; i++) {
        const ly = H * 0.12 + i * (H * 0.76 / 13)
        const isMaj = i % 4 === 0
        x.strokeStyle = G2 + (isMaj ? '.2)' : '.06)'); x.lineWidth = isMaj ? 1 : 0.5
        x.beginPath(); x.moveTo(rx - 36, ly); x.lineTo(rx - 28, ly); x.stroke()
        if (isMaj) { x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.25)'; x.fillText(String(520 - i * 10), rx - 26, ly + 2) }
      }
      const spdY = H * 0.12 + (H * 0.76) * 0.3
      x.fillStyle = G
      x.beginPath(); x.moveTo(rx - 36, spdY); x.lineTo(rx - 28, spdY - 4); x.lineTo(rx - 28, spdY + 4); x.closePath(); x.fill()
      x.font = 'bold 5px "Share Tech Mono"'; x.fillStyle = G; x.fillText('480K', rx - 26, spdY + 2)

      // Top bar
      x.fillStyle = 'rgba(2,4,0,.85)'; x.fillRect(0, 0, W, 18)
      x.strokeStyle = G2 + '.06)'; x.beginPath(); x.moveTo(0, 18); x.lineTo(W, 18); x.stroke()
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.4)'
      const ts = new Date()
      x.fillText('FLIR  ' + ts.toISOString().slice(11, 19) + 'Z', 6, 11)
      x.fillStyle = G2 + '.25)'
      x.fillText('AZ:047.2  EL:-12.4  RNG:8.2NM  FOV:NARROW', W * 0.28, 11)
      x.fillStyle = Math.floor(t) % 2 === 0 ? 'rgba(255,60,40,.7)' : 'rgba(255,60,40,.2)'
      x.fillRect(W - 32, 5, 5, 5)
      x.fillStyle = G2 + '.35)'; x.fillText('REC', W - 24, 11)

      // Bottom bar
      x.fillStyle = 'rgba(2,4,0,.88)'; x.fillRect(0, H - 36, W, 36)
      x.strokeStyle = G2 + '.06)'; x.beginPath(); x.moveTo(0, H - 36); x.lineTo(W, H - 36); x.stroke()
      x.font = 'bold 6px "Teko"'; x.fillStyle = G; x.fillText('TGT: VIPER-21', 8, H - 22)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.35)'
      x.fillText('ICAO:A4F2B8  SQK:7700  HDG:047  GS:480', 8, H - 10)
      const lockOn = Math.floor(t * 2) % 3 !== 0
      x.font = 'bold 7px "Teko"'; x.fillStyle = lockOn ? G : 'rgba(255,152,20,.6)'
      x.fillText(lockOn ? '▪ TRK LOCK' : '▫ ACQUIRING', W - 62, H - 22)
      x.font = '5px "Share Tech Mono"'; x.fillStyle = G2 + '.3)'
      x.fillText('WPN:AGM-114  QTY:2  ARM:HOT', W * 0.45, H - 10)

      // Camera frame corners
      const bf = 14
      ;([[0, 18, 1, 1], [W, 18, -1, 1], [0, H - 36, 1, -1], [W, H - 36, -1, -1]] as [number, number, number, number][]).forEach(([bx2, by2, dx, dy]) => {
        x.strokeStyle = G2 + '.15)'; x.lineWidth = 1.5
        x.beginPath(); x.moveTo(bx2, by2 + dy * bf); x.lineTo(bx2, by2); x.lineTo(bx2 + dx * bf, by2); x.stroke()
      })

      // Random interference line
      if (Math.random() > 0.92) { x.fillStyle = G2 + '.06)'; x.fillRect(0, Math.random() * H, W, 1) }

      stamp(x, 4, H - 6, 'SYS:ISR-CAM')
      rafId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <DevTag id="A.10" />
    </div>
  )
}
