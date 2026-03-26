import type { AirspaceData, PriceData } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'
import { DevTag } from '@/components/shared/DevTag'

type SituationMode = 'market' | 'tempo' | 'intelligence'

function delta(value?: number) {
  if (value == null) return '---'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function SituationTile({
  mode,
  prices,
  airspace,
  prediction,
}: {
  mode: SituationMode
  prices: PriceData | null
  airspace: AirspaceData | null
  prediction: PredictionResult | null
}) {
  if (mode === 'market') {
    return (
      <div className="console-situation single" style={{ position: 'relative' }}>
        <div className="console-situation-col">
          <span className="console-situation-head">MARKETS</span>
          <div className="console-situation-row"><span>BRENT</span><b>{prices?.brent?.price?.toFixed(2) ?? '---'}</b><span>{delta(prices?.brent?.change)}</span></div>
          <div className="console-situation-row"><span>GOLD</span><b>{prices?.gold?.price?.toFixed(2) ?? '---'}</b><span>{delta(prices?.gold?.change)}</span></div>
          <div className="console-situation-row"><span>GAS</span><b>{prices?.gas?.price?.toFixed(2) ?? '---'}</b><span>{delta(prices?.gas?.change)}</span></div>
        </div>
        <DevTag id="A.8" />
      </div>
    )
  }

  if (mode === 'tempo') {
    return (
      <div className="console-situation single" style={{ position: 'relative' }}>
        <div className="console-situation-col">
          <span className="console-situation-head">TEMPO</span>
          <div className="console-situation-row"><span>24H</span><b>{prediction?.timeWindows.h24.count ?? '---'}</b><span>EVENTS</span></div>
          <div className="console-situation-row"><span>72H</span><b>{prediction?.timeWindows.h72.count ?? '---'}</b><span>EVENTS</span></div>
          <div className="console-situation-row"><span>7D</span><b>{prediction?.timeWindows.d7.count ?? '---'}</b><span>EVENTS</span></div>
        </div>
        <DevTag id="A.8" />
      </div>
    )
  }

  if (mode === 'intelligence') {
    return (
      <div className="console-situation single" style={{ position: 'relative' }}>
        <div className="console-situation-col">
          <span className="console-situation-head">INTELLIGENCE</span>
          <div className="console-situation-row"><span>ACTOR</span><b>{prediction?.trendAnalysis?.mostActiveActor ?? '---'}</b><span>TOP</span></div>
          <div className="console-situation-row"><span>TARGET</span><b>{prediction?.trendAnalysis?.mostTargetedCountry ?? '---'}</b><span>FOCUS</span></div>
          <div className="console-situation-row"><span>ESC</span><b>{prediction?.trendAnalysis?.escalationRate != null ? `${Math.round(prediction.trendAnalysis.escalationRate * 100)}%` : '---'}</b><span>RATE</span></div>
        </div>
        <DevTag id="A.8" />
      </div>
    )
  }

  return (
    <div className="console-situation" style={{ position: 'relative' }}>
      <div className="console-situation-col">
        <span className="console-situation-head">MARKETS</span>
        <div className="console-situation-row"><span>BRENT</span><b>{prices?.brent?.price?.toFixed(2) ?? '---'}</b><span>{delta(prices?.brent?.change)}</span></div>
        <div className="console-situation-row"><span>GOLD</span><b>{prices?.gold?.price?.toFixed(2) ?? '---'}</b><span>{delta(prices?.gold?.change)}</span></div>
        <div className="console-situation-row"><span>GAS</span><b>{prices?.gas?.price?.toFixed(2) ?? '---'}</b><span>{delta(prices?.gas?.change)}</span></div>
      </div>
      <div className="console-situation-col">
        <span className="console-situation-head">TEMPO</span>
        <div className="console-situation-row"><span>24H</span><b>{prediction?.timeWindows.h24.count ?? '---'}</b><span>EVENTS</span></div>
        <div className="console-situation-row"><span>72H</span><b>{prediction?.timeWindows.h72.count ?? '---'}</b><span>EVENTS</span></div>
        <div className="console-situation-row"><span>AIRSPACE</span><b>{airspace?.total_notams ?? 0}</b><span>NOTAMS</span></div>
      </div>
      <DevTag id="A.8" />
    </div>
  )
}
