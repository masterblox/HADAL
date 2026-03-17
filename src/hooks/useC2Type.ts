import { useState, useEffect, useCallback } from 'react'

export function useC2Type(target: number, delay: number) {
  const [display, setDisplay] = useState(target)

  const scramble = useCallback(() => {
    let f = 0
    const run = () => {
      if (f < 8) {
        setDisplay(Math.floor(Math.random() * (target * 1.4)))
        f++
        setTimeout(run, 55)
      } else {
        setDisplay(target)
      }
    }
    run()
  }, [target])

  useEffect(() => {
    const initTimeout = setTimeout(scramble, delay)
    const interval = setInterval(scramble, 7000 + delay)
    return () => { clearTimeout(initTimeout); clearInterval(interval) }
  }, [scramble, delay])

  return display
}
