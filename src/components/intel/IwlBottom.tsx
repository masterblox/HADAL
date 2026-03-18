interface IwlBottomProps {
  datalinkText: string
}

export function IwlBottom({ datalinkText }: IwlBottomProps) {
  return (
    <div className="iwl-bottom">
      <div className="iwl-datalink">
        <span className="iwl-datalink-indicator">&#9608;</span>
        <span>{datalinkText}</span>
      </div>
    </div>
  )
}
