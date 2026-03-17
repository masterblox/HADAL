import { useState, useEffect } from 'react'
import { LoginPage } from './components/login/LoginPage'
import { Topbar } from './components/topbar/Topbar'
import { HeroGrid } from './components/hero/HeroGrid'
import { MissileDefenseStrip } from './components/missile/MissileDefenseStrip'
import { SepBand } from './components/sep/SepBand'
import { ThreatFeed } from './components/feed/ThreatFeed'
import { IntelWireSection } from './components/intel/IntelWireSection'
import { EconomicSection } from './components/economic/EconomicSection'
import { PredictorEngine } from './components/predictor/PredictorEngine'
import { AnalysisSection } from './components/analysis/AnalysisSection'
import { RegionalPanel } from './components/regional/RegionalPanel'
import { useDataPipeline } from './hooks/useDataPipeline'
import { usePressureGauge } from './hooks/usePressureGauge'

export function App() {
  const skipLogin = new URLSearchParams(window.location.search).has('bypass')
  const [phase, setPhase] = useState<'login' | 'exploding' | 'terminal'>(skipLogin ? 'terminal' : 'login')
  const [terminalVisible, setTerminalVisible] = useState(false)
  const { prices, incidents, airspace } = useDataPipeline()
  const pressure = usePressureGauge(incidents.length)
  const [sandbox, setSandbox] = useState(false)

  const handleAccess = () => {
    // Explosion started in LoginPage, now begin transition
    setPhase('exploding')
  }

  useEffect(() => {
    if (phase === 'exploding') {
      // Start fading in terminal behind the login overlay
      const t1 = setTimeout(() => setTerminalVisible(true), 800)
      // Remove login overlay after explosion completes
      const t2 = setTimeout(() => setPhase('terminal'), 2400)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [phase])

  return (
    <>
      {/* Terminal always renders once exploding starts (fades in underneath) */}
      {phase !== 'login' && (
        <div className={`terminal-root ${terminalVisible ? 'terminal-visible' : 'terminal-hidden'}`}>
          <div className="scanlines" />
          <Topbar pressure={pressure} sandbox={sandbox} onSandboxToggle={() => setSandbox(s => !s)} />
          <div className="terminal">
            <HeroGrid sandbox={sandbox} />
            <MissileDefenseStrip sandbox={sandbox} />
            <SepBand />
            <ThreatFeed incidents={incidents} />
            <IntelWireSection incidents={incidents} airspace={airspace} sandbox={sandbox} />
            <RegionalPanel />
            <PredictorEngine incidents={incidents} />
            <AnalysisSection incidents={incidents} />
            <EconomicSection prices={prices} sandbox={sandbox} />
          </div>
        </div>
      )}

      {/* Login overlay — sits on top, fades out during explosion */}
      {phase !== 'terminal' && (
        <div className={`login-overlay ${phase === 'exploding' ? 'login-fading' : ''}`}>
          <LoginPage onAccess={handleAccess} />
        </div>
      )}
    </>
  )
}
