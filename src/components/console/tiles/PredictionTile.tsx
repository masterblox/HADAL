import type { PredictionResult } from '@/lib/prediction/types'

export function PredictionTile({ prediction }: { prediction: PredictionResult | null }) {
  const threat = prediction?.theatreThreatLevel ?? 0
  const severe = prediction?.global?.probSevere ?? 0
  const critical = prediction?.global?.probCritical ?? 0

  return (
    <div className="console-prediction">
      <div className="console-prediction-hero">
        <span className="console-prediction-kicker">THEATRE THREAT</span>
        <span className="console-prediction-score">{threat || '—'}</span>
      </div>
      <div className="console-prediction-bar">
        <div className="console-prediction-fill" style={{ width: `${threat}%` }} />
      </div>
      <div className="console-prediction-metrics">
        <div className="console-prediction-metric">
          <span>P(SEVERE)</span>
          <b>{severe}%</b>
        </div>
        <div className="console-prediction-metric">
          <span>P(CRITICAL)</span>
          <b>{critical}%</b>
        </div>
        <div className="console-prediction-metric wide">
          <span>DOMINANT</span>
          <b>{prediction?.dominantScenario ?? 'AWAITING PIPELINE'}</b>
        </div>
      </div>
    </div>
  )
}
