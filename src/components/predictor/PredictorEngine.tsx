import { useState, useMemo, useRef, useEffect } from 'react'
import type { Incident, AirspaceData, PriceData } from '../../hooks/useDataPipeline'
import { usePrediction } from '../../hooks/usePrediction'
import { demoIncidents } from '@/data/demo-incidents'

/* ── helpers ── */

const regimeLabel = (t: number) =>
  t >= 70 ? 'CRITICAL' : t >= 45 ? 'ELEVATED' : t >= 20 ? 'GUARDED' : 'NOMINAL'

const regimeClass = (t: number) =>
  t >= 70 ? 'regime-critical' : t >= 45 ? 'regime-elevated' : t >= 20 ? 'regime-guarded' : 'regime-nominal'

const trendIcon = (t: string) =>
  t === 'escalating' ? '▲' : t === 'de-escalating' ? '▼' : '—'

const trendColor = (t: string) =>
  t === 'escalating' ? 'var(--warn)' : t === 'de-escalating' ? 'var(--g)' : 'var(--g3)'

const sevColor = (v: number) =>
  v >= 70 ? 'var(--warn)' : v >= 40 ? 'var(--g7)' : 'var(--g3)'

/* ── Component ── */

interface Props {
  incidents: Incident[]
  airspace: AirspaceData | null
  prices: PriceData | null
}

export function PredictorEngine({ incidents, airspace, prices }: Props) {
  const effectiveIncidents = incidents.length >= 5 ? incidents : demoIncidents
  const prediction = usePrediction(effectiveIncidents, airspace, prices)
  const isDemo = incidents.length < 5

  // Actor filter for scenarios — auto-show, no RUN button needed
  const [actorFilter, setActorFilter] = useState<string | null>(null)

  const filteredScenarios = useMemo(() => {
    if (!prediction?.scenarios?.length) return []
    if (!actorFilter) return prediction.scenarios.slice(0, 8)
    return prediction.scenarios.filter(s =>
      s.actors.includes(actorFilter) || s.actors.length === 0
    ).slice(0, 8)
  }, [prediction, actorFilter])

  // Unique actors from scenarios
  const scenarioActors = useMemo(() => {
    if (!prediction?.scenarios) return []
    const set = new Set<string>()
    for (const s of prediction.scenarios) {
      for (const a of s.actors) set.add(a)
    }
    return Array.from(set).sort()
  }, [prediction])

  if (!prediction) return null

  const p = prediction
  const g = p.global

  return (
    <section className="predictor-section jp-panel jp-corners sev-nominal">
      {/* ── Header + Regime ── */}
      <div className="pe-header">
        <div className="pe-header-left">
          <span className="pe-title">PREDICTION ENGINE</span>
          <span className="pe-provenance">
            LOCAL · BOOTSTRAP 5k · n={effectiveIncidents.length} · 14d
            {isDemo && ' · DEMO'}
          </span>
        </div>
        <div className={`pe-regime ${regimeClass(p.theatreThreatLevel)}`}>
          <span className="pe-regime-label">REGIME</span>
          <span className="pe-regime-value">{regimeLabel(p.theatreThreatLevel)}</span>
          <span className="pe-regime-score">{p.theatreThreatLevel}</span>
        </div>
      </div>

      {p.sufficient && (
        <>
          {/* ── Trend Summary ── */}
          {p.trendSummary && (
            <div className="pe-trend">
              <span className="pe-trend-text">{p.trendSummary.summary}</span>
              <span className="pe-trend-meta">
                {p.trendSummary.dailyAvg}/day
                {p.trendAnalysis && (
                  <>
                    <span className="sep">·</span>
                    {p.trendAnalysis.dominantEventType.toUpperCase()}
                    <span className="sep">·</span>
                    {p.trendAnalysis.mostTargetedCountry.toUpperCase()}
                    {p.trendAnalysis.escalationRate !== 0 && (
                      <>
                        <span className="sep">·</span>
                        <span style={{ color: p.trendAnalysis.escalationRate > 0 ? 'var(--warn)' : 'var(--g)' }}>
                          {p.trendAnalysis.escalationRate > 0 ? '+' : ''}{p.trendAnalysis.escalationRate}% esc
                        </span>
                      </>
                    )}
                  </>
                )}
              </span>
            </div>
          )}

          {/* ── Composite Signals Strip ── */}
          <div className="pe-signals">
            <SignalCell label="THREAT" value={p.theatreThreatLevel} warn={p.theatreThreatLevel >= 60} />
            <SignalCell label="AIRSPACE" value={p.airspacePressure} warn={p.airspacePressure >= 40} />
            <SignalCell label="CONTAGION" value={p.cascadeRisk.contagionScore} warn={p.cascadeRisk.contagionScore >= 50} />
            <SignalCell label="P(SEVERE)" value={g?.probSevere ?? 0} unit="%" warn={(g?.probSevere ?? 0) >= 40} />
            <SignalCell label="P(CRITICAL)" value={g?.probCritical ?? 0} unit="%" warn={(g?.probCritical ?? 0) >= 20} />
          </div>

          {/* ── Percentile Distribution ── */}
          {g && <PercentileFan percentiles={g.percentiles} mean={g.mean} stdDev={g.stdDev} />}

          {/* ── Daily Tempo Sparkline ── */}
          {p.trendAnalysis?.dailyFrequency && (
            <TempoSpark data={p.trendAnalysis.dailyFrequency} />
          )}

          {/* ── Time Horizon Comparison ── */}
          <div className="pe-horizons">
            <HorizonBar label="24H" data={p.timeWindows.h24} maxCount={Math.max(p.timeWindows.h24.count, p.timeWindows.h72.count, p.timeWindows.d7.count)} />
            <HorizonBar label="72H" data={p.timeWindows.h72} maxCount={Math.max(p.timeWindows.h24.count, p.timeWindows.h72.count, p.timeWindows.d7.count)} />
            <HorizonBar label="7D" data={p.timeWindows.d7} maxCount={Math.max(p.timeWindows.h24.count, p.timeWindows.h72.count, p.timeWindows.d7.count)} />
            {p.reactionWindow && (
              <div className="pe-horizon-cell pe-reaction">
                <span className="pe-hz-label">REACTION</span>
                <span className="pe-hz-value">{p.reactionWindow.medianResponseHours}h</span>
                <span className="pe-hz-sub">
                  fast {p.reactionWindow.fastResponseImpact} · slow {p.reactionWindow.slowResponseImpact}
                </span>
              </div>
            )}
          </div>

          {/* ── Category Severity Ranges ── */}
          <div className="pe-categories">
            <div className="pe-cat-header">
              <span className="pe-cat-col-name">TYPE</span>
              <span className="pe-cat-col-range">SEVERITY RANGE (P10 — P50 — P90)</span>
              <span className="pe-cat-col-n">N</span>
              <span className="pe-cat-col-trend">TREND</span>
            </div>
            {Object.entries(p.categories)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([type, cat]) => (
                <CategoryRange key={type} type={type} cat={cat} />
              ))}
          </div>

          {/* ── Cascade & Response Board ── */}
          <div className="pe-cascade-board">
            <div className="pe-cascade-col">
              <span className="pe-cb-title">CASCADE RISK</span>
              <div className="pe-cb-row">
                <span className="pe-cb-label">CLUSTERS</span>
                <span className="pe-cb-val">{p.cascadeRisk.clusterCount}</span>
              </div>
              <div className="pe-cb-row">
                <span className="pe-cb-label">MAX SIZE</span>
                <span className="pe-cb-val">{p.cascadeRisk.maxClusterSize}</span>
              </div>
              <div className="pe-cb-row">
                <span className="pe-cb-label">CONTAGION</span>
                <span className="pe-cb-val" style={{ color: p.cascadeRisk.contagionScore >= 50 ? 'var(--warn)' : 'var(--g7)' }}>
                  {p.cascadeRisk.contagionScore}
                </span>
              </div>
              <div className="pe-cb-bar">
                <div className="pe-cb-fill" style={{
                  width: `${p.cascadeRisk.contagionScore}%`,
                  background: p.cascadeRisk.contagionScore >= 50 ? 'var(--warn)' : 'var(--g)',
                }} />
              </div>
            </div>
            {p.reactionWindow && (
              <div className="pe-cascade-col">
                <span className="pe-cb-title">RESPONSE LATENCY</span>
                <div className="pe-cb-row">
                  <span className="pe-cb-label">MEDIAN</span>
                  <span className="pe-cb-val">{p.reactionWindow.medianResponseHours}h</span>
                </div>
                <div className="pe-response-compare">
                  <div className="pe-resp-bar-group">
                    <span className="pe-resp-label">FAST</span>
                    <div className="pe-resp-bar">
                      <div className="pe-resp-fill" style={{
                        width: `${p.reactionWindow.fastResponseImpact}%`,
                        background: 'var(--g)',
                      }} />
                    </div>
                    <span className="pe-resp-val">{p.reactionWindow.fastResponseImpact}</span>
                  </div>
                  <div className="pe-resp-bar-group">
                    <span className="pe-resp-label">SLOW</span>
                    <div className="pe-resp-bar">
                      <div className="pe-resp-fill" style={{
                        width: `${p.reactionWindow.slowResponseImpact}%`,
                        background: 'var(--warn)',
                      }} />
                    </div>
                    <span className="pe-resp-val">{p.reactionWindow.slowResponseImpact}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Scenario Ledger ── */}
          {filteredScenarios.length > 0 && (
            <div className="pe-scenario-ledger">
              <div className="pe-sl-header">
                <span className="pe-sl-title">SEQUENCE PROJECTIONS</span>
                <div className="pe-sl-filters">
                  <button
                    className={`pe-sl-filter ${!actorFilter ? 'active' : ''}`}
                    onClick={() => setActorFilter(null)}
                  >ALL</button>
                  {scenarioActors.map(a => (
                    <button
                      key={a}
                      className={`pe-sl-filter ${actorFilter === a ? 'active' : ''}`}
                      onClick={() => setActorFilter(actorFilter === a ? null : a)}
                    >{a.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="pe-sl-col-header">
                <span className="pe-sl-col-cat">CLASS</span>
                <span className="pe-sl-col-outcome">PROJECTION</span>
                <span className="pe-sl-col-prob">PROB</span>
                <span className="pe-sl-col-tf">WINDOW</span>
                <span className="pe-sl-col-sev">SEV</span>
              </div>
              {filteredScenarios.map((s, i) => (
                <div key={i} className="pe-sl-row" style={{ '--delay': `${i * 40}ms` } as React.CSSProperties}>
                  <span className="pe-sl-cat">{s.category}</span>
                  <span className="pe-sl-outcome">
                    {s.outcome}
                    {s.confidence && <span className="pe-sl-basis"> — {s.confidence}</span>}
                  </span>
                  <span className="pe-sl-prob">
                    <span className="pe-sl-prob-bar">
                      <span className="pe-sl-prob-fill" style={{
                        width: `${s.probability}%`,
                        background: s.probability >= 70 ? 'var(--warn)' : s.probability >= 40 ? 'var(--g)' : 'var(--g3)',
                      }} />
                    </span>
                    <span className="pe-sl-prob-val" style={{
                      color: s.probability >= 70 ? 'var(--warn)' : s.probability >= 40 ? 'var(--g7)' : 'var(--g3)',
                    }}>{s.probability}%</span>
                  </span>
                  <span className="pe-sl-tf">{s.timeframe}</span>
                  <span className="pe-sl-sev" style={{
                    color: s.severity === 'CRITICAL' || s.severity === 'HIGH' ? 'var(--warn)' : 'var(--g3)',
                  }}>{s.severity}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!p.sufficient && (
        <div className="pe-insufficient">
          <span>INSUFFICIENT DATA — NEED 5+ EVENTS IN 14-DAY WINDOW</span>
        </div>
      )}
    </section>
  )
}

/* ── Sub-components ── */

function SignalCell({ label, value, unit, warn }: { label: string; value: number; unit?: string; warn?: boolean }) {
  return (
    <div className="pe-signal-cell">
      <span className="pe-sig-label">{label}</span>
      <span className="pe-sig-value" style={{ color: warn ? 'var(--warn)' : 'var(--g7)' }}>
        {value}{unit || ''}
      </span>
      <div className="pe-sig-bar">
        <div className="pe-sig-fill" style={{
          width: `${Math.min(100, value)}%`,
          background: warn ? 'var(--warn)' : 'var(--g)',
        }} />
      </div>
    </div>
  )
}

function PercentileFan({ percentiles, mean, stdDev }: {
  percentiles: { p5: number; p10: number; p25: number; p50: number; p75: number; p90: number; p95: number }
  mean: number
  stdDev: number
}) {
  // Visual: horizontal range bars showing distribution tiers
  const max = 100
  const pct = (v: number) => `${(v / max) * 100}%`

  return (
    <div className="pe-distribution">
      <div className="pe-dist-header">
        <span className="pe-dist-title">SEVERITY DISTRIBUTION</span>
        <span className="pe-dist-stats">
          μ={mean} · σ={stdDev}
        </span>
      </div>
      <div className="pe-dist-fan">
        {/* P5-P95 background range */}
        <div className="pe-fan-track">
          <div className="pe-fan-range pe-fan-outer" style={{
            left: pct(percentiles.p5),
            width: pct(percentiles.p95 - percentiles.p5),
          }} />
          <div className="pe-fan-range pe-fan-inner" style={{
            left: pct(percentiles.p25),
            width: pct(percentiles.p75 - percentiles.p25),
          }} />
          <div className="pe-fan-median" style={{ left: pct(percentiles.p50) }} />
          {/* Severity zone markers */}
          <div className="pe-fan-zone-mark" style={{ left: '40%' }} />
          <div className="pe-fan-zone-mark pe-zone-warn" style={{ left: '70%' }} />
        </div>
        {/* Full labels — hidden at ≤430px, replaced by compact set */}
        <div className="pe-fan-labels pe-fan-labels-full">
          <span style={{ left: pct(percentiles.p5) }}>P5</span>
          <span style={{ left: pct(percentiles.p10) }}>P10</span>
          <span style={{ left: pct(percentiles.p25) }}>P25</span>
          <span className="pe-fan-label-med" style={{ left: pct(percentiles.p50) }}>P50</span>
          <span style={{ left: pct(percentiles.p75) }}>P75</span>
          <span style={{ left: pct(percentiles.p90) }}>P90</span>
          <span style={{ left: pct(percentiles.p95) }}>P95</span>
        </div>
        {/* Compact: inline row — visible only at ≤430px */}
        <div className="pe-fan-inline-compact">
          <span>P5 <b>{percentiles.p5}</b></span>
          <span>P25 <b>{percentiles.p25}</b></span>
          <span className="pe-fan-label-med">P50 <b>{percentiles.p50}</b></span>
          <span>P75 <b>{percentiles.p75}</b></span>
          <span>P95 <b>{percentiles.p95}</b></span>
        </div>
        <div className="pe-fan-values pe-fan-values-full">
          <span style={{ left: pct(percentiles.p5) }}>{percentiles.p5}</span>
          <span style={{ left: pct(percentiles.p25) }}>{percentiles.p25}</span>
          <span className="pe-fan-val-med" style={{ left: pct(percentiles.p50) }}>{percentiles.p50}</span>
          <span style={{ left: pct(percentiles.p75) }}>{percentiles.p75}</span>
          <span style={{ left: pct(percentiles.p95) }}>{percentiles.p95}</span>
        </div>
      </div>
    </div>
  )
}

function TempoSpark({ data }: { data: { date: string; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs || data.length === 0) return

    function draw() {
      const ctx = cvs!.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const w = cvs!.clientWidth
      const h = cvs!.clientHeight
      cvs!.width = w * dpr
      cvs!.height = h * dpr
      ctx.scale(dpr, dpr)

      const maxCount = Math.max(...data.map(d => d.count), 1)
      const barW = Math.max(2, (w - data.length) / data.length)
      const gap = 1

      ctx.clearRect(0, 0, w, h)

      // Background grid lines
      ctx.strokeStyle = 'rgba(218,255,74,.06)'
      ctx.lineWidth = 0.5
      for (let y = 0; y < h; y += h / 4) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Bars
      data.forEach((d, i) => {
        const x = i * (barW + gap)
        const barH = (d.count / maxCount) * (h - 4)
        const y = h - barH - 2

        if (d.count >= maxCount * 0.7) {
          ctx.fillStyle = 'rgba(255,140,0,.7)'
        } else if (d.count >= maxCount * 0.4) {
          ctx.fillStyle = 'rgba(218,255,74,.5)'
        } else {
          ctx.fillStyle = 'rgba(218,255,74,.25)'
        }
        ctx.fillRect(x, y, barW, barH)
      })
    }

    draw()

    const ro = new ResizeObserver(draw)
    ro.observe(cvs)
    return () => ro.disconnect()
  }, [data])

  return (
    <div className="pe-tempo">
      <span className="pe-tempo-label">DAILY TEMPO · 14D</span>
      <canvas ref={canvasRef} className="pe-tempo-canvas" />
    </div>
  )
}

function HorizonBar({ label, data, maxCount }: {
  label: string
  data: { meanSeverity: number; count: number }
  maxCount: number
}) {
  const countPct = maxCount > 0 ? (data.count / maxCount) * 100 : 0

  return (
    <div className="pe-horizon-cell">
      <span className="pe-hz-label">{label}</span>
      <div className="pe-hz-bar-row">
        <div className="pe-hz-bar">
          <div className="pe-hz-sev-fill" style={{
            width: `${data.meanSeverity}%`,
            background: sevColor(data.meanSeverity),
          }} />
        </div>
        <span className="pe-hz-value">{data.count > 0 ? data.meanSeverity : '—'}</span>
      </div>
      <div className="pe-hz-count-row">
        <div className="pe-hz-count-bar">
          <div className="pe-hz-count-fill" style={{ width: `${countPct}%` }} />
        </div>
        <span className="pe-hz-count">{data.count}</span>
      </div>
    </div>
  )
}

function CategoryRange({ type, cat }: {
  type: string
  cat: { count: number; meanSeverity: number; percentiles: { p10: number; p50: number; p90: number }; trend: string }
}) {
  const max = 100
  const pct = (v: number) => `${(v / max) * 100}%`

  return (
    <div className="pe-cat-row">
      <span className="pe-cat-name">{type.toUpperCase()}</span>
      <div className="pe-cat-range">
        <div className="pe-cat-track">
          <div className="pe-cat-bar" style={{
            left: pct(cat.percentiles.p10),
            width: pct(cat.percentiles.p90 - cat.percentiles.p10),
            background: cat.meanSeverity >= 70 ? 'rgba(255,140,0,.3)' : 'rgba(218,255,74,.15)',
          }} />
          <div className="pe-cat-median" style={{
            left: pct(cat.percentiles.p50),
            background: cat.meanSeverity >= 70 ? 'var(--warn)' : 'var(--g)',
          }} />
        </div>
      </div>
      <span className="pe-cat-n">{cat.count}</span>
      <span className="pe-cat-trend" style={{ color: trendColor(cat.trend) }}>
        {trendIcon(cat.trend)}
      </span>
    </div>
  )
}
