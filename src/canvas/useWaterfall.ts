import { useEffect, useRef, useCallback } from 'react'

const BANDS = 4
const COLS = 120

export function useWaterfall() {
  const cvRef = useRef<HTMLCanvasElement | null>(null)
  const gridRef = useRef<number[][]>(
    Array.from({ length: COLS }, () =>
      Array.from({ length: BANDS }, () => Math.random() * 0.12)
    )
  )

  useEffect(() => {
    let id = 0
    let running = true

    function tick() {
      if (!running) return
      const cv = cvRef.current
      if (!cv) { id = requestAnimationFrame(tick); return }
      const ctx = cv.getContext('2d')
      if (!ctx) return

      const w = cv.width, h = cv.height
      const grid = gridRef.current
      const bandH = h / BANDS
      const colW = w / COLS

      // Advance: shift left, push new column
      grid.shift()
      grid.push(
        Array.from({ length: BANDS }, () => {
          let v = Math.random() * 0.12
          // Occasional signal hit (~6% per band)
          if (Math.random() < 0.06) v = 0.35 + Math.random() * 0.35
          // Rare anomaly (~1.2%)
          if (Math.random() < 0.012) v = 0.8 + Math.random() * 0.2
          return v
        })
      )

      // Clear
      ctx.fillStyle = '#060800'
      ctx.fillRect(0, 0, w, h)

      // Draw waterfall cells
      for (let c = 0; c < COLS; c++) {
        for (let b = 0; b < BANDS; b++) {
          const v = grid[c][b]
          let r: number, g: number, bl: number
          if (v < 0.3) {
            // Black to dark green
            r = 0
            g = Math.floor(v * 280)
            bl = 0
          } else if (v < 0.7) {
            // Dark green to bright green
            const t = (v - 0.3) / 0.4
            r = Math.floor(t * 80)
            g = Math.floor(80 + t * 175)
            bl = Math.floor(t * 20)
          } else {
            // Bright green to orange (anomaly)
            const t = (v - 0.7) / 0.3
            r = Math.floor(80 + t * 175)
            g = Math.floor(255 - t * 115)
            bl = Math.floor(20 - t * 20)
          }
          ctx.fillStyle = `rgb(${r},${g},${bl})`
          ctx.fillRect(c * colW, b * bandH, colW + 0.5, bandH - 0.5)
        }
      }

      // Band labels
      ctx.font = '7px Share Tech Mono'
      ctx.fillStyle = 'rgba(196,255,44,.45)'
      const labels = ['HF', 'VHF', 'UHF', 'SHF']
      for (let i = 0; i < BANDS; i++) {
        ctx.fillText(labels[i], 2, i * bandH + 9)
      }

      // Scanline overlay
      for (let y = 0; y < h; y += 3) {
        ctx.fillStyle = 'rgba(0,0,0,.06)'
        ctx.fillRect(0, y, w, 1)
      }

      // Throttle to ~4fps for scroll effect
      setTimeout(() => {
        if (running) id = requestAnimationFrame(tick)
      }, 200)
    }

    const onVisChange = () => {
      if (document.hidden) { running = false; cancelAnimationFrame(id) }
      else if (!running) { running = true; id = requestAnimationFrame(tick) }
    }
    document.addEventListener('visibilitychange', onVisChange)

    id = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(id)
      document.removeEventListener('visibilitychange', onVisChange)
    }
  }, [])

  return useCallback((el: HTMLCanvasElement | null) => {
    cvRef.current = el
  }, [])
}
