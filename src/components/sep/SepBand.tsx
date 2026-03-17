import { useSepStatic } from '@/canvas/useSepStatic'

export function SepBand() {
  const staticRef = useSepStatic()

  return (
    <div className="sep-band">
      <canvas ref={staticRef} />
      <div className="sep-overlay">
        <svg className="birdmissile" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="rgba(196,255,44,.3)" strokeWidth="1.5" strokeDasharray="5 3"/>
          <circle cx="24" cy="24" r="15" stroke="rgba(196,255,44,.18)" strokeWidth="1"/>
          <line x1="24" y1="2" x2="24" y2="9" stroke="rgba(196,255,44,.55)" strokeWidth="1.5"/>
          <line x1="24" y1="39" x2="24" y2="46" stroke="rgba(196,255,44,.55)" strokeWidth="1.5"/>
          <line x1="2" y1="24" x2="9" y2="24" stroke="rgba(196,255,44,.55)" strokeWidth="1.5"/>
          <line x1="39" y1="24" x2="46" y2="24" stroke="rgba(196,255,44,.55)" strokeWidth="1.5"/>
          <rect x="21" y="10" width="6" height="20" rx="3" fill="rgba(196,255,44,.12)" stroke="rgba(196,255,44,.85)" strokeWidth="1.5"/>
          <polygon points="21,27 15,34 21,32" fill="rgba(196,255,44,.3)" stroke="rgba(196,255,44,.5)" strokeWidth="1"/>
          <polygon points="27,27 33,34 27,32" fill="rgba(196,255,44,.3)" stroke="rgba(196,255,44,.5)" strokeWidth="1"/>
          <circle cx="24" cy="11" r="2.5" fill="rgba(196,255,44,.95)"/>
          <circle cx="24" cy="30" r="3.5" fill="rgba(255,140,0,.35)" stroke="rgba(255,140,0,.65)" strokeWidth="1"/>
        </svg>
        <div className="sep-vtx" />
        <div className="sep-msg-block">
          <div className="sep-icon-wrap">THAAD DEGRADED</div>
          <div className="sep-txt">5 NODES LOST · AIR DEFENCE AT 61%</div>
        </div>
        <div className="sep-vtx" />
        <div className="sep-msg-block">
          <div className="sep-icon-wrap">1,160 INTERCEPTIONS</div>
          <div className="sep-txt">ACTIVE SINCE FEB 28 · 5 GCC STATES</div>
        </div>
      </div>
      <div style={{position:'absolute',bottom:'7px',left:'50%',transform:'translateX(-50%)',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontWeight:300,fontSize:'10px',letterSpacing:'.22em',color:'rgba(196,255,44,.14)',whiteSpace:'nowrap',pointerEvents:'none',zIndex:2}}>
        Intelligence lives in the dark.
      </div>
    </div>
  )
}
