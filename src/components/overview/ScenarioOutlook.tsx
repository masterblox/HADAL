import type { PredictionResult } from '@/lib/prediction/types'

interface ScenarioOutlookProps {
  prediction: PredictionResult | null
}

const SEV_COLOR: Record<string, string> = {
  CRITICAL: 'var(--warn)',
  HIGH: 'var(--warn)',
  MEDIUM: 'var(--g)',
  LOW: 'var(--g3)',
}

export function ScenarioOutlook({ prediction }: ScenarioOutlookProps) {
  const scenarios = prediction?.scenarios ?? []
  const dominant = prediction?.dominantScenario ?? '---'
  const probCritical = prediction?.global?.probCritical
  const probSevere = prediction?.global?.probSevere

  if (!prediction?.sufficient) {
    return (
      <div className="scen-section jp-panel">
        <div className="scen-head">
          <h2 className="section-title">Scenario Outlook</h2>
          <span className="scen-source">PREDICTION ENGINE · INSUFFICIENT DATA</span>
        </div>
        <div className="scen-empty">AWAITING SUFFICIENT PIPELINE DATA FOR SCENARIO GENERATION</div>
      </div>
    )
  }

  const top = scenarios.slice(0, 5)

  return (
    <div className="scen-section jp-panel">
      <div className="scen-head">
        <h2 className="section-title">Scenario Outlook</h2>
        <div className="scen-headline">
          <span className="scen-headline-label">DOMINANT</span>
          <span className="scen-headline-value">{dominant}</span>
          <span className="scen-headline-meta">
            P(SEVERE) {probSevere != null ? `${Math.round(probSevere)}%` : '---'}
            {' · '}
            P(CRITICAL) {probCritical != null ? `${Math.round(probCritical)}%` : '---'}
          </span>
        </div>
      </div>
      {top.length > 0 ? (
        <table className="scen-table">
          <thead>
            <tr>
              {['Scenario', 'Outcome', 'P(%)', 'Window', 'Severity', 'Basis'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((s, i) => (
              <tr key={i}>
                <td className="scen-category">{s.category}</td>
                <td className="scen-outcome">{s.outcome}</td>
                <td className="scen-prob">{Math.round(s.probability)}%</td>
                <td className="scen-window">{s.timeframe}</td>
                <td style={{ color: SEV_COLOR[s.severity] || 'var(--g5)' }}>{s.severity}</td>
                <td className="scen-conf">{s.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="scen-empty">NO SCENARIOS GENERATED</div>
      )}
    </div>
  )
}
