import { MissileCard } from './MissileCard'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

const cards = [
  { country: 'UAE', src: 'UAE MoD', val: 165, label: 'INTERCEPTED', bars: [{l:'BALLISTIC',w:100,v:'165'},{l:'CRUISE',w:1,v:'2'},{l:'DRONES',w:100,v:'541'}], chip: '35 TERRITORY IMPACTS', icon: 'ballistic' as const },
  { country: 'KUWAIT', src: 'KWT MoD', val: 97, label: 'BALLISTIC INT.', bars: [{l:'BALLISTIC',w:59,v:'97'},{l:'DRONES',w:34,v:'283'}], icon: 'drone' as const },
  { country: 'QATAR', src: 'QTR MoD', val: 18, label: 'ENGAGED', bars: [{l:'TOTAL',w:11,v:'18'}], chip: 'UEWR DESTROYED', icon: 'cruise' as const },
  { country: 'BAHRAIN', src: 'BHR MoD', val: 45, label: 'MISSILES INT.', bars: [{l:'MISSILES',w:100,v:'45'},{l:'DRONES',w:20,v:'9'}], chip: '5TH FLEET HQ HIT', icon: 'intercept' as const },
  { country: 'THAAD NET', src: 'SAT/CNN', val: 0, valStr: 'DEG.', label: 'RADAR COVERAGE', warn: true, icon: 'radar' as const },
]

interface MissileDefenseStripProps {
  sandbox: boolean
}

export function MissileDefenseStrip({ sandbox }: MissileDefenseStripProps) {
  return (
    <div className="missile-section">
      <div className="ms-hdr jp-panel-header">
        <div className="HDR-DOT jp-status-dot active" />
        &#9670; THEATRE KINETIC DATA · VERIFIED MoD + SAT
        <span style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:'var(--g3)',marginLeft:'auto'}}>FEB 28 – MAR 10, 2026</span>
      </div>
      <div className="mc-grid">
        <ResizablePanelGroup orientation="horizontal">
          {cards.flatMap((c, i) => {
            const panel = (
              <ResizablePanel key={c.country} id={`mc-${c.country}`} defaultSize="20%" minSize="10%">
                <MissileCard {...c} index={i} />
              </ResizablePanel>
            )
            if (i === 0) return [panel]
            return [
              <ResizableHandle key={`h-${c.country}`} disabled={!sandbox} />,
              panel,
            ]
          })}
        </ResizablePanelGroup>
      </div>
      <div className="jp-intel m-agg">
        <div className="jp-intel-cell"><div className="jp-intel-lbl">TOTAL BALLISTIC</div><div className="ag-v jp-intel-val">325</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">TOTAL DRONES</div><div className="ag-v jp-intel-val">833</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">CRUISE</div><div className="ag-v jp-intel-val">2</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">TERRITORY IMPACTS</div><div className="ag-v warn jp-intel-val">35+</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">RADAR NODES LOST</div><div className="ag-v warn jp-intel-val">5</div></div>
      </div>
    </div>
  )
}
