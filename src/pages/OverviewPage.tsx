import type { PipelineHealth, PriceData, AirspaceData } from '@/hooks/useDataPipeline'
import type { Incident } from '@/hooks/useDataPipeline'
import { ConsoleCircuitShell } from '@/components/console/ConsoleCircuitShell'
import { DevTag } from '@/components/shared/DevTag'
import { navigateTo } from '@/lib/lane-routing'

interface OverviewPageProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean; health: PipelineHealth }
  prediction: unknown
  incidents: Incident[]
  prices: PriceData | null
  airspace: AirspaceData | null
}

export function OverviewPage({
  sandbox: _sandbox,
  pipelineStatus: _pipelineStatus,
  incidents,
  prices: _prices,
  airspace: _airspace,
}: OverviewPageProps) {
  return (
    <div className="overview-shell">
      <ConsoleCircuitShell incidents={incidents} onEdit={() => navigateTo('console')} />
      <DevTag id="B" />
    </div>
  )
}
