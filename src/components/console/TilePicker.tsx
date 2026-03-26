import type { ConsoleTileId } from '@/data/console-presets'
import { DevTag } from '@/components/shared/DevTag'

interface TilePickerProps {
  open: boolean
  availableTiles: Array<{ id: ConsoleTileId; label: string; icon: string; placed: boolean }>
  onSelect: (id: ConsoleTileId) => void
  onClose: () => void
}

export function TilePicker({ open, availableTiles, onSelect, onClose }: TilePickerProps) {
  if (!open) return null

  return (
    <div className="console-picker-backdrop" onClick={onClose} style={{ position: 'relative' }}>
      <div className="console-picker jp-panel" onClick={e => e.stopPropagation()}>
        <div className="console-picker-head">ADD TILE</div>
        <div className="console-picker-grid">
          {availableTiles.map(tile => (
            <button
              key={tile.id}
              className={`console-picker-item${tile.placed ? ' is-placed' : ''}`}
              disabled={tile.placed}
              onClick={() => onSelect(tile.id)}
            >
              <span className="console-picker-icon">{tile.icon}</span>
              <span className="console-picker-label">{tile.label}</span>
              {tile.placed && <span className="console-picker-tag">PLACED</span>}
            </button>
          ))}
        </div>
      </div>
      <DevTag id="A.4" />
    </div>
  )
}
