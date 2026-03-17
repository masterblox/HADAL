import { useState, useEffect } from 'react'

export function useCasualtyCounter(target: number, delayMs = 800) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (target <= 0) return
    const timeout = setTimeout(() => {
      let cur = 0
      let raf: number
      const step = () => {
        cur = Math.min(cur + Math.ceil(target / 60), target)
        setValue(cur)
        if (cur < target) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
    }, delayMs)
    return () => clearTimeout(timeout)
  }, [target, delayMs])

  return value
}
