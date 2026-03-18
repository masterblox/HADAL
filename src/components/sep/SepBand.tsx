import { useMemo } from 'react'
import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import type { Incident } from '@/hooks/useDataPipeline'

interface SepBandProps {
  incidents: Incident[]
}

export function SepBand({ incidents }: SepBandProps) {
  const noiseRef = useNoiseCanvas({ grayscale: true, interval: 90 })

  const stats = useMemo(() => {
    const intercepts = incidents.filter(i => (i.title || '').toLowerCase().includes('intercept')).length
    const countries = new Set(incidents.map(i => i.location?.country).filter(Boolean)).size
    return { intercepts, countries }
  }, [incidents])

  const hasLive = incidents.length > 0

  return (
    <div className="sep-band">
      <canvas ref={noiseRef} className="sep-noise" />
      <div className="sep-content">
        <span className="sep-stat">{hasLive ? `${stats.intercepts} INTERCEPTS` : 'AWAITING FEED'}</span>
        <span className="sep-div">·</span>
        <span className="sep-stat">{hasLive ? `${incidents.length} TRACKED` : 'NO LIVE DATA'}</span>
        <span className="sep-div">·</span>
        <span className="sep-stat">{hasLive ? `${stats.countries} COUNTRIES` : 'PIPELINE OFFLINE'}</span>
      </div>
    </div>
  )
}
