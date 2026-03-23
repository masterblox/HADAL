import type { Incident } from '@/hooks/useDataPipeline'
import type { PredictionResult } from '@/lib/prediction/types'

function average(values: number[]) {
  if (!values.length) return 0
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function ConfidenceTile({
  incidents,
  prediction,
}: {
  incidents: Incident[]
  prediction: PredictionResult | null
}) {
  const sample = incidents.slice(0, 10)
  const verification = average(sample.map(item => item.verificationScore ?? item.credibility ?? 0))
  const sourceDepth = average(sample.map(item => Math.min((item.numSources ?? 1) * 20, 100)))
  const modelFit = prediction?.sufficient ? Math.min(Math.round((prediction.global?.mean ?? 0) * 0.9), 100) : 24
  const band = verification >= 78 ? 'HIGH TRUST' : verification >= 55 ? 'GUARDED' : 'FRAGMENTED'

  const factors = [
    { label: 'VERIFICATION', value: verification },
    { label: 'SOURCE DEPTH', value: sourceDepth },
    { label: 'MODEL FIT', value: modelFit },
  ]

  return (
    <div className="console-confidence">
      <div className="console-confidence-summary">
        <span>{band}</span>
        <b>{Math.round((verification + sourceDepth + modelFit) / 3)}</b>
      </div>
      <div className="console-confidence-bars">
        {factors.map(factor => (
          <div key={factor.label} className="console-confidence-row">
            <span>{factor.label}</span>
            <div className="console-confidence-track">
              <div className="console-confidence-fill" style={{ width: `${factor.value}%` }} />
            </div>
            <b>{factor.value}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
