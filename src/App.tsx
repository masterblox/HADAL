import { useState, useEffect, useSyncExternalStore, lazy, Suspense } from 'react'
import { LoginPage } from './components/login/LoginPage'
import { Topbar } from './components/topbar/Topbar'
import { OverviewPage } from './pages/OverviewPage'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { useDataPipeline } from './hooks/useDataPipeline'
import { usePrediction } from './hooks/usePrediction'
import { parseLane, subscribeHash, type Lane, navigateTo } from './lib/lane-routing'

/* Lane-level code splitting — Operations and Console load on demand */
const OperationsPage = lazy(() => import('./pages/OperationsPage').then(m => ({ default: m.OperationsPage })))
const ConsolePage = lazy(() => import('./pages/ConsolePage').then(m => ({ default: m.ConsolePage })))

function useHashRoute(): Lane {
  return useSyncExternalStore(subscribeHash, parseLane)
}

const LANE_TITLES: Record<Lane, string> = {
  overview: 'Overview',
  operations: 'Operations',
  console: 'Console',
}

/* ── App ── */
export function App() {
  const skipLogin = new URLSearchParams(window.location.search).has('bypass')
  const [phase, setPhase] = useState<'login' | 'unlocked' | 'terminal'>(skipLogin ? 'terminal' : 'login')
  const [terminalVisible, setTerminalVisible] = useState(skipLogin)
  const { prices, incidents, airspace, health } = useDataPipeline()
  const prediction = usePrediction(incidents, airspace, prices)
  const threatLevel = prediction?.theatreThreatLevel ?? null
  const [sandbox, setSandbox] = useState(false)
  const activeLane = useHashRoute()

  // Set default hash if none present
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = 'overview'
    }
  }, [])

  useEffect(() => {
    document.title = `HADAL · ${LANE_TITLES[activeLane]}`
  }, [activeLane])

  const handleAccess = () => {
    setPhase('unlocked')
  }

  useEffect(() => {
    if (phase === 'unlocked') {
      const t = setTimeout(() => {
        setTerminalVisible(true)
        setPhase('terminal')
      }, 300)
      return () => clearTimeout(t)
    }
  }, [phase])

  const pipelineStatus = {
    incidents: health.incidents !== 'offline',
    prices: health.prices !== 'offline',
    airspace: health.airspace !== 'offline',
    health,
  }

  return (
    <ErrorBoundary>
      {terminalVisible && (
        <div className="terminal-root terminal-visible">
          <div className="scanlines" />
          <div className="class-banner">
            <span className="class-banner-text">// TOP SECRET // SCI // NOFORN // HADAL-GULF-THEATRE // TS/SCI //</span>
            <div className="class-banner-gauge">
              <span className="class-banner-gauge-label">THREAT LEVEL</span>
              <div className="class-banner-gauge-track">
                <div className="class-banner-gauge-fill" style={{ width: `${threatLevel ?? 0}%` }} />
              </div>
              <span className="class-banner-gauge-val">{threatLevel ?? '—'}</span>
            </div>
          </div>
          <Topbar
            threatLevel={threatLevel}
            incidentCount={incidents.length}
            sandbox={sandbox}
            onSandboxToggle={() => setSandbox(s => !s)}
            activeLane={activeLane}
            onNavigate={navigateTo}
          />
          <div className="terminal">
            {activeLane === 'overview' && (
              <OverviewPage
                sandbox={sandbox}
                threatLevel={threatLevel}
                pipelineStatus={pipelineStatus}
                prediction={prediction}
                incidents={incidents}
                prices={prices}
                airspace={airspace}
              />
            )}
            <Suspense fallback={null}>
              {activeLane === 'operations' && (
                <OperationsPage
                  incidents={incidents}
                  airspace={airspace}
                  prices={prices}
                  sandbox={sandbox}
                />
              )}
              {activeLane === 'console' && (
                <ConsolePage
                  threatLevel={threatLevel}
                  pipelineStatus={pipelineStatus}
                  incidents={incidents}
                  airspace={airspace}
                  prices={prices}
                  prediction={prediction}
                  sandbox={sandbox}
                  onSandboxToggle={() => setSandbox(s => !s)}
                />
              )}
            </Suspense>
          </div>
        </div>
      )}

      {(phase === 'login' || phase === 'unlocked') && (
        <div className={`login-overlay ${phase === 'unlocked' ? 'login-fading' : ''}`}>
          <LoginPage onAccess={handleAccess} />
        </div>
      )}
    </ErrorBoundary>
  )
}
