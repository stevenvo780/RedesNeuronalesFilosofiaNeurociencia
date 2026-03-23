import { useState } from 'react'
import { Microscope } from 'lucide-react'
import { ST_CRITICA } from '../../data/st_results'
import STLogicModal from './STLogicModal'

export default function STTensionPanel({ tensions = ST_CRITICA.tensions, showContradiction = true, compact = false }) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="st-card" style={{ padding: compact ? '0.4rem 0.6rem' : '0.5rem 0.7rem', cursor: 'pointer' }} onClick={() => setModalOpen(true)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            ST · 06_Critica_Ontologica
          </div>
          <div style={{ fontSize: '0.5rem', color: 'var(--accent-2)', fontFamily: 'monospace' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Microscope size={12} strokeWidth={1.8} /> click para explorar
            </span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
          {tensions.map(t => (
            <div key={t.id} style={{ display: 'contents' }}>
              <div className="st-card st-tension-left" style={{ padding: '0.3rem 0.5rem' }}>
                <div style={{ fontSize: compact ? '0.5rem' : '0.55rem', color: 'var(--green)', marginBottom: '0.1rem' }}>◎ PRESUPUESTO</div>
                <code style={{ fontSize: compact ? '0.55rem' : '0.6rem', color: 'var(--text-h)', display: 'block' }}>{t.presupuesto}</code>
                <div style={{ fontSize: compact ? '0.5rem' : '0.55rem', color: 'var(--text)', marginTop: '0.1rem' }}>{t.presupuestoLabel}</div>
              </div>
              <div className="st-card st-tension-right" style={{ padding: '0.3rem 0.5rem' }}>
                <div style={{ fontSize: compact ? '0.5rem' : '0.55rem', color: 'var(--red)', marginBottom: '0.1rem' }}>✓ OBJECIÓN</div>
                <code style={{ fontSize: compact ? '0.55rem' : '0.6rem', color: 'var(--text-h)', display: 'block' }}>{t.objecion}</code>
                <div style={{ fontSize: compact ? '0.5rem' : '0.55rem', color: 'var(--text)', marginTop: '0.1rem' }}>{t.objecionLabel}</div>
              </div>
            </div>
          ))}
        </div>
        {showContradiction && (
          <div style={{ marginTop: '0.3rem', borderTop: '1px solid var(--border)', paddingTop: '0.3rem' }}>
            {ST_CRITICA.contradictions.map(c => (
              <div key={c.formula} style={{ fontSize: '0.55rem', fontFamily: 'monospace', color: 'var(--red)' }}>
                ⊘ {c.formula} → {c.status}
              </div>
            ))}
          </div>
        )}
      </div>
      <STLogicModal isOpen={modalOpen} onClose={() => setModalOpen(false)} context="06_Critica_Ontologica · Tensiones presupuesto ↔ objeción" />
    </>
  )
}
