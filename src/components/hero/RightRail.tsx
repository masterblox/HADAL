import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import { useSonar } from '@/canvas/useSonar'
import { useSignalMonitor } from '@/hooks/useSignalMonitor'
import { useTracking } from '@/hooks/useTracking'
import { gccData } from '@/data/gcc-data'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

const SIG_BARS = Array.from({ length: 30 }, (_, i) => {
  const h = Math.floor(Math.random() * 28) + 4
  return { i, h, rd: (.2 + Math.random() * .9).toFixed(2), rl: (Math.random() * .5).toFixed(2) }
})

interface RightRailProps {
  sandbox: boolean
}

export function RightRail({ sandbox }: RightRailProps) {
  const noiseRef = useNoiseCanvas({ grayscale: true, interval: 95 })
  const { objects, counts, status } = useTracking()
  const sonarRef = useSonar(objects)
  const { msg, freq, sigWidth, typeLabel, totalTracked } = useSignalMonitor(objects)

  const sigBars = SIG_BARS.map(b => (
    <div key={b.i} className="SB" style={{
      '--rd': `${b.rd}s`,
      '--rl': `${b.rl}s`,
      '--rh': `${b.h}px`,
      height: `${b.h}px`,
    } as React.CSSProperties} />
  ))

  return (
    <div className="rc">
      <canvas ref={noiseRef} className="NOISE" />
      <ResizablePanelGroup orientation="vertical" className="rc-panels">
        <ResizablePanel id="rc-thaad" defaultSize="20%">
          <div className="jp-panel rc-block">
            <div className="jp-panel-header rc-lbl"><div className="HDR-DOT jp-status-dot active" />THAAD STATUS</div>
            <div className="jp-breakdown">
              <div className="tsite jp-brow"><span className="ts-k jp-bname">JORDAN MUWAFFAQ</span><span className="ts-w jp-bval">DESTROYED</span></div>
              <div className="tsite jp-brow"><span className="ts-k jp-bname">UAE RUWAIS</span><span className="ts-w jp-bval">HIT</span></div>
              <div className="tsite jp-brow"><span className="ts-k jp-bname">UAE AL SADER</span><span className="ts-w jp-bval">HIT</span></div>
              <div className="tsite jp-brow"><span className="ts-k jp-bname">SAUDI SULTAN AB</span><span className="ts-w jp-bval">SMOKE</span></div>
              <div className="tsite jp-brow"><span className="ts-k jp-bname">QATAR UMM DAHAL</span><span className="ts-w jp-bval">DESTROYED</span></div>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="rc-sonar" defaultSize="30%">
          <div className="jp-panel rc-block">
            <div className="jp-panel-header rc-lbl">
              <div className={`HDR-DOT jp-status-dot ${status === 'ONLINE' ? 'active' : 'error'}`} style={{ background: status === 'ONLINE' ? 'var(--g)' : 'var(--warn)' }} />
              TRACKING RADAR
              <span style={{marginLeft:'auto',fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color: status === 'ONLINE' ? 'var(--g3)' : 'var(--warn)'}}>{status}</span>
            </div>
            <div className="sonar-wrap">
              <canvas ref={sonarRef} width={140} height={140} />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:'var(--g3)',marginTop:'4px',padding:'0 2px'}}>
              <span style={{color:'rgb(0,212,255)'}}>✈ {counts.aircraft}</span>
              <span style={{color:'rgb(255,215,0)'}}>◉ {counts.satellite}</span>
              <span style={{color:'rgb(255,140,0)'}}>⚓ {counts.maritime}</span>
              <span>{totalTracked} TOTAL</span>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="rc-signal" defaultSize="22%">
          <div className="jp-panel rc-block">
            <div className="jp-panel-header rc-lbl">TRACKING FEED</div>
            <div className="sig-row">{sigBars}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'4px'}}>
              <span style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:'var(--g3)'}}>FREQ: {freq}</span>
              <span style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-micro)',color:'var(--g5)'}}>{typeLabel}</span>
            </div>
            <div style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',color:'var(--g5)',marginTop:'4px'}}>{msg}</div>
            <div style={{height:'3px',background:'var(--g07)',marginTop:'6px'}}>
              <div style={{height:'100%',background:'var(--g5)',width:`${sigWidth}%`,transition:'width .3s ease'}} />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="rc-gcc" defaultSize="28%">
          <div className="jp-panel rc-block" style={{flex:1}}>
            <div className="jp-panel-header rc-lbl">GCC INTERCEPTS</div>
            <div className="gcc-row jp-breakdown">
              {gccData.map(r => (
                <div key={r.f} className="GCC-ROW jp-brow">
                  <span className="GCF">{r.f}</span>
                  <span className="GCN">{r.n}</span>
                  <div className="GC-BC">
                    <div className="BAR-S jp-bbar"><div className="BAR-SF jp-bfill" style={{width:`${r.p * 100}%`}} /></div>
                    <div className="GC-TP">{r.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
