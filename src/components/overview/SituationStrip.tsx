import type { PriceData, AirspaceData } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'
import { DevTag } from '@/components/shared/DevTag'

interface SituationStripProps {
  prices: PriceData | null
  airspace: AirspaceData | null
  prediction: PredictionResult | null
}

function fmtPrice(val: number | undefined, prefix = '$'): string {
  if (val == null) return '---'
  return prefix + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtChange(change: number | undefined): { text: string; cls: string } {
  if (change == null) return { text: '---', cls: '' }
  const sign = change >= 0 ? '+' : ''
  return {
    text: `${sign}${change.toFixed(2)}%`,
    cls: change >= 0 ? 'sit-up' : 'sit-down',
  }
}

export function SituationStrip({ prices, airspace, prediction }: SituationStripProps) {
  const brent = prices?.brent
  const gold = prices?.gold
  const gas = prices?.gas

  const totalNotams = airspace?.total_notams ?? 0
  const sevCounts = airspace?.severity_counts ?? {}
  const critNotams = (sevCounts['critical'] ?? 0) + (sevCounts['high'] ?? 0)
  const airports = airspace?.airports_tracked ?? 0

  const trend = prediction?.trendAnalysis
  const dailyAvg = prediction?.trendSummary?.dailyAvg ?? '---'
  const escalation = trend?.escalationRate
  const topActor = trend?.mostActiveActor ?? '---'
  const topTarget = trend?.mostTargetedCountry ?? '---'

  const tw24 = prediction?.timeWindows?.h24
  const tw72 = prediction?.timeWindows?.h72

  const brentChg = fmtChange(brent?.change)
  const goldChg = fmtChange(gold?.change)
  const gasChg = fmtChange(gas?.change)

  return (
    <div className="sit-strip jp-panel" style={{ position: 'relative' }}>
      <div className="sit-strip-head">
        <span className="sit-strip-title">Situation Metrics</span>
        <span className="sit-strip-source">DERIVED FROM PIPELINE</span>
      </div>
      <div className="sit-grid">
        {/* Market block */}
        <div className="sit-block sit-block-market">
          <div className="sit-block-label">Market Impact</div>
          <div className="sit-row">
            <span className="sit-ticker">BRENT</span>
            <span className="sit-price">{fmtPrice(brent?.price)}</span>
            <span className={`sit-chg ${brentChg.cls}`}>{brentChg.text}</span>
          </div>
          <div className="sit-row">
            <span className="sit-ticker">GOLD</span>
            <span className="sit-price">{fmtPrice(gold?.price)}</span>
            <span className={`sit-chg ${goldChg.cls}`}>{goldChg.text}</span>
          </div>
          <div className="sit-row">
            <span className="sit-ticker">GAS</span>
            <span className="sit-price">{fmtPrice(gas?.price)}</span>
            <span className={`sit-chg ${gasChg.cls}`}>{gasChg.text}</span>
          </div>
        </div>

        {/* Airspace block */}
        <div className="sit-block">
          <div className="sit-block-label">Airspace</div>
          <div className="sit-metric">
            <span className="sit-metric-val">{totalNotams}</span>
            <span className="sit-metric-unit">NOTAMS</span>
          </div>
          <div className="sit-metric">
            <span className="sit-metric-val" style={critNotams > 0 ? { color: 'var(--warn)' } : undefined}>{critNotams}</span>
            <span className="sit-metric-unit">CRITICAL/HIGH</span>
          </div>
          <div className="sit-metric">
            <span className="sit-metric-val">{airports}</span>
            <span className="sit-metric-unit">AIRPORTS</span>
          </div>
        </div>

        {/* Tempo block */}
        <div className="sit-block">
          <div className="sit-block-label">Tempo</div>
          <div className="sit-metric">
            <span className="sit-metric-val">{dailyAvg}</span>
            <span className="sit-metric-unit">DAILY AVG</span>
          </div>
          <div className="sit-metric">
            <span className="sit-metric-val">{tw24?.count ?? '---'}</span>
            <span className="sit-metric-unit">24H EVENTS</span>
          </div>
          <div className="sit-metric">
            <span className="sit-metric-val">{tw72?.count ?? '---'}</span>
            <span className="sit-metric-unit">72H EVENTS</span>
          </div>
        </div>

        {/* Intelligence block */}
        <div className="sit-block">
          <div className="sit-block-label">Intelligence</div>
          <div className="sit-metric">
            <span className="sit-metric-val sit-metric-text">{topActor}</span>
            <span className="sit-metric-unit">TOP ACTOR</span>
          </div>
          <div className="sit-metric">
            <span className="sit-metric-val sit-metric-text">{topTarget}</span>
            <span className="sit-metric-unit">TOP TARGET</span>
          </div>
          <div className="sit-metric">
            <span className="sit-metric-val" style={escalation != null && escalation > 0 ? { color: 'var(--warn)' } : undefined}>
              {escalation != null ? `${escalation > 0 ? '+' : ''}${(escalation * 100).toFixed(0)}%` : '---'}
            </span>
            <span className="sit-metric-unit">ESCALATION</span>
          </div>
        </div>
      </div>
      <DevTag id="W" />
    </div>
  )
}
