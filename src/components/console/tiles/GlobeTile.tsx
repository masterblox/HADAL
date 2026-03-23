import { GlobeView } from '@/components/hero/GlobeView'
import type { Incident } from '@/hooks/useDataPipeline'

export function GlobeTile({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="console-globe-tile">
      <GlobeView incidents={incidents} />
    </div>
  )
}
