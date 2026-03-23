interface ConsoleToolbarProps {
  editMode: boolean
  presetLabel: string
  presetId: string
  custom: boolean
  onPresetChange: (presetId: string) => void
  onEditToggle: () => void
}

const PRESET_OPTIONS = [
  { id: 'shift-brief', label: 'SHIFT BRIEF' },
  { id: 'incident-focus', label: 'INCIDENT FOCUS' },
  { id: 'air-picture', label: 'AIR PICTURE' },
  { id: 'analysis-stack', label: 'ANALYSIS STACK' },
  { id: 'custom', label: 'CUSTOM' },
]

export function ConsoleToolbar({
  editMode,
  presetLabel,
  presetId,
  custom,
  onPresetChange,
  onEditToggle,
}: ConsoleToolbarProps) {
  const value = custom ? 'custom' : presetId

  return (
    <div className={`console-toolbar jp-panel${editMode ? ' is-editing' : ''}`}>
      <div className="console-toolbar-block">
        <span className="console-toolbar-label">LAYOUT</span>
        <div className="console-toolbar-select-wrap">
          <select
            className="console-toolbar-select"
            value={value}
            onChange={e => {
              if (e.target.value !== 'custom') onPresetChange(e.target.value)
            }}
          >
            {PRESET_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <span className="console-toolbar-hint">{presetLabel}</span>
      </div>
      <div className="console-toolbar-block meta">
        <span className="console-toolbar-label">MODE</span>
        <span className={`console-toolbar-mode${editMode ? ' edit' : ''}`}>
          {editMode ? 'CONSOLE EDIT MODE' : 'LOCKED OPERATIONAL VIEW'}
        </span>
      </div>
      <button className={`console-toolbar-edit${editMode ? ' active' : ''}`} onClick={onEditToggle}>
        {editMode ? 'SAVE / EXIT' : 'EDIT'}
      </button>
    </div>
  )
}
