import { useState, useEffect, useSyncExternalStore, lazy, Suspense } from 'react'
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
  operations: 'Maps',
  console: 'Console',
}

/* ── App ── */
export function App() {
  const { prices, incidents, airspace, health } = useDataPipeline()
  const prediction = usePrediction(incidents, airspace, prices)
  const threatLevel = prediction?.theatreThreatLevel ?? null
  const [sandbox, setSandbox] = useState(false)
  const [devTags, setDevTags] = useState(false)
  const activeLane = useHashRoute()

  useEffect(() => {
    if (devTags) {
      document.body.classList.add('dev-tags-active')
    } else {
      document.body.classList.remove('dev-tags-active')
    }
  }, [devTags])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setDevTags(v => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = 'overview'
    }
  }, [])

  useEffect(() => {
    document.title = `HADAL · ${LANE_TITLES[activeLane]}`
  }, [activeLane])

  const pipelineStatus = {
    incidents: health.incidents !== 'offline',
    prices: health.prices !== 'offline',
    airspace: health.airspace !== 'offline',
    health,
  }

  return (
    <ErrorBoundary>
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
          devTags={devTags}
          onDevTagToggle={() => setDevTags(v => !v)}
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
                prediction={prediction}
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
    </ErrorBoundary>
  )
}
