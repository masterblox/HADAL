import { useMemo } from 'react'
import type { Incident } from '@/hooks/useDataPipeline'

interface SepBandProps {
  incidents: Incident[]
}

export function SepBand({ incidents }: SepBandProps) {
  const stats = useMemo(() => {
    const interceptRe = /\bintercept\b/i
    const intercepts = incidents.filter(i => interceptRe.test(i.title || '')).length
    const countries = new Set(incidents.map(i => i.location?.country).filter(Boolean)).size
    return { intercepts, countries }
  }, [incidents])

  const hasLive = incidents.length > 0

  return (
    <div className="sep-band" style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--MONO)', fontSize: 'var(--fs-small)', color: 'var(--g5)' }}>
        ── {stats.intercepts} Intercept Events · {incidents.length} Incidents · {stats.countries} Countries · Pipeline {hasLive ? 'Live' : 'Offline'} ──
      </span>
    </div>
  )
}
