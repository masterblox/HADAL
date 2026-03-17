import { useState, useMemo } from 'react'
import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import { usePizzaSlice } from '@/canvas/usePizzaSlice'
import { useCasualtyCounter } from '@/hooks/useCasualtyCounter'
import { iwlFeedSeed } from '@/data/map-events'
import type { Incident } from '@/hooks/useDataPipeline'

interface IwlRightPanelProps {
  incidents: Incident[]
}

export function IwlRightPanel({ incidents: _incidents }: IwlRightPanelProps) {
  const [feedTab, setFeedTab] = useState<'mil' | 'civ' | 'ent'>('mil')
  const noiseRef = useNoiseCanvas({ grayscale: true, interval: 80 })
  const pizzaRef = usePizzaSlice()
  const milCas = useCasualtyCounter(1847)
  const civCas = useCasualtyCounter(423)
  const entCas = useCasualtyCounter(11)

  const [pizzaVal, setPizzaVal] = useState('$18.40')
  const [pizzaTime, setPizzaTime] = useState('—')

  useState(() => {
    const tick = () => {
      const jitter = (Math.random() - .5) * .18
      setPizzaVal('$' + (18.40 + jitter).toFixed(2))
      setPizzaTime(new Date().toISOString().slice(11, 19) + ' UTC')
    }
    tick()
    const id = setInterval(tick, 8000)
    return () => clearInterval(id)
  })

  const typeTag: Record<string, string> = {missile:'iwl-tag-strike',airstrike:'iwl-tag-launch',intercept:'iwl-tag-intercept',diplomatic:'iwl-tag-conf'}
  const typeCol: Record<string, string> = {missile:'rgba(255,140,0,.9)',airstrike:'rgba(255,140,0,.9)',intercept:'rgba(196,255,44,.9)',diplomatic:'rgba(180,120,255,.9)'}

  const feedEvents = useMemo(() => {
    const isMilType = (t: string) => ['missile', 'airstrike', 'intercept', 'ground'].includes(t)
    const all = iwlFeedSeed.map((e, i) => ({ ...e, id: i + 1, isMil: isMilType(e.type) }))
    if (feedTab === 'mil') return all.filter(e => e.isMil)
    return all
  }, [feedTab])

  return (
    <div className="iwl-right-inner">
      <div className="iwl-cas-grid iwl-panel" style={{display:'grid'}}>
        <div className="iwl-cas"><div className="iwl-cas-v red">{milCas.toLocaleString()}</div><div className="iwl-cas-l">MILITARY</div></div>
        <div className="iwl-cas"><div className="iwl-cas-v oran">{civCas.toLocaleString()}</div><div className="iwl-cas-l">CIVILIANS</div></div>
        <div className="iwl-cas"><div className="iwl-cas-v">{entCas}</div><div className="iwl-cas-l">ENTITIES</div></div>
      </div>

      <div className="iwl-feed-wrap">
        <canvas ref={noiseRef} className="NOISE" />
        <div className="iwl-feed-tabs">
          {(['mil','civ','ent'] as const).map(t => (
            <div key={t} className={`iwl-ftab${feedTab === t ? ' on' : ''}`} onClick={() => setFeedTab(t)}>
              {t === 'mil' ? 'Military' : t === 'civ' ? 'Civilians' : 'Entities'}
            </div>
          ))}
        </div>
        <div className="iwl-feed-hdr">
          <div className="iwl-sync-dot" />
          <span className="iwl-feed-title">Intel Feed</span>
          <span className="iwl-feed-ct">{feedEvents.length}</span>
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

      <div className="iwl-telem">
        <div className="iwl-telem-h">&#9670; TACTICAL TELEMETRY</div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">THEATRE THREAT</span><span className="iwl-telem-v" style={{color:'var(--warn)'}}>CRITICAL</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">AIR DEF COVER</span><span className="iwl-telem-v" style={{color:'rgba(255,140,0,.7)'}}>61%</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">ACTIVE VECTORS</span><span className="iwl-telem-v" style={{color:'rgba(255,140,0,.8)'}}>8</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">OSINT FEEDS</span><span className="iwl-telem-v" style={{color:'var(--g)'}}>44</span></div>
        <div className="iwl-telem-row"><span className="iwl-telem-k">LAST STRIKE</span><span className="iwl-telem-v" style={{color:'var(--g5)'}}>—</span></div>
      </div>

      <div className="pizza-card">
        <div className="pizza-hdr">&#9670; PENTAGON PIZZA INDEX</div>
        <canvas ref={pizzaRef} width={110} height={90} />
        <div className="pizza-val">{pizzaVal}</div>
        <div className="pizza-sub">ARLINGTON VA · SLICE PRICE · WAR-ADJUSTED</div>
        <div className="pizza-ticker">
          <div className="pizza-ticker-row"><span>&#9650; WAR PREMIUM</span><span style={{color:'rgba(196,255,44,.5)'}}>+$2.10</span></div>
          <div className="pizza-ticker-row"><span>BASELINE (FY24)</span><span>$16.30</span></div>
          <div className="pizza-ticker-row"><span>LAST UPDATE</span><span>{pizzaTime}</span></div>
        </div>
      </div>
    </div>
  )
}
