import { useState } from 'react'
import { Topbar } from './components/topbar/Topbar'
import { HeroGrid } from './components/hero/HeroGrid'
import { MissileDefenseStrip } from './components/missile/MissileDefenseStrip'
import { SepBand } from './components/sep/SepBand'
import { ThreatFeed } from './components/feed/ThreatFeed'
import { IntelWireSection } from './components/intel/IntelWireSection'
import { EconomicSection } from './components/economic/EconomicSection'
import { useDataPipeline } from './hooks/useDataPipeline'
import { usePressureGauge } from './hooks/usePressureGauge'

export function App() {
  const { prices, incidents, airspace } = useDataPipeline()
  const pressure = usePressureGauge(incidents.length)
  const [sandbox, setSandbox] = useState(false)

  return (
    <>
      {/* CRT overlay effects are handled via CSS (body::before grain, body::after vignette, .scanlines) */}
      <div className="scanlines" />

      <Topbar pressure={pressure} sandbox={sandbox} onSandboxToggle={() => setSandbox(s => !s)} />

      <div className="terminal">
        <HeroGrid sandbox={sandbox} />
        <MissileDefenseStrip sandbox={sandbox} />
        <SepBand />
        <ThreatFeed incidents={incidents} />
        <IntelWireSection incidents={incidents} airspace={airspace} sandbox={sandbox} />
        <EconomicSection prices={prices} />
      </div>
    </>
  )
}
