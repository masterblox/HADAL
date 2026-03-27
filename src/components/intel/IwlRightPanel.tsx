import { useMemo, useState } from 'react'
import { iwlFeedSeed } from '@/data/map-events'
import type { Incident } from '@/hooks/useDataPipeline'
import { DevTag } from '@/components/shared/DevTag'

interface IwlRightPanelProps {
  incidents: Incident[]
}

export function IwlRightPanel({ incidents }: IwlRightPanelProps) {
  const [feedTab, setFeedTab] = useState<'mil' | 'civ' | 'ent'>('mil')

  // Derive casualty estimates from incidents
  const casualtyStats = useMemo(() => {
    let mil = 0, civ = 0
    for (const inc of incidents) {
      mil += inc.casualties?.military ?? 0
      civ += inc.casualties?.civilian ?? 0
    }
    return { mil, civ, entities: new Set(incidents.map(i => i.source).filter(Boolean)).size }
  }, [incidents])

  const hasLive = incidents.length > 0

  const typeTag: Record<string, string> = {missile:'iwl-tag-strike',airstrike:'iwl-tag-launch',intercept:'iwl-tag-intercept',diplomatic:'iwl-tag-conf'}
  const typeCol: Record<string, string> = {missile:'rgba(255,140,0,.9)',airstrike:'rgba(255,140,0,.9)',intercept:'rgba(218,255,74,.9)',diplomatic:'rgba(180,120,255,.9)'}

  // Use live incidents for feed when available, fall back to static seed
  const feedEvents = useMemo(() => {
    if (hasLive) {
      const mapped = incidents.slice(0, 20).map((inc, i) => ({
        id: i + 1,
        title: inc.title || 'Unknown event',
        type: inc.type || 'general',
        conf: inc.credibility ?? 50,
        time: inc.published ? new Date(inc.published).toISOString().slice(11, 16) : '—',
        isMil: ['missile', 'airstrike', 'drone', 'ground'].some(t => new RegExp(`\\b${t}\\b`, 'i').test(inc.type || '')),
      }))
      if (feedTab === 'mil') return mapped.filter(e => e.isMil)
      if (feedTab === 'ent') return mapped.filter(e => !e.isMil)
      return mapped
    }
    // Static fallback
    const isMilType = (t: string) => ['missile', 'airstrike', 'intercept', 'ground'].includes(t)
    const all = iwlFeedSeed.map((e, i) => ({ ...e, id: i + 1, isMil: isMilType(e.type) }))
    if (feedTab === 'mil') return all.filter(e => e.isMil)
    if (feedTab === 'ent') return all.filter(e => !e.isMil)
    return all
  }, [feedTab, incidents, hasLive])

  // Derive latest strike time from incidents
  const lastStrike = useMemo(() => {
    const strikes = incidents.filter(i => {
      const t = (i.type || '').toLowerCase()
      return t.includes('missile') || t.includes('airstrike') || t.includes('drone')
    })
    if (strikes.length === 0) return '—'
    const latest = strikes.reduce((a, b) => {
      const ta = a.published ? new Date(a.published).getTime() : 0
      const tb = b.published ? new Date(b.published).getTime() : 0
      return tb > ta ? b : a
    })
    return latest.published ? new Date(latest.published).toISOString().slice(0, 16).replace('T', ' ') + 'Z' : '—'
  }, [incidents])

  // Signal integrity: 5 bars filled based on sources count (0–5 scale)
  const sigBars = Math.min(5, Math.max(0, Math.round((casualtyStats.entities / 5) * 5)))

  return (
    <div className="iwl-right-inner" style={{ position: 'relative' }}>
      <div className="iwl-panel-head">
        <span className="iwl-panel-head-label">Intel Core</span>
      </div>

      <div className="iwl-cas-grid" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr'}}>
        <div className="iwl-stat-cell">
          <div className="iwl-stat-num red">{casualtyStats.mil.toLocaleString()}</div>
          <div className="iwl-stat-lbl">Military</div>
        </div>
        <div className="iwl-stat-cell">
          <div className="iwl-stat-num amber">{casualtyStats.civ.toLocaleString()}</div>
          <div className="iwl-stat-lbl">Civilians</div>
        </div>
        <div className="iwl-stat-cell">
          <div className="iwl-stat-num">{casualtyStats.entities}</div>
          <div className="iwl-stat-lbl">Sources</div>
        </div>
      </div>

      <div className="jp-panel iwl-feed-wrap">
        <div className="iwl-feed-tabs">
          {(['mil','civ','ent'] as const).map(t => (
            <div key={t} className={`iwl-ftab${feedTab === t ? ' on' : ''}`} onClick={() => setFeedTab(t)}>
              {t === 'mil' ? 'Military' : t === 'civ' ? 'Civilians' : 'Entities'}
            </div>
          ))}
        </div>
        <div className="iwl-feed-hdr">
          <div className={`iwl-sync-dot jp-status-dot ${hasLive ? 'active' : 'error'}`} />
          <span className="iwl-feed-title">Intel Feed</span>
          <span className="iwl-feed-ct">{feedEvents.length}</span>
        </div>
        <div className="iwl-feed-scroll">
          {feedEvents.map(e => (
            <div key={e.id} className="iwl-evt">
              <div className="iwl-evt-top">
                <div className="iwl-evt-dot" style={{background:typeCol[e.type]||'rgba(218,255,74,.9)'}} />
                <span className="iwl-evt-id">EVT-{String(e.id).padStart(4,'0')}</span>
                <span className="iwl-evt-time">{e.time}</span>
              </div>
              <div className="iwl-evt-title">{e.title}</div>
              <div className="iwl-evt-tags">
                <span className={`iwl-tag ${typeTag[e.type]||'iwl-tag-conf'}`}>{e.type.toUpperCase()}</span>
                <span className="iwl-tag iwl-tag-conf">CONF {e.conf}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="jp-panel iwl-telem">
        <div className="iwl-telem-accent">
          <span className="iwl-telem-accent-label">Tactical Telemetry</span>
        </div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">Active Events</span><span className="iwl-telem-v" style={{color: incidents.length > 0 ? 'var(--g)' : 'rgba(218,255,74,.35)'}}>{incidents.length || '—'}</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">Kinetic Events</span><span className="iwl-telem-v" style={{color:'var(--warn)'}}>{incidents.filter(i => ['missile','airstrike','drone'].some(t => new RegExp(`\\b${t}\\b`, 'i').test(i.type || ''))).length || '—'}</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">Sources Active</span><span className="iwl-telem-v" style={{color:'rgba(218,255,74,.80)'}}>{casualtyStats.entities || '—'}</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">Last Strike</span><span className="iwl-telem-v" style={{color:'rgba(218,255,74,.60)'}}>{lastStrike}</span></div>
        <div className="iwl-sig-row">
          <span className="iwl-sig-k">Signal Integrity</span>
          <div className="iwl-sig-bars">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`iwl-sig-bar${i < sigBars ? ' on' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      <DevTag id="R" />
    </div>
  )
}
