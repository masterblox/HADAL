interface IwlBottomProps {
  datalinkText: string
}

export function IwlBottom({ datalinkText }: IwlBottomProps) {
  return (
    <div className="iwl-bottom">
      <div className="iwl-datalink">
        <span className="iwl-datalink-blink">&#9608;</span>
        <span>{datalinkText}</span>
      </div>
      <div className="iwl-bot-div" />
      <button className="iwl-share-btn">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{flexShrink:0}}>
          <circle cx="5" cy="5" r="3.5" stroke="rgba(255,140,0,.8)" strokeWidth="1"/>
          <line x1="5" y1="1" x2="5" y2="9" stroke="rgba(255,140,0,.5)" strokeWidth=".8"/>
          <line x1="1" y1="5" x2="9" y2="5" stroke="rgba(255,140,0,.5)" strokeWidth=".8"/>
        </svg>
        SHARE LIVE MAP
      </button>
      <button className="iwl-export-btn">&#11015; EXPORT TACTICAL SITREP</button>
    </div>
  )
}
