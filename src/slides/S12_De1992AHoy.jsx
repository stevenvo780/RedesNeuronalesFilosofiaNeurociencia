import STTooltip from "../components/st/STTooltip"
import STFloatingButton from "../components/st/STFloatingButton"
import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { motion, AnimatePresence } from 'framer-motion'
import STModalBadge from '../components/st/STModalBadge'

const TIMELINE = [
  { year: 1992, label: 'Hinton', event: 'Conexionismo distribuido', color: '#7c6dfa' },
  { year: 1998, label: 'LeCun', event: 'CNN — LeNet', color: '#06b6d4' },
  { year: 2012, label: 'AlexNet', event: 'ImageNet (+10%)', color: '#22c55e' },
  { year: 2017, label: 'Transformers', event: 'Atención', color: '#eab308' },
  { year: 2020, label: 'GPT-3', event: '175B params', color: '#f97316' },
  { year: 2024, label: 'LLMs', event: 'Modelos generativos', color: '#ef4444' },
]

const REALIZABILIDAD = [
  { titulo: 'Putnam (1967)', color: '#06b6d4', t: 'La función, no el material, define el estado mental.' },
  { titulo: 'Fodor', color: '#eab308', t: 'Psicología autónoma respecto a neurociencia.' },
  { titulo: 'Tensión', color: '#f97316', t: 'Si el sustrato importa, la equivalencia se rompe.' },
]

export default function S12_De1992AHoy({ profesorMode }) {
  const itemsRef = useRef([])
  const [detailIdx, setDetailIdx] = useState(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    itemsRef.current.forEach((el, i) => {
      if (!el) return
      tl.fromTo(el, { opacity: 0, x: -15 }, { opacity: 1, x: 0, duration: 0.3 }, i * 0.12)
    })
    return () => tl.kill()
  }, [])

  return (
    <div className="section-slide" style={{ gap: '0.6rem', maxWidth: '1200px', margin: '0 auto', padding: '0.8rem 2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 2.2rem)' }}>De 1992 a Hoy</div>
        <div className="section-subtitle" style={{ fontSize: '0.8rem' }}>Ontología en Evolución</div>
      </div>

      {/* Compact timeline — horizontal */}
      <div style={{ display: 'flex', gap: '0.4rem', width: '100%', maxWidth: '1100px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {TIMELINE.map((t, i) => (
          <motion.div
            key={t.year}
            ref={el => itemsRef.current[i] = el}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setDetailIdx(detailIdx === i ? null : i)}
            style={{
              flex: '1 1 140px',
              background: 'var(--bg-3)',
              borderTop: `3px solid ${t.color}`,
              borderRadius: '6px',
              padding: '0.5rem 0.6rem',
              cursor: 'pointer',
              border: detailIdx === i ? `1px solid ${t.color}` : '1px solid var(--border)',
              transition: 'border 0.2s',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: t.color, fontFamily: 'monospace', fontWeight: 700 }}>{t.year}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-h)' }}>{t.label}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{t.event}</div>
          </motion.div>
        ))}
      </div>

      {/* Realizabilidad múltiple — compact row */}
      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '1100px' }}>
        {REALIZABILIDAD.map(r => (
          <div key={r.titulo} style={{
            flex: 1, background: 'var(--bg-3)', borderLeft: `3px solid ${r.color}`,
            borderRadius: '4px', padding: '0.4rem 0.6rem',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: r.color }}>{r.titulo}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text)', lineHeight: 1.4 }}>{r.t}</div>
          </div>
        ))}
      </div>

      {/* Conclusion box */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        style={{
          background: 'rgba(124,109,250,0.08)',
          border: '1px solid rgba(124,109,250,0.35)',
          borderRadius: '10px', padding: '0.8rem 1.5rem',
          maxWidth: '800px', width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.9rem', color: 'var(--accent-2)', fontStyle: 'italic', lineHeight: 1.5 }}>
          "Hinton no afirma una verdad eterna — apuesta en un programa de investigación."
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
          <code>◇(CONV_POSS)</code> satisfacible en Modal K. La convergencia es posible, no necesaria.
        </div>
      </motion.div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <STModalBadge symbol="◇" content="CONV_POSS" />
        <STModalBadge symbol="◇" content="¬BRAIN_COMP" />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%', fontSize: '0.8rem' }}>
          <strong style={{ color: 'var(--accent-2)' }}>Interpretabilidad mecanicista:</strong>{' '}
          Leyes de escala de Kaplan. Features detectadas por neuronas en modelos grandes.
          La pregunta sigue: ¿estas representaciones son como las del cerebro?
        </div>
      )}

      <STFloatingButton />
    </div>
  )
}
