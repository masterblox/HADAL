import { useMemo } from 'react'
import { MissileCard } from './MissileCard'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { Incident } from '@/hooks/useDataPipeline'

/* ── Derive kinetic counts from live incidents ── */

interface CountryStats {
  missile: number; drone: number; cruise: number; total: number
}

function classifyType(title: string): 'missile' | 'drone' | 'cruise' | 'other' {
  const t = (title || '').toLowerCase()
  if (t.includes('cruise')) return 'cruise'
  if (t.includes('drone') || t.includes('uav')) return 'drone'
  if (t.includes('missile') || t.includes('ballistic') || t.includes('intercept')) return 'missile'
  return 'other'
}

function deriveKineticStats(incidents: Incident[]) {
  const countries: Record<string, CountryStats> = {
    uae: { missile: 0, drone: 0, cruise: 0, total: 0 },
    kuwait: { missile: 0, drone: 0, cruise: 0, total: 0 },
    qatar: { missile: 0, drone: 0, cruise: 0, total: 0 },
    bahrain: { missile: 0, drone: 0, cruise: 0, total: 0 },
  }

  for (const inc of incidents) {
    const country = (inc.location?.country || '').toLowerCase()
    const matched = countries[country]
    if (!matched) continue
    const wt = classifyType(inc.title || '')
    if (wt === 'missile') matched.missile++
    else if (wt === 'drone') matched.drone++
    else if (wt === 'cruise') matched.cruise++
    matched.total++
  }

  return countries
}

/* ── Component ── */

interface MissileDefenseStripProps {
  sandbox: boolean
  incidents: Incident[]
}

export function MissileDefenseStrip({ sandbox, incidents }: MissileDefenseStripProps) {
  const stats = useMemo(() => deriveKineticStats(incidents), [incidents])
  const hasLive = incidents.length > 0

  const totalMissile = Object.values(stats).reduce((s, c) => s + c.missile, 0)
  const totalDrone = Object.values(stats).reduce((s, c) => s + c.drone, 0)
  const totalCruise = Object.values(stats).reduce((s, c) => s + c.cruise, 0)
  const totalAll = totalMissile + totalDrone + totalCruise

  function mkBars(s: CountryStats) {
    const bars = []
    if (s.missile > 0) bars.push({ l: 'BALLISTIC', w: Math.min(100, (s.missile / Math.max(1, s.total)) * 100), v: String(s.missile) })
    if (s.cruise > 0) bars.push({ l: 'CRUISE', w: Math.min(100, (s.cruise / Math.max(1, s.total)) * 100), v: String(s.cruise) })
    if (s.drone > 0) bars.push({ l: 'DRONES', w: Math.min(100, (s.drone / Math.max(1, s.total)) * 100), v: String(s.drone) })
    if (bars.length === 0) bars.push({ l: 'TOTAL', w: 0, v: '0' })
    return bars
  }

  const cards = [
    { country: 'UAE', src: hasLive ? 'OSINT' : 'STATIC', val: stats.uae.total, label: 'EVENTS', bars: mkBars(stats.uae), icon: 'ballistic' as const },
    { country: 'KUWAIT', src: hasLive ? 'OSINT' : 'STATIC', val: stats.kuwait.total, label: 'EVENTS', bars: mkBars(stats.kuwait), icon: 'drone' as const },
    { country: 'QATAR', src: hasLive ? 'OSINT' : 'STATIC', val: stats.qatar.total, label: 'EVENTS', bars: mkBars(stats.qatar), icon: 'cruise' as const },
    { country: 'BAHRAIN', src: hasLive ? 'OSINT' : 'STATIC', val: stats.bahrain.total, label: 'EVENTS', bars: mkBars(stats.bahrain), icon: 'intercept' as const },
  ]

  return (
    <div className="missile-section">
      <div className="ms-hdr jp-panel-header">
        <div className={`HDR-DOT jp-status-dot ${hasLive ? 'active' : 'error'}`} />
        &#9670; THEATRE KINETIC DATA · {hasLive ? 'DERIVED FROM OSINT FEED' : 'NO LIVE DATA'}
        {!hasLive && <span className="prov-badge" style={{marginLeft:8}}>AWAITING PIPELINE</span>}
      </div>
      <div className="mc-grid">
        <ResizablePanelGroup orientation="horizontal">
          {cards.flatMap((c, i) => {
            const panel = (
              <ResizablePanel key={c.country} id={`mc-${c.country}`} defaultSize="25%" minSize="10%">
                <MissileCard {...c} index={i} />
              </ResizablePanel>
            )
            if (i === 0) return [panel]
            return [
              <ResizableHandle key={`h-${c.country}`} disabled={!sandbox} />,
              panel,
            ]
          })}
        </ResizablePanelGroup>
      </div>
      <div className="jp-intel m-agg">
        <div className="jp-intel-cell"><div className="jp-intel-lbl">BALLISTIC</div><div className="ag-v jp-intel-val">{totalMissile}</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">DRONES</div><div className="ag-v jp-intel-val">{totalDrone}</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">CRUISE</div><div className="ag-v jp-intel-val">{totalCruise}</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">TOTAL KINETIC</div><div className="ag-v jp-intel-val">{totalAll}</div></div>
        <div className="jp-intel-cell"><div className="jp-intel-lbl">COUNTRIES</div><div className="ag-v jp-intel-val">{Object.values(stats).filter(c => c.total > 0).length}</div></div>
      </div>
    </div>
  )
}
