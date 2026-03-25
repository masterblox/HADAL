import type { PredictionResult } from '@/lib/prediction/types'

interface Props {
  prediction: PredictionResult | null
}

export function VenusTrapTile({ prediction }: Props) {
  const scenarios = prediction?.scenarios?.slice(0, 4) ?? []

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', padding: 8, border: '1px solid var(--g20)' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(145deg, transparent 0 42%, rgba(218,255,74,.16) 42% 43%, transparent 43%), linear-gradient(145deg, transparent 0 58%, rgba(218,255,74,.1) 58% 59%, transparent 59%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ fontFamily: 'var(--MONO)', fontSize: '10px', color: 'var(--g2)', marginBottom: 8, textTransform: 'uppercase' }}>
        Venus trap / signal flow
      </div>
      {scenarios.length === 0 ? (
        <div style={{ fontFamily: 'var(--MONO)', fontSize: '10px', color: 'var(--warn)' }}>No scenario model data</div>
      ) : (
        <div style={{ display: 'grid', gap: 7 }}>
          {scenarios.map((s, idx) => (
            <div key={`${s.category}-${s.outcome}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--MONO)', fontSize: '10px', color: 'var(--g2)' }}>{s.outcome}</span>
              <span style={{ fontFamily: 'var(--C2)', fontSize: '16px', color: 'var(--g)' }}>{s.probability}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
