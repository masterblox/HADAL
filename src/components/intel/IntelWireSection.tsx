import { useState, useCallback } from 'react'
import { MapDepthLayer } from '@/components/shared/MapDepthLayer'
import { LeafletMap } from './LeafletMap'
import { IwlNav } from './IwlNav'
import { IwlLeftPanel } from './IwlLeftPanel'
import { IwlRightPanel } from './IwlRightPanel'
import { AirspaceTab } from './AirspaceTab'
import { CasualtiesTab } from './CasualtiesTab'
import { PosturingTab } from './PosturingTab'
import { IwlBottom } from './IwlBottom'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { Incident, AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import { exportSitrep } from '@/lib/sitrep-export'
import { useOpenSky } from '@/hooks/useOpenSky'

interface IntelWireSectionProps {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices?: PriceData | null
  sandbox: boolean
}

export function IntelWireSection({ incidents, airspace, prices, sandbox }: IntelWireSectionProps) {
  const openSky = useOpenSky()
  const [activeTab, setActiveTab] = useState<'map' | 'airspace' | 'casualties' | 'posturing'>('map')
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    satellite: true, missile: true, airstrike: true, ground: true,
    intercept: true, combatants: true, diplomatic: true, 'airspace-lyr': true,
    'live-incidents': true, aircraft: true,
  })
  const [syncStatus, setSyncStatus] = useState('SYNCING...')
  const [datalinkText, setDatalinkText] = useState('INITIALIZING PIPELINE...')

  const toggleLayer = useCallback((name: string) => {
    setLayerVisibility(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  return (
    <div className="iwl-wrap">
      <IwlNav activeTab={activeTab} onTabChange={setActiveTab} syncStatus={syncStatus} aircraftCount={openSky.flights.length} aircraftStatus={openSky.status} />
      <div className="iwl-map-area" style={{ position: 'relative' }}>
        <MapDepthLayer />
        <LeafletMap
          layerVisibility={layerVisibility}
          incidents={incidents}
          flights={openSky.flights}
          onSyncUpdate={setSyncStatus}
          onDatalinkUpdate={setDatalinkText}
        />
        {activeTab === 'airspace' && <AirspaceTab airspace={airspace} />}
        {activeTab === 'casualties' && <CasualtiesTab sandbox={sandbox} incidents={incidents} />}
        {activeTab === 'posturing' && <PosturingTab />}
        {activeTab === 'map' && (
          <div className="iwl-resizable-overlay">
            <ResizablePanelGroup orientation="horizontal">
              <ResizablePanel id="iwl-left" defaultSize="12%" minSize="8%" maxSize="20%">
                <IwlLeftPanel layerVisibility={layerVisibility} onToggle={toggleLayer} liveIncidentCount={incidents.length} />
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
      <IwlBottom datalinkText={datalinkText} onExportSitrep={() => exportSitrep(incidents, prices ?? null, airspace)} flights={openSky.flights} aircraftStatus={openSky.status} />
    </div>
  )
}
