import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'

interface CasualtiesTabProps {
  sandbox: boolean
}

export function CasualtiesTab({ sandbox }: CasualtiesTabProps) {
  return (
    <div className="iwl-tabcontent active">
      <div className="iwl-section-h">PARTICIPANTS &amp; CASUALTIES</div>
      <p style={{fontFamily:'var(--MONO)',fontSize:'8px',color:'var(--g3)',marginBottom:'14px'}}>Automated intelligence estimates based on active geopolitical events.</p>
      <div className="iwl-stat-grid">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="cas-1" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box"><div className="iwl-sb-v" style={{color:'rgba(255,140,0,.9)'}}>2,340+</div><div className="iwl-sb-l">MILITARY KIA (EST)</div></div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="cas-2" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box"><div className="iwl-sb-v" style={{color:'var(--warn)'}}>1,100+</div><div className="iwl-sb-l">CIVILIAN KIA (IRAN)</div></div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="cas-3" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box"><div className="iwl-sb-v" style={{color:'var(--g)'}}>1,160</div><div className="iwl-sb-l">INTERCEPTS CONFIRMED</div></div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="cas-4" defaultSize="25%" minSize="15%">
            <div className="iwl-stat-box"><div className="iwl-sb-v" style={{color:'var(--g5)'}}>DAY 10</div><div className="iwl-sb-l">OP. EPIC FURY</div></div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <table className="iwl-table">
        <thead><tr><th>ENTITY</th><th>ALLIANCE</th><th>EST. TROOPS</th><th>EST. AIRCRAFT</th><th>ARMOR</th><th>MIL CASUALTIES</th><th>CIV CASUALTIES</th><th>STATUS</th></tr></thead>
        <tbody>
          <tr><td>IRAN (IRGC)</td><td>AXIS</td><td>190,000</td><td>340</td><td>1,650</td><td style={{color:'rgba(255,140,0,.8)'}}>580+ (EST)</td><td style={{color:'var(--warn)'}}>1,100+</td><td style={{color:'var(--warn)'}}>OFFENSIVE</td></tr>
          <tr><td>USA (CENTCOM)</td><td>COALITION</td><td>45,000</td><td>280</td><td>420</td><td style={{color:'rgba(255,140,0,.8)'}}>24 (KIA)</td><td>0</td><td style={{color:'var(--g5)'}}>OP. EPIC FURY</td></tr>
          <tr><td>UAE</td><td>COALITION</td><td>63,000</td><td>95</td><td>545</td><td style={{color:'rgba(255,140,0,.8)'}}>41</td><td style={{color:'var(--warn)'}}>38</td><td style={{color:'var(--warn)'}}>UNDER ATTACK</td></tr>
          <tr><td>SAUDI ARABIA</td><td>COALITION</td><td>227,000</td><td>348</td><td>1,142</td><td style={{color:'rgba(255,140,0,.8)'}}>29</td><td style={{color:'var(--warn)'}}>12</td><td style={{color:'rgba(255,140,0,.7)'}}>ELEVATED</td></tr>
          <tr><td>ISRAEL (IDF)</td><td>COALITION</td><td>170,000</td><td>339</td><td>1,700</td><td style={{color:'rgba(255,140,0,.8)'}}>156</td><td style={{color:'var(--warn)'}}>94</td><td style={{color:'var(--warn)'}}>MULTI-FRONT</td></tr>
          <tr><td>HOUTHI (YEMEN)</td><td>AXIS</td><td>200,000</td><td>12</td><td>80</td><td style={{color:'rgba(255,140,0,.8)'}}>387</td><td style={{color:'var(--warn)'}}>—</td><td style={{color:'var(--warn)'}}>OFFENSIVE</td></tr>
          <tr><td>HEZBOLLAH</td><td>AXIS</td><td>100,000</td><td>0</td><td>0</td><td style={{color:'rgba(255,140,0,.8)'}}>612</td><td style={{color:'var(--warn)'}}>—</td><td style={{color:'rgba(255,140,0,.9)'}}>DEGRADED</td></tr>
        </tbody>
      </table>
    </div>
  )
}
