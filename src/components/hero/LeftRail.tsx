import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface LeftRailProps {
  sandbox: boolean
}

export function LeftRail({ sandbox }: LeftRailProps) {
  const noiseRef = useNoiseCanvas({ grayscale: true, interval: 95 })

  return (
    <div className="lc">
      <canvas ref={noiseRef} className="NOISE" />
      <ResizablePanelGroup orientation="vertical" className="lc-panels">
        <ResizablePanel id="lc-brand" defaultSize="15%">
          <div className="brand-plate">
            <div className="bp-name">HADAL INTELLIGENCE</div>
            <div className="bp-tagline">Intelligence lives in the dark.</div>
            <div className="bp-ver">v2.0.0 · MASTERBLOX CAPITAL · GULF THEATRE</div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="lc-threat" defaultSize="22%">
          <div className="ti-block">
            <div className="ti-lbl">&#9670; THREAT INDEX</div>
            <div className="ti-big">91</div>
            <div className="ti-sub">CRITICAL · ESCALATING</div>
            <div className="ti-bar"><div className="ti-bar-fill" /></div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="lc-spec" defaultSize="40%">
          <div className="spec-block">
            <div className="spec-lbl">S.P.E.C.I.A.L.</div>
            <div className="spec-row"><span className="spec-k">STRENGTH</span><span className="spec-v" style={{color:'var(--warn)'}}>09</span></div>
            <div className="spec-row"><span className="spec-k">PERCEPTION</span><span className="spec-v">10</span></div>
            <div className="spec-row"><span className="spec-k">ENDURANCE</span><span className="spec-v">07</span></div>
            <div className="spec-row"><span className="spec-k">CHARISMA</span><span className="spec-v" style={{color:'var(--warn)'}}>03</span></div>
            <div className="spec-row"><span className="spec-k">INTELLIGENCE</span><span className="spec-v">10</span></div>
            <div className="spec-row"><span className="spec-k">AGILITY</span><span className="spec-v">08</span></div>
            <div className="spec-row"><span className="spec-k">LUCK</span><span className="spec-v" style={{color:'rgba(255,140,0,.9)'}}>02</span></div>
          </div>
        </ResizablePanel>
        <ResizableHandle disabled={!sandbox} />
        <ResizablePanel id="lc-sys" defaultSize="23%">
          <div className="sys-block">
            <div className="sys-lbl">SYSTEM STATUS</div>
            <div className="sys-row"><span className="sys-k">OSINT ENGINE</span><div className="sys-dot on" /></div>
            <div className="sys-row"><span className="sys-k">LEAFLET MAP</span><div className="sys-dot on" /></div>
            <div className="sys-row"><span className="sys-k">IRANWARLIVE FEED</span><div className="sys-dot warn" /></div>
            <div className="sys-row"><span className="sys-k">THAAD NETWORK</span><div className="sys-dot off" /></div>
            <div className="sys-row"><span className="sys-k">ECON DATA</span><div className="sys-dot on" /></div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
