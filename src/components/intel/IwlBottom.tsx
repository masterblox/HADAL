interface IwlBottomProps {
  datalinkText: string
  onExportSitrep?: () => void
}

export function IwlBottom({ datalinkText, onExportSitrep }: IwlBottomProps) {
  return (
    <div className="iwl-bottom">
      <div className="iwl-datalink">
        <span className="iwl-datalink-indicator">&#9608;</span>
        <span>{datalinkText || 'PIPELINE STATUS UNKNOWN'}</span>
      </div>
      <div className="iwl-bot-div" />
      <button className="iwl-export-btn" onClick={onExportSitrep} disabled={!onExportSitrep}>
        &#11015; EXPORT TACTICAL SITREP
      </button>
    </div>
  )
}
