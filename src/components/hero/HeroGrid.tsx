import { LeftRail } from './LeftRail'
import { GlobeView } from './GlobeView'
import { RightRail } from './RightRail'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { PredictionResult } from '@/lib/prediction/types'

interface HeroGridProps {
  sandbox: boolean
  threatLevel: number | null
  pipelineStatus: { incidents: boolean; prices: boolean; airspace: boolean }
  prediction: PredictionResult | null
}

export function HeroGrid({ sandbox, threatLevel, pipelineStatus, prediction }: HeroGridProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="hero-grid">
      <ResizablePanel id="hero-left" defaultSize="14%" minSize="11%" maxSize="20%">
        <LeftRail sandbox={sandbox} threatLevel={threatLevel} pipelineStatus={pipelineStatus} prediction={prediction} />
      </ResizablePanel>
      <ResizableHandle disabled={!sandbox} />
      <ResizablePanel id="hero-center" defaultSize="72%">
        <GlobeView />
      </ResizablePanel>
      <ResizableHandle disabled={!sandbox} />
      <ResizablePanel id="hero-right" defaultSize="14%" minSize="11%" maxSize="20%">
        <RightRail sandbox={sandbox} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
