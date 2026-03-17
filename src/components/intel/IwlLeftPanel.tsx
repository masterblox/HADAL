import { useState } from 'react'

interface IwlLeftPanelProps {
  layerVisibility: Record<string, boolean>
  onToggle: (name: string) => void
}

const layers = [
  {id:'satellite',label:'Satellite Terrain',icon:'grid'},
  {id:'missile',label:'Missile Strike',ct:'10',icon:'missile'},
  {id:'airstrike',label:'Air Strike',ct:'6',icon:'triangle'},
  {id:'ground',label:'Ground Forces',ct:'14',icon:'tank'},
  {id:'intercept',label:'Interception',ct:'1160',icon:'diamond'},
  {id:'combatants',label:'Active Combatants',ct:'7',icon:'person'},
  {id:'diplomatic',label:'Diplomatic Actors',ct:'4',icon:'pentagon',special:true},
  {id:'airspace-lyr',label:'Airspace Closed',ct:'6',icon:'airspace'},
]

export function IwlLeftPanel({ layerVisibility, onToggle }: IwlLeftPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className="iwl-left-inner">
      <div className="iwl-panel">
        <div className="iwl-ph" onClick={() => setOpen(!open)}>
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
                  opacity: layerVisibility[l.id] ? 1 : .45,
                  ...(l.special ? {borderTop:'1px solid rgba(180,100,255,.12)',background:'rgba(140,60,220,.04)'} : {}),
                }}
                onClick={() => onToggle(l.id)}
              >
                <div className="iwl-lyr-icon" />
                <span className="iwl-lyr-t" style={l.special ? {color:'rgba(200,130,255,.8)',textShadow:'0 0 8px rgba(200,100,255,.35)',letterSpacing:'.12em'} : {}}>
                  {l.label}
                </span>
                {l.ct && <span className="iwl-lyr-ct" style={{color: l.special ? 'rgba(210,140,255,.95)' : 'rgba(180,200,180,.65)'}}>{l.ct}</span>}
                <div className={`iwl-toggle${layerVisibility[l.id] ? '' : ' off'}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
