import { useNoiseCanvas } from '@/canvas/useNoiseCanvas'
import { currencyData, dreData } from '@/data/gulf-economic'
import { rhChart, genSparkline } from '@/lib/sparkline'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import type { PriceData } from '@/hooks/useDataPipeline'

interface EconomicSectionProps {
  prices: PriceData | null
  sandbox: boolean
}

export function EconomicSection({ prices, sandbox }: EconomicSectionProps) {
  const noiseRef = useNoiseCanvas({ amberTint: true, interval: 70 })

  const gulfCharts = prices?.brent ? [
    {n:'BRENT CRUDE',v:'$'+prices.brent.price.toFixed(2),chg:prices.brent.formatted_change||'',up:(prices.brent.change??0)>=0,pts:genSparkline(prices.brent.price,12)},
    {n:'GOLD',v:'$'+(prices.gold?.price??0).toFixed(0),chg:prices.gold?.formatted_change||'',up:(prices.gold?.change??0)>=0,pts:genSparkline(prices.gold?.price??0,12)},
    {n:'NAT GAS',v:'$'+(prices.gas?.price??0).toFixed(3),chg:prices.gas?.formatted_change||'',up:(prices.gas?.change??0)>=0,pts:genSparkline(prices.gas?.price??0,12)},
    {n:'BITCOIN',v:'$'+(prices.bitcoin?.price??0).toLocaleString(undefined,{maximumFractionDigits:0}),chg:prices.bitcoin?.formatted_change||'',up:(prices.bitcoin?.change??0)>=0,pts:genSparkline(prices.bitcoin?.price??0,12)},
  ] : [
    {n:'BRENT CRUDE',v:'$107.40',chg:'+23.1%',up:true,pts:[60,62,65,64,68,70,72,71,75,78,80,85]},
    {n:'GCC GDP INDEX',v:'$1.84T',chg:'+4.1%',up:true,pts:[60,62,65,64,68,70,72,71,75,78,80,85]},
    {n:'ARAMCO',v:'$8.94',chg:'+14.3%',up:true,pts:[78,80,79,82,84,86,88,87,90,91,89,89]},
    {n:'UAE NON-OIL',v:'+4.3%',chg:'+0.5%',up:true,pts:[50,54,56,60,62,65,64,68,70,72,76,80]},
  ]

  return (
    <div className="eco-section jp-panel">
      <canvas ref={noiseRef} className="eco-noise" />
      <div className="eco-head">
        <span className="eco-ht">&#9670; ECONOMIC INTELLIGENCE</span>
        <span style={{fontFamily:'var(--HEAD)',fontWeight:700,fontSize:'var(--fs-small)',color:'rgba(255,140,0,.4)',letterSpacing:'.16em'}}>
          {prices?.brent ? 'LIVE · WAR-ADJUSTED' : 'LIVE · WAR-ADJUSTED'}
        </span>
      </div>
      <div className="eco-grid">
        <ResizablePanelGroup orientation="horizontal">
          <ResizablePanel id="eco-left" defaultSize="50%" minSize="30%">
            <div className="eco-half">
              <div className="eco-sub">WORLD RESERVE CURRENCIES</div>
              {currencyData.map(c => (
                <div key={c.pair} className="CUR-ROW">
                  <div className="CUR-PAIR">{c.pair}</div>
                  <div className="CUR-META">
                    <div className="CUR-NAME">{c.name}</div>
                    <div className="CUR-SPREAD">{c.spread}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div className="CUR-VAL">{c.val}</div>
                    <div className={`CUR-CHG ${c.up ? 'UP' : 'DN'}`}>{c.chg}</div>
                  </div>
                </div>
              ))}
            </div>
          </ResizablePanel>
          <ResizableHandle disabled={!sandbox} />
          <ResizablePanel id="eco-right" defaultSize="50%" minSize="30%">
            <div className="eco-half">
              <div className="eco-sub">GULF ECONOMIC INDEX</div>
              <div className="rh-chart-wrap">
                {gulfCharts.map(g => (
                  <div key={g.n} className="rh-card">
                    <div className="rh-name">{g.n}</div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                      <span className="rh-val" style={{color:g.up?'rgba(255,160,30,.9)':'rgba(255,100,30,.9)'}}>{g.v}</span>
                      <span className={`rh-chg ${g.up?'UP':'DN'}`}>{g.chg}</span>
                    </div>
                    <div dangerouslySetInnerHTML={{__html: rhChart(g.pts, g.up, 110, 32)}} />
                  </div>
                ))}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="dre-box">
        <div className="dre-sub">&#9670; DUBAI REAL ESTATE INDEX — WAR PREMIUM MONITOR</div>
        <div className="dre-grid">
          {dreData.map(d => (
            <div key={d.area} className="dre-cell">
              <div className="dre-area">{d.area}</div>
              <div className="dre-v" style={{color:d.up?'rgba(255,160,30,.9)':'rgba(255,100,30,.9)'}}>{d.v}</div>
              <div className={`dre-chg ${d.up?'UP':'DN'}`}>{d.chg} 7D</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'18px',paddingTop:'10px',borderTop:'1px solid rgba(255,140,0,.06)',textAlign:'right',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic',fontWeight:300,fontSize:'var(--fs-med)',letterSpacing:'.18em',color:'rgba(255,140,0,.16)'}}>
          At 10,924 metres, only the truth survives.
        </div>
      </div>
    </div>
  )
}
