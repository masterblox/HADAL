import type { ReactNode } from 'react'

interface ConsoleTileProps {
  icon: string
  title: string
  status?: 'live' | 'stale' | 'offline'
  source: string
  updated: string
  editMode: boolean
  onRemove?: () => void
  children: ReactNode
}

export function ConsoleTile({
  icon,
  title,
  status = 'live',
  source,
  updated,
  editMode,
  onRemove,
  children,
}: ConsoleTileProps) {
  return (
    <section className={`console-tile jp-panel${editMode ? ' is-editing' : ''}`}>
      <header className="console-tile-head">
        <div className="console-tile-head-main">
          <span className="console-tile-icon">{icon}</span>
          <span className="console-tile-title">{title}</span>
        </div>
        <div className="console-tile-head-meta">
          <span className={`console-tile-status ${status}`}>{status.toUpperCase()}</span>
          {editMode && onRemove && (
            <button className="console-tile-remove" onClick={onRemove} aria-label={`Remove ${title}`}>
              ×
            </button>
          )}
        </div>
      </header>
      <div className="console-tile-body">{children}</div>
      <footer className="console-tile-foot">
        <span>SRC: {source}</span>
        <span>UPD: {updated}</span>
      </footer>
      {editMode && (
        <>
          <span className="console-tile-drag" aria-hidden="true">⠿</span>
          <span className="console-tile-resize" aria-hidden="true" />
        </>
      )}
    </section>
  )
}
