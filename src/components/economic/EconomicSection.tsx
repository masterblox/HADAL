import { useMemo } from 'react'
import { currencyData, dreData } from '@/data/gulf-economic'
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
  status: string
}

interface RealEstateRow {
  area: string
  premium: string
  move: string
  up: boolean
  bias: string
  occupancy: string
}


export function EconomicSection({ prices, sandbox: _sandbox }: EconomicSectionProps) {
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
          status: 'LIVE',
        },
        {
          symbol: 'XAU',
          venue: 'OTC',
          name: 'GOLD SPOT',
          last: `$${(prices.gold?.price ?? 0).toFixed(0)}`,
          change: prices.gold?.formatted_change || `${(prices.gold?.change ?? 0) >= 0 ? '+' : ''}${(prices.gold?.change ?? 0).toFixed(2)}%`,
          up: (prices.gold?.change ?? 0) >= 0,
          status: 'LIVE',
        },
        {
          symbol: 'NG1',
          venue: 'NYMEX',
          name: 'NATURAL GAS',
          last: `$${(prices.gas?.price ?? 0).toFixed(3)}`,
          change: prices.gas?.formatted_change || `${(prices.gas?.change ?? 0) >= 0 ? '+' : ''}${(prices.gas?.change ?? 0).toFixed(2)}%`,
          up: (prices.gas?.change ?? 0) >= 0,
          status: 'LIVE',
        },
        {
          symbol: 'BTC',
          venue: 'XCRY',
          name: 'BITCOIN',
          last: `$${(prices.bitcoin?.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
          change: prices.bitcoin?.formatted_change || `${(prices.bitcoin?.change ?? 0) >= 0 ? '+' : ''}${(prices.bitcoin?.change ?? 0).toFixed(2)}%`,
          up: (prices.bitcoin?.change ?? 0) >= 0,
          status: 'LIVE',
        },
      ]
    }

    return [
      { symbol: 'CO1', venue: 'ICE', name: 'BRENT CRUDE', last: '$107.40', change: '+23.1%', up: true, status: 'SIM' },
      { symbol: 'XAU', venue: 'OTC', name: 'GOLD SPOT', last: '$2,412', change: '+1.4%', up: true, status: 'SIM' },
      { symbol: 'NG1', venue: 'NYMEX', name: 'NATURAL GAS', last: '$2.731', change: '-0.8%', up: false, status: 'SIM' },
      { symbol: 'BTC', venue: 'XCRY', name: 'BITCOIN', last: '$64,220', change: '+2.2%', up: true, status: 'SIM' },
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
    }))
  }, [])

  return (
    <section className="eco-section jp-panel sev-nominal">
      <div className="eco-head eco-terminal-head">
        <div className="eco-head-block">
          <h2 className="section-title">Economic Intelligence</h2>
          <span className="eco-head-sub">CROSS-ASSET · MACRO SENSITIVITY · GULF CORRELATION</span>
        </div>
        <div className="eco-head-metrics">
          <span className="eco-chip">SESSION DXB</span>
          <span className="eco-chip">LAST SYNC {new Date().toISOString().slice(11, 19)}Z</span>
        </div>
      </div>

      {/* Cross-Asset Quote Table */}
      <div className="eco-sub" style={{ marginTop: 4 }}>CROSS-ASSET MONITORS</div>
      <div className="eco-book-head" style={{ gridTemplateColumns: '48px 40px 1fr 90px 72px 60px' }}>
        <span>SYM</span><span>VEN</span><span>NAME</span><span>LAST</span><span>CHG</span><span>SRC</span>
      </div>
      {marketCards.map(card => (
        <div key={card.symbol} className="eco-book-row" style={{ gridTemplateColumns: '48px 40px 1fr 90px 72px 60px' }}>
          <div style={{ color: 'rgba(255,160,30,.9)', fontSize: 'var(--fs-med)' }}>{card.symbol}</div>
          <div style={{ color: 'rgba(255,140,0,.35)', fontSize: 'var(--fs-micro)' }}>{card.venue}</div>
          <div style={{ color: 'rgba(255,140,0,.5)', fontSize: 'var(--fs-micro)' }}>{card.name}</div>
          <div style={{ color: 'rgba(255,140,0,.95)', fontSize: 'var(--fs-med)' }}>{card.last}</div>
          <div className={card.up ? 'UP' : 'DN'} style={{ fontSize: 'var(--fs-micro)' }}>{card.change}</div>
          <div style={{ color: card.status === 'LIVE' ? 'var(--g5)' : 'rgba(255,140,0,.35)', fontSize: 'var(--fs-micro)' }}>{card.status}</div>
        </div>
      ))}

      {/* FX / Reserve Board */}
      <div className="eco-sub" style={{ marginTop: 14 }}>FX / RESERVE BOARD</div>
      <div className="eco-book-head">
        <span>PAIR</span><span>DESCRIPTION</span><span>LAST</span><span>CHG</span><span>DEPTH</span><span>FLOW</span>
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

      {/* Dubai Real Estate Board */}
      <div className="eco-sub" style={{ marginTop: 14 }}>DUBAI REAL ESTATE BOARD</div>
      <div className="eco-re-head" style={{ gridTemplateColumns: '120px 90px 72px 80px 48px' }}>
        <span>AREA</span><span>WAR PREM</span><span>7D MOVE</span><span>BIAS</span><span>OCC</span>
      </div>
      <div className="eco-re-board">
        {realEstateRows.map(row => (
          <div key={row.area} className="eco-re-row" style={{ gridTemplateColumns: '120px 90px 72px 80px 48px' }}>
            <div className="dre-area">{row.area}</div>
            <div style={{ color: row.up ? 'rgba(255,160,30,.92)' : 'rgba(255,90,20,.9)', fontSize: 'var(--fs-med)' }}>{row.premium}</div>
            <div className={row.up ? 'UP' : 'DN'} style={{ fontSize: 'var(--fs-micro)' }}>{row.move}</div>
            <div className={row.up ? 'UP' : 'DN'} style={{ fontSize: 'var(--fs-micro)' }}>{row.bias}</div>
            <div style={{ color: 'rgba(255,140,0,.7)', fontSize: 'var(--fs-med)' }}>{row.occupancy}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
