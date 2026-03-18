import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { currencyData, dreData } from '@/data/gulf-economic'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { PriceData } from '@/hooks/useDataPipeline'

interface EconomicSectionProps {
  prices: PriceData | null
  sandbox: boolean
}

interface MarketCard {
  symbol: string
  venue: string
  name: string
  last: string
  change: string
  up: boolean
  series: Array<{ idx: number; value: number }>
  status: string
  mode: 'area' | 'line' | 'bars' | 'composed'
}

interface RealEstateRow {
  area: string
  premium: string
  move: string
  up: boolean
  bias: string
  occupancy: string
  history: Array<{ idx: number; value: number }>
}

function makeSeries(values: number[]) {
  return values.map((value, idx) => ({ idx, value }))
}

function generateSeries(base: number, len: number, positiveBias = 0.15) {
  const points: number[] = []
  let current = base * (0.95 + Math.random() * 0.04)
  for (let i = 0; i < len; i++) {
    current += ((base - current) * 0.18) + (Math.random() - 0.5 + positiveBias) * (base * 0.015)
    points.push(Number(current.toFixed(3)))
  }
  points[len - 1] = Number(base.toFixed(3))
  return makeSeries(points)
}

function MarketTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ value?: number; color?: string }>
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="eco-tooltip">
      <span className="eco-tooltip-label">LAST</span>
      <span className="eco-tooltip-value">{payload[0].value}</span>
    </div>
  )
}

function formatMiniTick(value: number) {
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (Math.abs(value) >= 10) return value.toFixed(1)
  return value.toFixed(2)
}

export function EconomicSection({ prices, sandbox }: EconomicSectionProps) {
  const marketCards = useMemo<MarketCard[]>(() => {
    if (prices?.brent) {
      return [
        {
          symbol: 'CO1',
          venue: 'ICE',
          name: 'BRENT CRUDE',
          last: `$${prices.brent.price.toFixed(2)}`,
          change: prices.brent.formatted_change || `${prices.brent.change >= 0 ? '+' : ''}${prices.brent.change.toFixed(2)}%`,
          up: (prices.brent.change ?? 0) >= 0,
          series: generateSeries(prices.brent.price, 24, 0.1),
          status: 'LIVE',
          mode: 'area',
        },
        {
          symbol: 'XAU',
          venue: 'OTC',
          name: 'GOLD SPOT',
          last: `$${(prices.gold?.price ?? 0).toFixed(0)}`,
          change: prices.gold?.formatted_change || `${(prices.gold?.change ?? 0) >= 0 ? '+' : ''}${(prices.gold?.change ?? 0).toFixed(2)}%`,
          up: (prices.gold?.change ?? 0) >= 0,
          series: generateSeries(prices.gold?.price ?? 0, 24, 0.04),
          status: 'LIVE',
          mode: 'line',
        },
        {
          symbol: 'NG1',
          venue: 'NYMEX',
          name: 'NATURAL GAS',
          last: `$${(prices.gas?.price ?? 0).toFixed(3)}`,
          change: prices.gas?.formatted_change || `${(prices.gas?.change ?? 0) >= 0 ? '+' : ''}${(prices.gas?.change ?? 0).toFixed(2)}%`,
          up: (prices.gas?.change ?? 0) >= 0,
          series: generateSeries(prices.gas?.price ?? 0, 24, -0.03),
          status: 'LIVE',
          mode: 'bars',
        },
        {
          symbol: 'BTC',
          venue: 'XCRY',
          name: 'BITCOIN',
          last: `$${(prices.bitcoin?.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          change: prices.bitcoin?.formatted_change || `${(prices.bitcoin?.change ?? 0) >= 0 ? '+' : ''}${(prices.bitcoin?.change ?? 0).toFixed(2)}%`,
          up: (prices.bitcoin?.change ?? 0) >= 0,
          series: generateSeries(prices.bitcoin?.price ?? 0, 24, 0.02),
          status: 'LIVE',
          mode: 'composed',
        },
      ]
    }

    return [
      { symbol: 'CO1', venue: 'ICE', name: 'BRENT CRUDE', last: '$107.40', change: '+23.1%', up: true, series: makeSeries([71,73,70,75,78,82,86,92,99,104,106,107,109,111,110,112,114,115,116,118,117,119,121,122]), status: 'SIM', mode: 'area' },
      { symbol: 'XAU', venue: 'OTC', name: 'GOLD SPOT', last: '$2,412', change: '+1.4%', up: true, series: makeSeries([2280,2282,2288,2295,2302,2310,2318,2326,2335,2340,2348,2356,2361,2370,2378,2386,2394,2402,2406,2409,2411,2415,2413,2412]), status: 'SIM', mode: 'line' },
      { symbol: 'NG1', venue: 'NYMEX', name: 'NATURAL GAS', last: '$2.731', change: '-0.8%', up: false, series: makeSeries([3.12,3.1,3.08,3.05,3.0,2.98,2.96,2.93,2.9,2.88,2.86,2.84,2.83,2.82,2.8,2.79,2.78,2.77,2.76,2.75,2.74,2.73,2.732,2.731]), status: 'SIM', mode: 'bars' },
      { symbol: 'BTC', venue: 'XCRY', name: 'BITCOIN', last: '$64,220', change: '+2.2%', up: true, series: makeSeries([60200,60600,61050,61400,61900,62240,62610,63020,63380,63820,64100,64420,64800,64650,64310,64020,63900,64140,64520,64770,65010,64680,64380,64220]), status: 'SIM', mode: 'composed' },
    ]
  }, [prices])

  const fxRows = useMemo(() => {
    return currencyData.map((currency, index) => ({
      ...currency,
      depth: `${(3 + index) * 120}K`,
      session: index === 0 ? 'PEG' : index === 1 ? 'LDN' : 'NY',
      tone: currency.up ? 'UP' : 'DN',
      flow: index === 0 ? 'CB FIX' : index === 1 ? 'RISK OFF' : 'CTA BID',
    }))
  }, [])

  const realEstateRows = useMemo<RealEstateRow[]>(() => {
    return dreData.map((entry, index) => ({
      area: entry.area,
      premium: entry.v,
      move: entry.chg,
      up: entry.up,
      bias: entry.up ? 'RISK BID' : 'SOFTENING',
      occupancy: `${92 - index * 4}%`,
      history: generateSeries(100 + index * 3, 12, entry.up ? 0.08 : -0.03),
    }))
  }, [])

  return (
    <section className="eco-section jp-panel sev-nominal">
      <div className="eco-head eco-terminal-head">
        <div className="eco-head-block">
          <span className="eco-ht">MARKET INTELLIGENCE MONITOR</span>
          <span className="eco-head-sub">CROSS-ASSET · MACRO SENSITIVITY · GULF CORRELATION</span>
        </div>
        <div className="eco-head-metrics">
          <span className="eco-chip">SESSION DXB</span>
          <span className="eco-chip">{prices?.brent ? 'LIVE FEED' : 'SIMULATED FEED'}</span>
          <span className="eco-chip">LAST SYNC {new Date().toISOString().slice(11, 19)}Z</span>
        </div>
      </div>

      <div className="eco-grid">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="eco-left" defaultSize="43%" minSize="28%">
            <div className="eco-half eco-book">
              <div className="eco-sub">FX / RESERVE BOARD</div>
              <div className="eco-book-head">
                <span>PAIR</span>
                <span>DESCRIPTION</span>
                <span>LAST</span>
                <span>CHG</span>
                <span>DEPTH</span>
                <span>FLOW</span>
              </div>
              <div className="eco-book-body">
                {fxRows.map(row => (
                  <div key={row.pair} className="eco-book-row">
                    <div className="eco-book-pair">
                      <span className="CUR-PAIR">{row.pair}</span>
                      <span className="eco-book-session">{row.session}</span>
                    </div>
                    <div className="eco-book-meta">
                      <div className="CUR-NAME">{row.name}</div>
                      <div className="CUR-SPREAD">{row.spread}</div>
                    </div>
                    <div className="eco-book-last">{row.val}</div>
                    <div className={`eco-book-change ${row.tone}`}>{row.chg}</div>
                    <div className="eco-book-depth">{row.depth}</div>
                    <div className="eco-book-flow">{row.flow}</div>
                  </div>
                ))}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle disabled={!sandbox} />

          <ResizablePanel id="eco-right" defaultSize="57%" minSize="35%">
            <div className="eco-half">
              <div className="eco-sub">CROSS-ASSET MONITORS</div>
              <div className="eco-market-grid">
                {marketCards.map(card => (
                  <article key={card.symbol} className="eco-market-card">
                    <div className="eco-market-head">
                      <div>
                        <div className="eco-market-symbol">{card.symbol} <span>{card.venue}</span></div>
                        <div className="eco-market-name">{card.name}</div>
                      </div>
                      <div className={`eco-market-status ${card.status === 'LIVE' ? 'live' : 'sim'}`}>{card.status}</div>
                    </div>
                    <div className="eco-market-quote">
                      <div className="eco-market-last">{card.last}</div>
                      <div className={`eco-market-change ${card.up ? 'UP' : 'DN'}`}>{card.change}</div>
                    </div>
                    <div className="eco-market-chart">
                      {card.mode === 'area' && (
                        <ResponsiveContainer width="100%" height={110}>
                          <AreaChart data={card.series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`eco-fill-${card.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={card.up ? 'rgba(255,160,30,.45)' : 'rgba(255,90,20,.4)'} />
                                <stop offset="100%" stopColor="rgba(255,140,0,0)" />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                            <XAxis dataKey="idx" hide />
                            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip content={<MarketTooltip />} cursor={{ stroke: 'rgba(255,140,0,.18)' }} />
                            <Area
                              type="monotone"
                              dataKey="value"
                              stroke={card.up ? 'rgba(255,160,30,.92)' : 'rgba(255,90,20,.9)'}
                              fill={`url(#eco-fill-${card.symbol})`}
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}

                      {card.mode === 'line' && (
                        <ResponsiveContainer width="100%" height={110}>
                          <LineChart data={card.series} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false} />
                            <XAxis dataKey="idx" hide />
                            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                            <Tooltip content={<MarketTooltip />} cursor={{ stroke: 'rgba(255,255,255,.12)' }} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={card.up ? 'rgba(255,196,92,.95)' : 'rgba(255,90,20,.9)'}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}

                      {card.mode === 'bars' && (
                        <ResponsiveContainer width="100%" height={110}>
                          <BarChart data={card.series} margin={{ top: 12, right: 0, left: 0, bottom: 0 }} barCategoryGap={2}>
                            <CartesianGrid stroke="rgba(255,255,255,.035)" vertical={false} />
                            <XAxis dataKey="idx" hide />
                            <YAxis hide domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                            <Tooltip content={<MarketTooltip />} cursor={{ fill: 'rgba(255,255,255,.03)' }} />
                            <Bar dataKey="value" radius={[1, 1, 0, 0]}>
                              {card.series.map(point => (
                                <Cell
                                  key={`${card.symbol}-${point.idx}`}
                                  fill={point.value >= card.series[Math.max(point.idx - 1, 0)].value ? 'rgba(218,255,74,.68)' : 'rgba(255,90,20,.72)'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}

                      {card.mode === 'composed' && (
                        <ResponsiveContainer width="100%" height={110}>
                          <ComposedChart data={card.series} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,.04)" vertical={false} />
                            <XAxis dataKey="idx" hide />
                            <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
                            <Tooltip content={<MarketTooltip />} cursor={{ stroke: 'rgba(255,255,255,.12)' }} />
                            <Bar dataKey="value" fill="rgba(255,255,255,.08)" barSize={4} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={card.up ? 'rgba(255,196,92,.96)' : 'rgba(255,90,20,.92)'}
                              strokeWidth={2}
                              dot={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="eco-market-foot">
                      <span>VOL REL {card.up ? '0.84x' : '1.12x'}</span>
                      <span>RISK {card.up ? 'BID' : 'OFF'}</span>
                      <span>24H</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="dre-box eco-realestate-board">
        <div className="dre-sub">DUBAI REAL ESTATE BOARD</div>
        <div className="eco-re-head">
          <span>AREA</span>
          <span>WAR PREMIUM</span>
          <span>7D MOVE</span>
          <span>BIAS</span>
          <span>OCC</span>
          <span>TREND</span>
        </div>
        <div className="eco-re-board">
          {realEstateRows.map(row => (
            <div key={row.area} className="eco-re-row">
              <div className="dre-area">{row.area}</div>
              <div className={`dre-v ${row.up ? 'UP' : 'DN'}`}>{row.premium}</div>
              <div className={`dre-chg ${row.up ? 'UP' : 'DN'}`}>{row.move}</div>
              <div className={`eco-re-bias ${row.up ? 'UP' : 'DN'}`}>{row.bias}</div>
              <div className="eco-re-occ">{row.occupancy}</div>
              <div className="eco-re-trend">
                <ResponsiveContainer width="100%" height={32}>
                  <LineChart data={row.history} margin={{ top: 3, right: 0, left: 0, bottom: 0 }}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={row.up ? 'rgba(255,160,30,.9)' : 'rgba(255,90,20,.88)'}
                      strokeWidth={1.7}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        return (
                          <div className="eco-tooltip">
                            <span className="eco-tooltip-label">TREND</span>
                            <span className="eco-tooltip-value">{formatMiniTick(payload[0].value as number)}</span>
                          </div>
                        )
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
