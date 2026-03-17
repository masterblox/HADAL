import { useState, useEffect, useRef } from 'react'
import { SonarParticles } from './SonarParticles'

const ACCESS_CODE = '0000'

interface LoginPageProps {
  onAccess: () => void
}

export function LoginPage({ onAccess }: LoginPageProps) {
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [entering, setEntering] = useState(false)
  const markRef = useRef<HTMLCanvasElement>(null)

  // Draw HADAL mark — small, single color, per rule 005
  useEffect(() => {
    const c = markRef.current
    if (!c) return
    const x = c.getContext('2d')
    if (!x) return
    c.width = 48; c.height = 48
    const cx = 24, cy = 24
    x.beginPath(); x.arc(cx, cy, 20, 0, Math.PI * 2)
    x.strokeStyle = 'rgba(196,255,44,.3)'; x.lineWidth = 1; x.stroke()
    x.beginPath(); x.arc(cx, cy, 12, 0, Math.PI * 2)
    x.strokeStyle = 'rgba(196,255,44,.15)'; x.lineWidth = 0.5; x.stroke()
    x.beginPath()
    x.moveTo(cx, cy - 22); x.lineTo(cx, cy + 22)
    x.moveTo(cx - 22, cy); x.lineTo(cx + 22, cy)
    x.strokeStyle = 'rgba(196,255,44,.12)'; x.lineWidth = 0.5; x.stroke()
    x.beginPath(); x.arc(cx, cy, 2, 0, Math.PI * 2)
    x.fillStyle = '#C4FF2C'; x.fill()
  }, [])

  const pressDigit = (d: string) => {
    if (entering || digits.length >= 4) return
    const next = [...digits, d]
    setDigits(next)
    setError(false)

    if (next.length === 4) {
      const code = next.join('')
      if (code === ACCESS_CODE) {
        setEntering(true)
        // Card fades out, then notify parent to fade overlay
        setTimeout(onAccess, 500)
      } else {
        setError(true)
        setTimeout(() => { setDigits([]); setError(false) }, 800)
      }
    }
  }

  const pressClear = () => {
    if (entering) return
    setDigits([])
    setError(false)
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') pressDigit(e.key)
      if (e.key === 'Backspace' || e.key === 'Delete') pressClear()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  return (
    <div className="login-page">
      <SonarParticles />

      <div className={`login-card ${entering ? 'entering' : ''} ${error ? 'error-shake' : ''}`}>
        <canvas ref={markRef} className="login-mark" />
        <div className="login-title">HADAL</div>
        <div className="login-subtitle">THREAT INTELLIGENCE TERMINAL</div>

        {/* Digit display */}
        <div className="keypad-display jp-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`keypad-dot jp-dot ${digits[i] ? 'filled' : ''} ${error ? 'dot-error error' : ''} ${entering ? 'dot-success success' : ''}`}>
              {digits[i] ? '●' : '○'}
            </div>
          ))}
        </div>

        {/* Keypad */}
        <div className="keypad-grid jp-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', '⏎'].map(key => (
            <button
              key={key}
              className={`keypad-btn jp-key ${key === 'CLR' ? 'key-fn jp-key-clear' : ''} ${key === '⏎' ? 'key-fn jp-key-enter' : ''}`}
              onClick={() => {
                if (key === 'CLR') pressClear()
                else if (key === '⏎') { /* auto-submit on 4 digits */ }
                else pressDigit(key)
              }}
              disabled={entering}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="login-status jp-status-row">
          <span className={`login-dot jp-status-dot ${entering ? 'dot-flash active' : 'active'}`} />
          <span className="jp-status-text">{entering ? 'ACCESS GRANTED' : 'ENTER ACCESS CODE'}</span>
        </div>
      </div>

      <div className={`login-tagline ${entering ? 'tagline-fade' : ''}`}>Intelligence lives in the dark.</div>
    </div>
  )
}
