import { useEffect, useRef } from 'react'
import { DevTag } from '@/components/shared/DevTag'

const G2 = 'rgba(218,255,74,'

const chs = [
  { l: 'HF/COMINT', t: 'wave' },
  { l: 'RADAR/ELINT', t: 'pulse' },
  { l: 'SIGINT GEO', t: 'dots' },
  { l: 'EW SPECTRUM', t: 'spectrum' },
  { l: 'THREAT RAD', t: 'bars' },
  { l: 'JAM DETECT', t: 'noise' },
  { l: 'DATALINK', t: 'binary' },
  { l: 'FORCE POS', t: 'status' },
]

function drawChannel(cv: HTMLCanvasElement, type: string, DPR: number) {
  const cW = cv.offsetWidth || 80, cH = cv.offsetHeight || 80
  if (cv.width !== cW * DPR || cv.height !== cH * DPR) { cv.width = cW * DPR; cv.height = cH * DPR }
  const xx = cv.getContext('2d'); if (!xx) return
  xx.setTransform(DPR, 0, 0, DPR, 0, 0)
  xx.fillStyle = '#030500'; xx.fillRect(0, 0, cW, cH)
  const t = Date.now() / 1000
  switch (type) {
    case 'wave':
      xx.strokeStyle = G2 + '.6)'; xx.lineWidth = 1.5; xx.beginPath()
      for (let j = 0; j < cW; j++) { const v = Math.sin(j * 0.12 + t * 4) * cH * 0.3 + cH / 2; j === 0 ? xx.moveTo(j, v) : xx.lineTo(j, v) }; xx.stroke()
      xx.strokeStyle = G2 + '.25)'; xx.lineWidth = 1; xx.beginPath()
      for (let j = 0; j < cW; j++) { const v = Math.sin(j * 0.25 + t * 6) * cH * 0.18 + cH / 2; j === 0 ? xx.moveTo(j, v) : xx.lineTo(j, v) }; xx.stroke()
      break
    case 'pulse':
      for (let j = 0; j < cW; j += 2) { const shift = (t * 60) % 20; const h = ((j + shift) % 20) < 4 ? cH * 0.65 : cH * 0.08; xx.fillStyle = G2 + (0.15 + h / cH * 0.5).toFixed(2) + ')'; xx.fillRect(j, cH / 2 - h / 2, 2, h) }
      break
    case 'dots':
      for (let row = 3; row < cH; row += 6) for (let col = 3; col < cW; col += 6) { const v = Math.sin(t * 2 + row * 0.15 + col * 0.1) * 0.5 + 0.5; xx.fillStyle = G2 + (v * 0.6).toFixed(2) + ')'; xx.fillRect(col - 1, row - 1, 2, 2) }
      break
    case 'spectrum':
      for (let col = 0; col < cW; col += 2) { const h = (Math.sin(col * 0.15 + t * 3) * 0.5 + 0.5) * cH * 0.85; const isH = Math.abs(col - cW * 0.4) < 12; xx.fillStyle = isH ? 'rgba(255,152,20,' + (h / cH * 0.6).toFixed(2) + ')' : G2 + (0.1 + h / cH * 0.4).toFixed(2) + ')'; xx.fillRect(col, cH - h, 2, h) }
      break
    case 'bars':
      for (let col = 0; col < cW; col += 4) { const h = (0.2 + Math.random() * 0.5) * cH; const thr = col > cW * 0.55 && col < cW * 0.75; xx.fillStyle = thr ? 'rgba(255,152,20,.5)' : G2 + '.2)'; xx.fillRect(col, cH - h, 3, h) }
      break
    case 'noise':
      for (let j = 0; j < 500; j++) { xx.fillStyle = G2 + (Math.random() * 0.35).toFixed(2) + ')'; xx.fillRect(Math.random() * cW, Math.random() * cH, 2, 2) }
      break
    case 'binary':
      xx.font = '4px "Share Tech Mono"'
      for (let row = 0; row < cH; row += 5) for (let col = 0; col < cW; col += 4) { const on = ((row * 7 + col * 13 + Math.floor(t * 3)) % 5) > 2; xx.fillStyle = on ? G2 + '.5)' : G2 + '.03)'; xx.fillText(on ? '1' : '0', col, row) }
      break
    case 'status':
      for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) { const si = (row * 4 + col + Math.floor(t)) % 5; const cols2 = [G2 + '.5)', G2 + '.08)', G2 + '.5)', 'rgba(255,152,20,.4)', G2 + '.25)']; xx.fillStyle = cols2[si]; xx.fillRect(col * (cW / 4) + 1, row * (cH / 4) + 1, cW / 4 - 2, cH / 4 - 2) }
      break
  }
}

export function MilitarySignalsTile() {
  const gridRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<HTMLCanvasElement[]>([])
  const rafIds = useRef<number[]>([])

  useEffect(() => {
    const DPR = window.devicePixelRatio || 1
    const canvases = canvasRefs.current

    canvases.forEach((cv, i) => {
      if (!cv) return
      const type = chs[i].t
      const loop = () => { drawChannel(cv, type, DPR); rafIds.current[i] = requestAnimationFrame(loop) }
      rafIds.current[i] = requestAnimationFrame(loop)
    })

    return () => { rafIds.current.forEach(id => cancelAnimationFrame(id)) }
  }, [])

  return (
    <div
      ref={gridRef}
      style={{
        position: 'absolute',
        inset: '52px 0 28px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: '1fr 1fr',
        gap: 2,
        padding: 2,
        background: 'rgba(218,255,74,.05)',
        zIndex: 1,
      }}
    >
      {chs.map((ch, i) => (
        <div
          key={ch.l}
          style={{ position: 'relative', overflow: 'hidden', background: '#030500', border: '1px solid rgba(218,255,74,.06)' }}
        >
          <div
            style={{
              position: 'absolute', top: 1, left: 2, fontSize: 5, letterSpacing: 2,
              color: 'rgba(218,255,74,.3)', zIndex: 2, fontFamily: '"Share Tech Mono"',
            }}
          >
            {ch.l}
          </div>
          <canvas
            ref={el => { if (el) canvasRefs.current[i] = el }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      ))}
      <DevTag id="A.15" />
    </div>
  )
}
