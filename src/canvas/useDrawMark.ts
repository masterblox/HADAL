import { useEffect, useRef } from 'react'

export function useDrawMark(size: number) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ref.current
    if (!C) return
    C.width = size
    C.height = size
    const x = C.getContext('2d')
    if (!x) return

    const cx = size / 2, cy = size / 2, R = size * .38, LW = Math.max(size * .04, .7)
    let t = 0
    let raf: number

    function frame() {
      if (!x) return
      x.clearRect(0, 0, size, size)
      const breath = .5 + Math.sin(t * 1.6) * .5
      const gapHalf = Math.PI * .11, down = Math.PI * .5
      x.beginPath(); x.arc(cx, cy, R, down + gapHalf, down - gapHalf + Math.PI * 2)
      x.strokeStyle = 'rgba(196,255,44,.88)'; x.lineWidth = LW; x.setLineDash([]); x.stroke()
      if (size >= 28) {
        x.beginPath(); x.arc(cx, cy, R * .5, Math.PI * 1.08, Math.PI * 1.92)
        x.strokeStyle = 'rgba(196,255,44,.28)'; x.lineWidth = Math.max(LW * .55, .5)
        x.setLineDash([size * .028, size * .038]); x.stroke(); x.setLineDash([])
      }
      x.beginPath(); x.moveTo(cx, cy - R * .9); x.lineTo(cx, cy + R * .9)
      x.strokeStyle = 'rgba(196,255,44,.2)'; x.lineWidth = Math.max(LW * .5, .4); x.stroke()
      const nadirY = cy + R * .4, nr = Math.max(size * .075, 2.5)
      const glow = x.createRadialGradient(cx, nadirY, 0, cx, nadirY, nr * 3.5)
      glow.addColorStop(0, `rgba(196,255,44,${breath * .28})`); glow.addColorStop(1, 'rgba(196,255,44,0)')
      x.beginPath(); x.arc(cx, nadirY, nr * 3.5, 0, Math.PI * 2); x.fillStyle = glow; x.fill()
      x.beginPath(); x.arc(cx, nadirY, nr, 0, Math.PI * 2)
      x.fillStyle = `rgba(196,255,44,${.6 + breath * .38})`
      x.shadowColor = `rgba(196,255,44,${breath * .45})`; x.shadowBlur = nr * 1.8; x.fill(); x.shadowBlur = 0
      if (size >= 28) {
        [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => {
          x.beginPath()
          x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
          x.lineTo(cx + Math.cos(a) * (R + size * .06), cy + Math.sin(a) * (R + size * .06))
          x.strokeStyle = 'rgba(196,255,44,.3)'; x.lineWidth = Math.max(LW * .8, .5); x.stroke()
        })
      }
      t += .011
      raf = requestAnimationFrame(frame)
    }
    let paused = false
    const onVisChange = () => {
      if (document.hidden) { paused = true; cancelAnimationFrame(raf) }
      else if (paused) { paused = false; frame() }
    }
    document.addEventListener('visibilitychange', onVisChange)

    frame()

    return () => { cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVisChange) }
  }, [size])

  return ref
}
