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
    'live-incidents': true,
  })
  const [syncStatus, setSyncStatus] = useState('SYNCING...')
  const [datalinkText, setDatalinkText] = useState('ESTABLISHING SECURE DATALINK...')

  const toggleLayer = useCallback((name: string) => {
    setLayerVisibility(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  const handleCalc = useCallback(() => {
    const kinetic = incidents.filter(i => {
      const t = (i.type || i.title || '').toLowerCase()
      return t.includes('missile') || t.includes('airstrike') || t.includes('drone') || t.includes('ballistic')
    }).length
    const sources = new Set(incidents.map(i => i.source).filter(Boolean)).size
    const countries = new Set(incidents.map(i => i.location?.country).filter(Boolean)).size

    alert(
      `HADAL THREAT SUMMARY\n\n` +
      `TRACKED INCIDENTS: ${incidents.length}\n` +
      `KINETIC EVENTS: ${kinetic}\n` +
      `COUNTRIES AFFECTED: ${countries}\n` +
      `SOURCES: ${sources}\n\n` +
      (incidents.length > 0
        ? `SOURCE: GULF WATCH PIPELINE · LIVE`
        : `SOURCE: NO LIVE DATA · PIPELINE OFFLINE`)
    )
  }, [incidents])

  return (
    <div className="iwl-wrap">
      <IwlNav activeTab={activeTab} onTabChange={setActiveTab} syncStatus={syncStatus} onCalc={handleCalc} />
      <div className="iwl-map-area" style={{ position: 'relative' }}>
        <LeafletMap
          layerVisibility={layerVisibility}
          incidents={incidents}
          onSyncUpdate={setSyncStatus}
          onDatalinkUpdate={setDatalinkText}
        />
        {activeTab === 'airspace' && <AirspaceTab airspace={airspace} />}
        {activeTab === 'casualties' && <CasualtiesTab sandbox={sandbox} incidents={incidents} />}
        {activeTab === 'posturing' && <PosturingTab sandbox={sandbox} />}
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
      <IwlBottom datalinkText={datalinkText} />
    </div>
  )
}
