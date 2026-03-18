import { useMemo, useState } from 'react'
import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import { iwlFeedSeed } from '@/data/map-events'
import type { Incident } from '@/hooks/useDataPipeline'

interface IwlRightPanelProps {
  incidents: Incident[]
}

export function IwlRightPanel({ incidents }: IwlRightPanelProps) {
  const [feedTab, setFeedTab] = useState<'mil' | 'civ' | 'ent'>('mil')
  const noiseRef = useNoiseCanvas({ grayscale: true, interval: 80 })

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
  const typeCol: Record<string, string> = {missile:'rgba(255,140,0,.9)',airstrike:'rgba(255,140,0,.9)',intercept:'rgba(196,255,44,.9)',diplomatic:'rgba(180,120,255,.9)'}

  // Use live incidents for feed when available, fall back to static seed
  const feedEvents = useMemo(() => {
    if (hasLive) {
      const mapped = incidents.slice(0, 20).map((inc, i) => ({
        id: i + 1,
        title: inc.title || 'Unknown event',
        type: inc.type || 'general',
        conf: inc.credibility ?? 50,
        time: inc.published ? new Date(inc.published).toISOString().slice(11, 16) : '—',
        isMil: ['missile', 'airstrike', 'drone', 'ground'].some(t => (inc.type || '').toLowerCase().includes(t)),
      }))
      if (feedTab === 'mil') return mapped.filter(e => e.isMil)
      return mapped
    }
    // Static fallback
    const isMilType = (t: string) => ['missile', 'airstrike', 'intercept', 'ground'].includes(t)
    const all = iwlFeedSeed.map((e, i) => ({ ...e, id: i + 1, isMil: isMilType(e.type) }))
    if (feedTab === 'mil') return all.filter(e => e.isMil)
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

  return (
    <div className="iwl-right-inner">
      <div className="jp-intel iwl-cas-grid" style={{display:'grid'}}>
        <div className="iwl-cas jp-intel-cell"><div className="iwl-cas-v red jp-intel-val">{casualtyStats.mil.toLocaleString()}</div><div className="iwl-cas-l jp-intel-lbl">MILITARY {!hasLive && <span className="prov-badge">NO DATA</span>}</div></div>
        <div className="iwl-cas jp-intel-cell"><div className="iwl-cas-v oran jp-intel-val">{casualtyStats.civ.toLocaleString()}</div><div className="iwl-cas-l jp-intel-lbl">CIVILIANS {!hasLive && <span className="prov-badge">NO DATA</span>}</div></div>
        <div className="iwl-cas jp-intel-cell"><div className="iwl-cas-v jp-intel-val">{casualtyStats.entities}</div><div className="iwl-cas-l jp-intel-lbl">SOURCES</div></div>
      </div>

      <div className="jp-panel iwl-feed-wrap">
        <canvas ref={noiseRef} className="NOISE" />
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
          {!hasLive && <span className="prov-badge" style={{marginLeft:8}}>STATIC</span>}
        </div>
        <div className="iwl-feed-scroll">
          {feedEvents.map(e => (
            <div key={e.id} className="iwl-evt">
              <div className="iwl-evt-top">
                <div className="iwl-evt-dot" style={{background:typeCol[e.type]||'rgba(196,255,44,.9)',boxShadow:`0 0 4px ${typeCol[e.type]||'rgba(196,255,44,.9)'}`}} />
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
        <div className="iwl-telem-h jp-panel-header">&#9670; TACTICAL TELEMETRY</div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">ACTIVE EVENTS</span><span className="iwl-telem-v" style={{color: incidents.length > 0 ? 'var(--g)' : 'var(--g3)'}}>{incidents.length || '—'}</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">KINETIC EVENTS</span><span className="iwl-telem-v" style={{color:'var(--warn)'}}>{incidents.filter(i => ['missile','airstrike','drone'].some(t => (i.type||'').toLowerCase().includes(t))).length || '—'}</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">SOURCES ACTIVE</span><span className="iwl-telem-v" style={{color:'var(--g)'}}>{casualtyStats.entities || '—'}</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">LAST STRIKE</span><span className="iwl-telem-v" style={{color:'var(--g5)'}}>{lastStrike}</span></div>
      </div>

    </div>
  )
}
