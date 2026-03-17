import { useEffect, useRef } from 'react'

interface NoiseOptions {
  grayscale?: boolean
  interval?: number
  opacity?: number
  amberTint?: boolean
}

export function useNoiseCanvas(opts: NoiseOptions = {}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ref.current
    if (!C) return
    const p = C.parentElement
    if (!p) return

    function resize() {
      if (!C || !p) return
      C.width = p.offsetWidth || 260
      C.height = p.offsetHeight || 400
    }
    resize()

    const ctx = C.getContext('2d')
    if (!ctx) return

    const { grayscale = true, interval = 90, amberTint = false } = opts

    function frame() {
      if (!C || !ctx) return
      const W = C.width, H = C.height
      const id = ctx.createImageData(W, H)
      const d = id.data
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() > (amberTint ? .62 : .44)) {
          if (amberTint) {
            const r = 140 + Math.floor(Math.random() * 115)
            const g = 50 + Math.floor(Math.random() * 60)
            d[i] = r; d[i+1] = g; d[i+2] = 0
            d[i+3] = 60 + Math.floor(Math.random() * 120)
          } else if (grayscale) {
            const v = Math.floor(Math.random() * 100 + 30)
            d[i] = v; d[i+1] = v; d[i+2] = v
            d[i+3] = Math.floor(18 + Math.random() * 38)
          } else {
            const v = Math.floor(Math.random() * 120 + 40)
            d[i] = v; d[i+1] = v; d[i+2] = v
            d[i+3] = Math.floor(25 + Math.random() * 45)
          }
        } else {
          d[i+3] = 0
        }
      }
      ctx.putImageData(id, 0, 0)
      if (amberTint) {
        for (let i = 0; i < 3; i++) {
          if (Math.random() > .7) {
            const y = Math.floor(Math.random() * H)
            ctx.fillStyle = `rgba(255,140,0,${Math.random() * .22})`
            ctx.fillRect(0, y, W, 1 + Math.floor(Math.random() * 2))
          }
        }
      }
    }

    const tid = setInterval(frame, interval)
    frame()

    const handleResize = () => { resize(); frame() }
    window.addEventListener('resize', handleResize)

    return () => {
      clearInterval(tid)
      window.removeEventListener('resize', handleResize)
    }
  }, [opts.grayscale, opts.interval, opts.amberTint])

  return ref
}
