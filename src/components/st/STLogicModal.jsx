import { useState, useCallback, useEffect } from 'react'
import { Microscope, X, GitBranch, Scale, Link2, AlertTriangle } from 'lucide-react'
import { ST_ARGUMENTO, ST_ONTOLOGIA, ST_PRESUPUESTOS, ST_CRITICA, HINTON_CONTEXT } from '../../data/st_results'

const ST_DATA = {
  argumento: ST_ARGUMENTO,
  ontologia: ST_ONTOLOGIA,
  presupuestos: ST_PRESUPUESTOS,
  critica: ST_CRITICA,
}

// Mini ST evaluator for propositional logic
function evalProp(formula, vals) {
  let f = formula
  for (const [k, v] of Object.entries(vals)) {
    f = f.replaceAll(k, v ? 'T' : 'F')
  }
  f = f.replaceAll('¬T', 'F').replaceAll('¬F', 'T')
  f = f.replaceAll('T ∧ T', 'T').replaceAll(/T ∧ F|F ∧ T|F ∧ F/g, 'F')
  f = f.replaceAll('T ∨ F', 'T').replaceAll('F ∨ T', 'T').replaceAll('T ∨ T', 'T').replaceAll('F ∨ F', 'F')
  f = f.replaceAll('F → T', 'T').replaceAll('F → F', 'T').replaceAll('T → T', 'T').replaceAll('T → F', 'F')
  return f
}

const ATOMS = ['BRAIN_COMP', 'INTERNAL_REPR', 'BACK_BIO', 'GOOD_METRIC', 'CONV_STRONG']

export default function STLogicModal({ isOpen, onClose, context }) {
  const [tab, setTab] = useState('explorer')
  const [vals, setVals] = useState(
    Object.fromEntries(ATOMS.map(a => [a, true]))
  )
  const [evalResult, setEvalResult] = useState('')
  const [customFormula, setCustomFormula] = useState('BRAIN_COMP → INTERNAL_REPR')

  const toggle = useCallback((atom) => {
    setVals(v => ({ ...v, [atom]: !v[atom] }))
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  useEffect(() => {
    setEvalResult(evalProp(customFormula, vals))
  }, [customFormula, vals])

  if (!isOpen) return null

  return (
    <div className="st-modal-overlay" onClick={onClose}>
      <div className="st-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Microscope size={18} strokeWidth={1.8} color="var(--accent)" /> ST · Motor de Lógica Formal
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              {context || 'Explorador interactivo de la ontología de Hinton 1992'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} strokeWidth={1.8} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            { id: 'explorer',  label: 'Explorador',  Icon: GitBranch },
            { id: 'evaluator', label: 'Evaluador',   Icon: Scale },
            { id: 'chains',    label: 'Cadenas',     Icon: Link2 },
            { id: 'tensions',  label: 'Tensiones',   Icon: AlertTriangle },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem',
                fontFamily: 'monospace', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                background: tab === t.id ? 'rgba(124,109,250,0.2)' : 'var(--bg-3)',
                border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
                color: tab === t.id ? 'var(--accent-2)' : 'var(--text-dim)',
              }}
            ><t.Icon size={13} strokeWidth={1.8} />{t.label}</button>
          ))}
        </div>

        {/* Explorer tab */}
        {tab === 'explorer' && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              Derivaciones validadas (02_Argumento_Global):
            </div>
            {ST_ARGUMENTO.chains.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <code style={{ color: c.valid ? 'var(--green)' : 'var(--red)', fontSize: '0.75rem', flex: 1 }}>{c.formula}</code>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{c.pattern}</span>
                <span style={{ fontSize: '0.7rem', color: c.valid ? 'var(--green)' : 'var(--red)' }}>{c.valid ? '✓ VÁLIDA' : '✗'}</span>
              </div>
            ))}
            <div style={{ fontSize: '0.7rem', color: 'var(--yellow)', fontFamily: 'monospace', marginTop: '0.5rem' }}>
              Contingentes (no tautologías):
            </div>
            {ST_ARGUMENTO.contingent.map((c, i) => (
              <div key={i} style={{ padding: '0.4rem 0.6rem', background: 'var(--bg)', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.3)' }}>
                <code style={{ color: 'var(--yellow)', fontSize: '0.75rem' }}>{c.formula}</code>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{c.valuations} — {c.note}</div>
              </div>
            ))}
          </div>
        )}

        {/* Evaluator tab — interactive truth table */}
        {tab === 'evaluator' && (
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.8rem' }}>
              Cambia el valor de los átomos y evalúa fórmulas proposicionales:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {ATOMS.map(a => (
                <button key={a} onClick={() => toggle(a)}
                  style={{
                    padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem',
                    fontFamily: 'monospace', cursor: 'pointer',
                    background: vals[a] ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${vals[a] ? 'var(--green)' : 'var(--red)'}`,
                    color: vals[a] ? 'var(--green)' : 'var(--red)',
                  }}
                >{a}: {vals[a] ? 'V' : 'F'}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.8rem' }}>
              <input
                value={customFormula}
                onChange={e => setCustomFormula(e.target.value)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem',
                  fontFamily: 'monospace', background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text-h)', outline: 'none',
                }}
                placeholder="BRAIN_COMP → INTERNAL_REPR"
              />
              <div style={{ padding: '0.5rem 0.8rem', borderRadius: '6px', background: 'var(--bg-3)', fontFamily: 'monospace', fontSize: '0.8rem', color: evalResult.includes('T') ? 'var(--green)' : 'var(--red)' }}>
                = {evalResult || '?'}
              </div>
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
              Operadores: → (implicación), ∧ (conjunción), ∨ (disyunción), ¬ (negación)
            </div>
          </div>
        )}

        {/* Chains tab */}
        {tab === 'chains' && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              Presupuestos expandidos (05_Presupuestos_Expandidos):
            </div>
            {ST_PRESUPUESTOS.paths.map((p, i) => (
              <div key={i} style={{ padding: '0.3rem 0.6rem', background: 'var(--bg)', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--cyan)' }}>
                {p}
              </div>
            ))}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Epistémica S5:</div>
            {ST_PRESUPUESTOS.epistemic.map((e, i) => (
              <div key={i} style={{ padding: '0.3rem 0.6rem', background: 'var(--bg)', borderRadius: '4px' }}>
                <code style={{ fontSize: '0.75rem', color: e.valid ? 'var(--green)' : 'var(--red)' }}>{e.formula}</code>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>{e.system} — {e.note}</span>
              </div>
            ))}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>Modal K:</div>
            {ST_PRESUPUESTOS.modal.map((m, i) => (
              <div key={i} style={{ padding: '0.3rem 0.6rem', background: 'var(--bg)', borderRadius: '4px' }}>
                <code style={{ fontSize: '0.75rem', color: 'var(--accent-2)' }}>{m.formula}</code>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>{m.status} en {m.system}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tensions tab */}
        {tab === 'tensions' && (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {ST_CRITICA.tensions.map(t => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div style={{ padding: '0.5rem', background: 'var(--bg)', borderRadius: '6px', borderLeft: '3px solid var(--green)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--green)' }}>PRESUPUESTO</div>
                  <code style={{ fontSize: '0.7rem', color: 'var(--text-h)' }}>{t.presupuesto}</code>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text)' }}>{t.presupuestoLabel}</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'var(--bg)', borderRadius: '6px', borderLeft: '3px solid var(--red)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--red)' }}>OBJECIÓN</div>
                  <code style={{ fontSize: '0.7rem', color: 'var(--text-h)' }}>{t.objecion}</code>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text)' }}>{t.objecionLabel}</div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Posibilidades modales (◇):
            </div>
            {ST_CRITICA.possibilities.map((p, i) => (
              <div key={i} style={{ padding: '0.3rem 0.6rem', background: 'var(--bg)', borderRadius: '4px' }}>
                <code style={{ fontSize: '0.7rem', color: 'var(--accent-2)' }}>{p.formula}</code>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>{p.status} en {p.system}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border)', fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          Fuente: archivos .st en ST_Hinton_Ontologia/ · validados con st v2.6.0 · Lógica proposicional + Epistémica S5 + Modal K
        </div>
      </div>
    </div>
  )
}
