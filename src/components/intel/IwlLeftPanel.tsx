import { useState } from 'react'
import { missileEvents, interceptEvents, airstrikeEvents, groundEvents, combatantEvents, diplomaticEvents } from '@/data/map-events'
import { airspaceZones } from '@/data/airspace-zones'

interface IwlLeftPanelProps {
  layerVisibility: Record<string, boolean>
  onToggle: (name: string) => void
  liveIncidentCount: number
}

/** Derive layer counts from actual static data arrays + live pipeline count */
function buildLayers(liveCount: number) {
  return [
    {id:'satellite',label:'Satellite Terrain',icon:'grid'},
    {id:'missile',label:'Missile Strike',ct:String(missileEvents.length),icon:'missile'},
    {id:'airstrike',label:'Air Strike',ct:String(airstrikeEvents.length),icon:'triangle'},
    {id:'ground',label:'Ground Forces',ct:String(groundEvents.length),icon:'tank'},
    {id:'intercept',label:'Interception',ct:String(interceptEvents.length),icon:'diamond'},
    {id:'combatants',label:'Active Combatants',ct:String(combatantEvents.length),icon:'person'},
    {id:'diplomatic',label:'Diplomatic Actors',ct:String(diplomaticEvents.length),icon:'pentagon',special:true},
    {id:'airspace-lyr',label:'Airspace Zones',ct:String(airspaceZones.length),icon:'airspace'},
    ...(liveCount > 0 ? [{id:'live-incidents',label:'Live Incidents',ct:String(liveCount),icon:'live'}] : []),
  ]
}

export function IwlLeftPanel({ layerVisibility, onToggle, liveIncidentCount }: IwlLeftPanelProps) {
  const [open, setOpen] = useState(true)
  const layers = buildLayers(liveIncidentCount)

  return (
    <div className="iwl-left-inner">
      <div className="iwl-panel jp-panel">
        <div className="iwl-ph jp-panel-header" onClick={() => setOpen(!open)}>
          <span className="iwl-ph-t">Map Layers</span>
          <span className={`iwl-ph-arrow${open ? ' open' : ''}`}>&#9662;</span>
        </div>
        {open && (
          <div className="iwl-layer-body">
            {layers.map(l => (
              <div
                key={l.id}
                className={`iwl-lyr${l.special ? ' iwl-lyr-diplomatic' : ''}`}
                style={{
                  opacity: layerVisibility[l.id] !== false ? 1 : .45,
                  ...(l.special ? {borderTop:'1px solid rgba(180,100,255,.12)',background:'rgba(140,60,220,.04)'} : {}),
                }}
                onClick={() => onToggle(l.id)}
              >
                <div className="iwl-lyr-icon" />
                <span className="iwl-lyr-t" style={l.special ? {color:'rgba(200,130,255,.8)',textShadow:'0 0 8px rgba(200,100,255,.35)',letterSpacing:'.12em'} : {}}>
                  {l.label}
                </span>
                {l.ct && <span className="iwl-lyr-ct" style={{color: l.special ? 'rgba(210,140,255,.95)' : 'rgba(180,200,180,.65)'}}>{l.ct}</span>}
                <div className={`iwl-toggle${layerVisibility[l.id] !== false ? '' : ' off'}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
