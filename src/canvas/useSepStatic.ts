import { useEffect, useRef } from 'react'

export function useSepStatic() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const C = ref.current
    if (!C) return
    const parent = C.parentElement
    function sz() {
      if (!C || !parent) return
      C.width = parent.offsetWidth || 800
      C.height = 80
    }
    sz()
    window.addEventListener('resize', sz)
    const ctx = C.getContext('2d')
    if (!ctx) return

    function frame() {
      if (!C || !ctx) return
      const W = C.width, H = C.height
      const id = ctx.createImageData(W, H), d = id.data
      for (let i = 0; i < d.length; i += 4) {
        if (Math.random() > .42) {
          const v = Math.floor(Math.random() * 130 + 40)
          d[i] = v; d[i+1] = v; d[i+2] = v
          d[i+3] = Math.random() > .55 ? Math.floor(30 + Math.random() * 55) : 0
        }
      }
      ctx.putImageData(id, 0, 0)
      for (let i = 0; i < 2; i++) {
        if (Math.random() > .7) {
          const y = Math.floor(Math.random() * H)
          ctx.fillStyle = `rgba(180,180,180,${Math.random() * .14})`
          ctx.fillRect(0, y, W, 1 + Math.floor(Math.random() * 2))
        }
      }
    }

    const tid = setInterval(frame, 55)
    frame()

    return () => {
      clearInterval(tid)
      window.removeEventListener('resize', sz)
    }
  }, [])

  return ref
}
