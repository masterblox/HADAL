import { useState, useCallback } from 'react'
import { LeafletMap } from './LeafletMap'
import { IwlNav } from './IwlNav'
import { IwlLeftPanel } from './IwlLeftPanel'
import { IwlRightPanel } from './IwlRightPanel'
import { AirspaceTab } from './AirspaceTab'
import { CasualtiesTab } from './CasualtiesTab'
import { PosturingTab } from './PosturingTab'
import { IwlBottom } from './IwlBottom'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { Incident, AirspaceData } from '@/hooks/useDataPipeline'

interface IntelWireSectionProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  sandbox: boolean
}

export function IntelWireSection({ incidents, airspace, sandbox }: IntelWireSectionProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'airspace' | 'casualties' | 'posturing'>('map')
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    satellite: true, missile: true, airstrike: true, ground: true,
    intercept: true, combatants: true, diplomatic: true, 'airspace-lyr': true,
  })
  const [syncStatus, setSyncStatus] = useState('SYNCING...')
  const [datalinkText, setDatalinkText] = useState('ESTABLISHING SECURE DATALINK...')

  const toggleLayer = useCallback((name: string) => {
    setLayerVisibility(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  const handleCalc = useCallback(() => {
    const score = Math.floor(Math.random() * 8 + 88)
    alert(`HADAL THREAT CALC\n\nTHEATRE THREAT INDEX: ${score}/100\nCLASSIFICATION: CRITICAL\n\nAIR DEFENCE COVER: 61%\nACTIVE VECTORS: 8\nTHAAD NODES DEGRADED: 5/5\nINTERCEPTIONS CONFIRMED: 1,160\n\nSOURCE: OSINT / HADAL ANALYTICS`)
  }, [])

  return (
    <div className="iwl-wrap">
      <IwlNav activeTab={activeTab} onTabChange={setActiveTab} syncStatus={syncStatus} onCalc={handleCalc} />
      <div className="iwl-map-area">
        <LeafletMap
          layerVisibility={layerVisibility}
          incidents={incidents}
          onSyncUpdate={setSyncStatus}
          onDatalinkUpdate={setDatalinkText}
        />
        {activeTab === 'airspace' && <AirspaceTab airspace={airspace} />}
        {activeTab === 'casualties' && <CasualtiesTab sandbox={sandbox} />}
        {activeTab === 'posturing' && <PosturingTab sandbox={sandbox} />}
        {activeTab === 'map' && (
          <div className="iwl-resizable-overlay">
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel id="iwl-left" defaultSize="12%" minSize="8%" maxSize="20%">
                <IwlLeftPanel layerVisibility={layerVisibility} onToggle={toggleLayer} />
              </ResizablePanel>
              <ResizableHandle disabled={!sandbox} />
              <ResizablePanel id="iwl-center" defaultSize="72%" className="iwl-map-passthrough">
                <div />
              </ResizablePanel>
              <ResizableHandle disabled={!sandbox} />
              <ResizablePanel id="iwl-right" defaultSize="16%" minSize="8%" maxSize="25%">
                <IwlRightPanel incidents={incidents} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </div>
      <IwlBottom datalinkText={datalinkText} />
    </div>
  )
}
