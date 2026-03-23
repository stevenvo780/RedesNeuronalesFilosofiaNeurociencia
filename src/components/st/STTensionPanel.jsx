import { ST_CRITICA } from '../../data/st_results'

export default function STTensionPanel({ tensions = ST_CRITICA.tensions, showContradiction = true }) {
  return (
    <div className="st-card" style={{ padding: '0.75rem' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
        ST · 06_Critica_Ontologica · presupuestos ↔ objeciones
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        {tensions.map(t => (
          <div key={t.id} style={{ display: 'contents' }}>
            <div className="st-card st-tension-left" style={{ padding: '0.6rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--green)', marginBottom: '0.2rem' }}>◎ PRESUPUESTO</div>
              <code style={{ fontSize: '0.75rem', color: 'var(--text-h)', display: 'block' }}>{t.presupuesto}</code>
              <div style={{ fontSize: '0.72rem', color: 'var(--text)', marginTop: '0.2rem' }}>{t.presupuestoLabel}</div>
            </div>
            <div className="st-card st-tension-right" style={{ padding: '0.6rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--red)', marginBottom: '0.2rem' }}>✓ OBJECIÓN</div>
              <code style={{ fontSize: '0.75rem', color: 'var(--text-h)', display: 'block' }}>{t.objecion}</code>
              <div style={{ fontSize: '0.72rem', color: 'var(--text)', marginTop: '0.2rem' }}>{t.objecionLabel}</div>
            </div>
          </div>
        ))}
      </div>
      {showContradiction && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
          {ST_CRITICA.contradictions.map(c => (
            <div key={c.formula} style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--red)' }}>
              ⊘ {c.formula} → {c.status}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
