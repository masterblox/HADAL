import { LeftRail } from './LeftRail'
import { GlobeView } from './GlobeView'
import { RightRail } from './RightRail'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface HeroGridProps {
  sandbox: boolean
}

export function HeroGrid({ sandbox }: HeroGridProps) {
  return (
    <ResizablePanelGroup orientation="horizontal" className="hero-grid">
      <ResizablePanel id="hero-left" defaultSize="16%" minSize="12%" maxSize="25%">
        <LeftRail sandbox={sandbox} />
      </ResizablePanel>
      <ResizableHandle disabled={!sandbox} />
      <ResizablePanel id="hero-center" defaultSize="68%">
        <GlobeView />
      </ResizablePanel>
      <ResizableHandle disabled={!sandbox} />
      <ResizablePanel id="hero-right" defaultSize="16%" minSize="12%" maxSize="25%">
        <RightRail sandbox={sandbox} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
