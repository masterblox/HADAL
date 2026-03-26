import { useMemo } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'
import { DevTag } from '@/components/shared/DevTag'

interface SepBandProps {
  incidents: Incident[]
}

export function SepBand({ incidents }: SepBandProps) {
  const stats = useMemo(() => {
    const interceptRe = /\bintercept\b/i
    const intercepts = incidents.filter(i => interceptRe.test(i.title || '')).length
    const countries = new Set(incidents.map(i => i.location?.country).filter(Boolean)).size
    const freshest = incidents
      .map(i => (i.published ? new Date(i.published).getTime() : 0))
      .filter(Boolean)
      .sort((a, b) => b - a)[0]
    return { intercepts, countries, freshest }
  }, [incidents])

  const hasLive = incidents.length > 0
  const freshnessLabel = stats.freshest
    ? `${Math.max(1, Math.round((Date.now() - stats.freshest) / 60000))} MIN`
    : 'NO SIGNAL'

  return (
    <div className="sep-band" style={{ position: 'relative' }}>
      <div className="sep-content">
        <span className="sep-kicker">THEATRE SIGNAL EXCHANGE</span>
        <span className="sep-stat"><strong>{stats.intercepts}</strong> INTERCEPT EVENTS</span>
        <span className="sep-div">/</span>
        <span className="sep-stat"><strong>{incidents.length}</strong> INCIDENTS TRACKED</span>
        <span className="sep-div">/</span>
        <span className="sep-stat"><strong>{stats.countries}</strong> COUNTRIES IN SCOPE</span>
        <span className="sep-div">/</span>
        <span className={`sep-stat${hasLive ? '' : ' warn'}`}><strong>{hasLive ? 'LIVE' : 'OFFLINE'}</strong> PIPELINE</span>
        <span className="sep-div">/</span>
        <span className="sep-stat"><strong>{freshnessLabel}</strong> LAST SIGNAL</span>
      </div>
      <DevTag id="Y" />
    </div>
  )
}
