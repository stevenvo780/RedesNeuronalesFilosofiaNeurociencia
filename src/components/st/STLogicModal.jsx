import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Microscope, X, GitBranch, Scale, Link2, AlertTriangle, HelpCircle, ChevronDown, BookOpen, LayoutList } from 'lucide-react'
import { ST_ARGUMENTO, ST_PRESUPUESTOS, ST_CRITICA, VAR_DEFINITIONS, SLIDE_SUPUESTOS, ST_RESUMEN_NATURAL } from '../../data/st_results'

// ── Tooltip chip for variable names ───────────────────────────────────────────
function VarChip({ varName, value, onClick, size = 'md' }) {
  const [tipPos, setTipPos] = useState(null)
  const def = VAR_DEFINITIONS[varName]
  const btnRef = useRef(null)

  const show = (e) => {
    if (!def) return
    setTipPos({ x: e.clientX, y: e.clientY })
  }

  const fontSz = size === 'sm' ? '0.65rem' : '0.7rem'
  const isTrue = value === true
  const isFalse = value === false
  const hasValue = value !== undefined

  return (
    <>
      <button
        ref={btnRef}
        onClick={onClick}
        onMouseEnter={show}
        onMouseLeave={() => setTipPos(null)}
        onMouseMove={show}
        style={{
          padding: size === 'sm' ? '0.18rem 0.45rem' : '0.3rem 0.6rem',
          borderRadius: '4px',
          fontSize: fontSz,
          fontFamily: 'monospace',
          cursor: onClick || def ? 'pointer' : 'default',
          background: isTrue ? 'rgba(34,197,94,0.15)' : isFalse ? 'rgba(239,68,68,0.15)' : 'rgba(124,109,250,0.1)',
          border: `1px solid ${isTrue ? 'var(--green)' : isFalse ? 'var(--red)' : 'rgba(124,109,250,0.3)'}`,
          color: isTrue ? 'var(--green)' : isFalse ? 'var(--red)' : 'var(--accent-2)',
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          transition: 'opacity 0.15s',
          lineHeight: 1,
        }}
      >
        {def && <span style={{ fontSize: '0.55rem', opacity: 0.55, lineHeight: 1 }}>?</span>}
        {varName}{hasValue ? `: ${isTrue ? 'V' : 'F'}` : ''}
      </button>

      {tipPos && def && createPortal(
        <div style={{
          position: 'fixed',
          left: Math.min(tipPos.x + 14, window.innerWidth - 260),
          top: tipPos.y - 8,
          width: 240,
          background: 'rgba(8,8,20,0.97)',
          border: '1px solid rgba(124,109,250,0.45)',
          borderRadius: '8px',
          padding: '0.55rem 0.75rem',
          fontSize: '0.68rem',
          color: 'var(--text)',
          lineHeight: 1.55,
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          <div style={{ color: 'var(--accent-2)', fontFamily: 'monospace', marginBottom: '0.25rem', fontSize: '0.72rem', fontWeight: 700 }}>
            {varName}
          </div>
          {def}
        </div>,
        document.body
      )}
    </>
  )
}

/* ── Per-tab help content ── */
const TAB_HELP = {
  explorer: {
    title: '¿Qué muestra el Explorador?',
    body: 'Cadenas de derivación validadas del argumento global de Hinton (02_Argumento_Global). Cada fórmula fue verificada con st v2.6.0. Las "contingentes" son empíricas — su verdad depende del mundo, no de la lógica pura.',
  },
  evaluator: {
    title: '¿Cómo usar el Evaluador?',
    body: 'Tabla de verdad interactiva. Cada botón es un presupuesto de Hinton. Cámbialos entre V/F y evalúa fórmulas con →, ∧, ∨, ¬. Útil para explorar qué pasa si rechazamos un supuesto: ¿se sostiene el argumento?',
  },
  chains: {
    title: '¿Qué son las Cadenas?',
    body: 'Presupuestos expandidos con validación en lógica epistémica S5 (lo que el agente sabe o cree necesariamente) y modal K (necesidad □ / posibilidad ◇). Revela los supuestos ocultos que el texto da por sentado.',
  },
  tensions: {
    title: '¿Qué son las Tensiones?',
    body: 'Cada par mapea un presupuesto de Hinton contra una objeción formal. La tensión surge porque ambos son lógicamente posibles pero incompatibles. El texto no las resuelve — son puntos donde el argumento necesita más defensa.',
  },
}

/* ── Collapsible help banner per tab ── */
function HelpBanner({ tab }) {
  const [open, setOpen] = useState(false)
  const help = TAB_HELP[tab]
  if (!help) return null

  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--accent-2)', fontSize: '0.7rem', fontFamily: 'monospace',
          padding: '0.2rem 0', opacity: 0.85,
        }}
      >
        <HelpCircle size={13} strokeWidth={1.8} />
        <span>{help.title}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={12} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: '0.35rem', padding: '0.6rem 0.8rem',
              background: 'rgba(124,109,250,0.08)', border: '1px solid rgba(124,109,250,0.2)',
              borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text)', lineHeight: 1.55,
            }}>
              {help.body}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── General ST explainer (top of modal) ── */
function STExplainer() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%',
          background: open ? 'rgba(124,109,250,0.06)' : 'transparent',
          border: '1px solid rgba(124,109,250,0.15)', borderRadius: '6px',
          padding: '0.45rem 0.7rem', cursor: 'pointer', color: 'var(--accent-2)',
          fontSize: '0.72rem', fontFamily: 'monospace', transition: 'background 0.2s',
        }}
      >
        <HelpCircle size={14} strokeWidth={1.8} />
        <span style={{ flex: 1, textAlign: 'left' }}>¿Qué es ST y cómo interpretar esto?</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={13} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              marginTop: '0.4rem', padding: '0.7rem 0.9rem',
              background: 'rgba(124,109,250,0.06)', border: '1px solid rgba(124,109,250,0.18)',
              borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--accent-2)', display: 'block', marginBottom: '0.3rem' }}>
                ST — Semantic Theory / Motor de Lógica Formal
              </strong>
              ST toma el texto de Hinton (1992) y valida su estructura argumentativa usando tres sistemas lógicos:
              <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem', listStyle: 'disc' }}>
                <li><strong style={{ color: 'var(--green)' }}>Proposicional</strong> — ¿Las conclusiones se siguen de las premisas?</li>
                <li><strong style={{ color: 'var(--cyan)' }}>Epistémica S5</strong> — ¿Qué sabe o cree necesariamente el agente?</li>
                <li><strong style={{ color: 'var(--accent-2)' }}>Modal K</strong> — ¿Qué es necesario (□) vs. posible (◇)?</li>
              </ul>
              <div style={{ marginTop: '0.45rem', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                Usa las pestañas para explorar derivaciones, evaluar fórmulas, ver cadenas de presupuestos y tensiones filosóficas.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
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
  const [tab, setTab] = useState('resumen')
  const [vals, setVals] = useState(
    Object.fromEntries(ATOMS.map(a => [a, true]))
  )
  const [evalResult, setEvalResult] = useState('')
  const [customFormula, setCustomFormula] = useState('BRAIN_COMP → INTERNAL_REPR')
  const [selectedSlide, setSelectedSlide] = useState('S01')

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
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

        {/* General ST explainer */}
        <STExplainer />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { id: 'resumen',   label: 'Resumen',     Icon: BookOpen },
            { id: 'slides',    label: 'Por Slide',   Icon: LayoutList },
            { id: 'explorer',  label: 'Explorador',  Icon: GitBranch },
            { id: 'evaluator', label: 'Evaluador',   Icon: Scale },
            { id: 'chains',    label: 'Cadenas',     Icon: Link2 },
            { id: 'tensions',  label: 'Tensiones',   Icon: AlertTriangle },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '0.35rem 0.7rem', borderRadius: '6px', fontSize: '0.72rem',
                fontFamily: 'monospace', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                background: tab === t.id ? 'rgba(124,109,250,0.2)' : 'var(--bg-3)',
                border: `1px solid ${tab === t.id ? 'var(--accent)' : 'var(--border)'}`,
                color: tab === t.id ? 'var(--accent-2)' : 'var(--text-dim)',
              }}
            ><t.Icon size={12} strokeWidth={1.8} />{t.label}</button>
          ))}
        </div>

        {/* Per-tab help */}
        <HelpBanner tab={tab} />

        {/* Resumen tab — natural language explanation */}
        {tab === 'resumen' && (
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div style={{
              background: 'rgba(124,109,250,0.07)',
              border: '1px solid rgba(124,109,250,0.25)',
              borderLeft: '4px solid #7c6dfa',
              borderRadius: '0 8px 8px 0',
              padding: '0.9rem 1.1rem',
            }}>
              <div style={{ fontSize: '0.65rem', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
                ¿QUÉ VALIDÓ ST? — RESUMEN EN LENGUAJE NATURAL
              </div>
              {ST_RESUMEN_NATURAL.trim().split('\n\n').map((para, i) => (
                <p key={i} style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.65, margin: i === 0 ? 0 : '0.7rem 0 0' }}>
                  {para}
                </p>
              ))}
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
              Variables clave — pasa el cursor sobre cualquier chip para ver su definición:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.keys(VAR_DEFINITIONS).map(v => (
                <VarChip key={v} varName={v} size="sm" />
              ))}
            </div>
          </div>
        )}

        {/* Slides tab — per-slide supuestos */}
        {tab === 'slides' && (
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>Diapositiva:</span>
              <select
                value={selectedSlide}
                onChange={e => setSelectedSlide(e.target.value)}
                style={{
                  padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                  fontFamily: 'monospace', background: 'var(--bg-3)',
                  border: '1px solid var(--border)', color: 'var(--text-h)', cursor: 'pointer',
                }}
              >
                {Object.entries(SLIDE_SUPUESTOS).map(([id, s]) => (
                  <option key={id} value={id}>{id} — {s.slide}</option>
                ))}
              </select>
            </div>

            {SLIDE_SUPUESTOS[selectedSlide] && (() => {
              const s = SLIDE_SUPUESTOS[selectedSlide]
              const tension = ST_CRITICA.tensions.find(t => t.id === s.tension)
              return (
                <div style={{ display: 'grid', gap: '0.7rem' }}>
                  <div style={{
                    background: 'rgba(124,109,250,0.06)',
                    border: '1px solid rgba(124,109,250,0.2)',
                    borderRadius: '8px',
                    padding: '0.8rem 1rem',
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      PRESUPUESTOS ACTIVOS EN ESTA DIAPOSITIVA
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.7rem' }}>
                      {s.presupuestos.map(p => <VarChip key={p} varName={p} />)}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                      {s.nota}
                    </p>
                  </div>

                  {tension && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg)', borderRadius: '6px', borderLeft: '3px solid var(--green)' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--green)', marginBottom: '0.3rem' }}>PRESUPUESTO CENTRAL</div>
                        <code style={{ fontSize: '0.68rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.2rem' }}>{tension.presupuesto}</code>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text)', lineHeight: 1.45 }}>{tension.presupuestoLabel}</div>
                      </div>
                      <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg)', borderRadius: '6px', borderLeft: '3px solid var(--red)' }}>
                        <div style={{ fontSize: '0.6rem', color: 'var(--red)', marginBottom: '0.3rem' }}>OBJECIÓN ACTIVA</div>
                        <code style={{ fontSize: '0.68rem', color: 'var(--text-h)', display: 'block', marginBottom: '0.2rem' }}>{tension.objecion}</code>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text)', lineHeight: 1.45 }}>{tension.objecionLabel}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

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
                <VarChip key={a} varName={a} value={vals[a]} onClick={() => toggle(a)} />
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
