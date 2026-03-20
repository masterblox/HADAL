interface IwlNavProps {
  activeTab: string
  onTabChange: (tab: 'map' | 'airspace' | 'casualties' | 'posturing') => void
  syncStatus: string
  aircraftCount?: number
  aircraftStatus?: string
}

export function IwlNav({ activeTab, onTabChange, syncStatus, aircraftCount, aircraftStatus }: IwlNavProps) {
  const tabs: { id: 'map' | 'airspace' | 'casualties' | 'posturing'; label: string }[] = [
    { id: 'map', label: 'Tactical Map' },
    { id: 'airspace', label: 'Airspace Status' },
    { id: 'casualties', label: 'Participants & Casualties' },
    { id: 'posturing', label: 'Global Posturing' },
  ]

  return (
    <div className="iwl-nav">
      <div className="iwl-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="iwl-logo-glyph">
          <circle cx="14" cy="14" r="12.5" stroke="rgba(218,255,74,.4)" strokeWidth="1"/>
          <circle cx="14" cy="14" r="9" stroke="rgba(218,255,74,.25)" strokeWidth=".7"/>
          <circle cx="14" cy="14" r="5.5" stroke="rgba(218,255,74,.18)" strokeWidth=".6"/>
          <line x1="14" y1="1.5" x2="14" y2="26.5" stroke="rgba(218,255,74,.2)" strokeWidth=".6"/>
          <line x1="1.5" y1="14" x2="26.5" y2="14" stroke="rgba(218,255,74,.1)" strokeWidth=".5"/>
          <circle cx="14" cy="20" r="2.2" fill="rgba(218,255,74,.6)"/>
          <line x1="14" y1="1.5" x2="14" y2="4" stroke="rgba(218,255,74,.45)" strokeWidth="1.2"/>
          <line x1="14" y1="24" x2="14" y2="26.5" stroke="rgba(218,255,74,.3)" strokeWidth=".8"/>
          <line x1="1.5" y1="14" x2="4" y2="14" stroke="rgba(218,255,74,.3)" strokeWidth=".8"/>
          <line x1="24" y1="14" x2="26.5" y2="14" stroke="rgba(218,255,74,.3)" strokeWidth=".8"/>
          <text x="16" y="21.5" fontFamily="monospace" fontSize="3.5" fill="rgba(218,255,74,.3)" letterSpacing=".04em">10K</text>
        </svg>
      </div>
      <div style={{position:'absolute',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',pointerEvents:'none',maxWidth:'40%',overflow:'hidden'}}>
        <div style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-med)',letterSpacing:'.18em',color:'var(--g7)',lineHeight:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>OPERATIONS WORKSPACE</div>
        <div style={{fontFamily:'var(--MONO)',fontSize:'var(--fs-micro)',letterSpacing:'.22em',color:'var(--g15)',marginTop:'2px',whiteSpace:'nowrap'}}>HADAL INTELLIGENCE TERMINAL</div>
      </div>
      <div className="iwl-tabs">
        {tabs.map(t => (
          <div key={t.id} className={`iwl-tab${activeTab === t.id ? ' on' : ''}`} onClick={() => onTabChange(t.id)}>
            {t.label}
          </div>
        ))}
      </div>
      <div className="iwl-nav-r">
        {aircraftCount != null && (
          <div className="iwl-sync" style={{ marginRight: 12 }}>
            <div className="jp-status-dot" style={{
              width: 5, height: 5, borderRadius: '50%',
              background: aircraftStatus === 'LIVE' ? 'var(--g)' : aircraftStatus === 'STALE' ? 'var(--warn)' : 'var(--g3)',
            }} />
            <span>{aircraftCount} TRACKS · {aircraftStatus}</span>
          </div>
        )}
        <div className="iwl-sync">
          <div className="iwl-sync-dot jp-status-dot active" />
          <span>{syncStatus}</span>
        </div>
      </div>
    </div>
  )
}
