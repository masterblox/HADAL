import { SepBand } from '@/components/sep/SepBand'
import type { Incident } from '@/hooks/useDataPipeline'

export function TheatreExchangeTile({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="console-exchange">
      <SepBand incidents={incidents} />
    </div>
  )
}
