import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import STModalBadge from '../components/st/STModalBadge'

const TIMELINE = [
  { year: 1992, label: 'Hinton', event: 'Redes neuronales — representaciones distribuidas', color: '#7c6dfa' },
  { year: 1998, label: 'LeCun', event: 'CNN — LeNet para dígitos', color: '#06b6d4' },
  { year: 2012, label: 'AlexNet', event: 'Deep learning gana ImageNet (+10% accuracy)', color: '#22c55e' },
  { year: 2017, label: 'Transformers', event: 'Attention is all you need — mecanismo de atención', color: '#eab308' },
  { year: 2020, label: 'GPT-3', event: '175B parámetros — emergencia de capacidades', color: '#f97316' },
  { year: 2023, label: 'LLMs+', event: 'Modelos de mundo, razonamiento, agentes', color: '#ef4444' },
]

const OPEN_QUESTIONS = [
  { q: 'El problema difícil de la conciencia', desc: 'Ningún modelo tiene experiencia subjetiva — ¿por qué habría de tenerla?' },
  { q: 'Razonamiento causal', desc: 'Los modelos correlacionan — la causalidad requiere intervención, no solo observación.' },
  { q: 'Embodiment', desc: 'El cerebro está en un cuerpo que interactúa con el mundo. Los LLMs no.' },
  { q: '¿Silicio = carbono?', desc: 'La tesis del sustrato: ¿importa de qué está hecho, o solo la función?' },
]

export default function S12_De1992AHoy({ profesorMode }) {
  const timelineRef = useRef(null)
  const itemsRef = useRef([])

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    itemsRef.current.forEach((el, i) => {
      if (!el) return
      tl.fromTo(el,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4 },
        i * 0.2
      )
    })
    return () => tl.kill()
  }, [])

  return (
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">De 1992 a hoy</div>
        <div className="section-subtitle">Cierre filosófico</div>
      </div>

            <div className="quote" style={{ maxWidth: '900px' }}>
        "Hinton cierra con una esperanza cautelosa: computación y biología podrían converger.
        Treinta años después, ¿convergieron? ¿O se alejaron más?"
      </div>

      {/* Timeline */}
      <div ref={timelineRef} style={{ width: '100%', maxWidth: '1000px' }}>
        {TIMELINE.map((t, i) => (
          <div
            key={t.year}
            ref={el => itemsRef.current[i] = el}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              marginBottom: '0.8rem',
              opacity: 0,
            }}
          >
            <div style={{
              width: '60px',
              flexShrink: 0,
              fontSize: '1rem',
              color: t.color,
              fontFamily: 'monospace',
              fontWeight: 700,
              paddingTop: '6px',
            }}>
              {t.year}
            </div>
            <div style={{
              flex: 1,
              background: 'var(--bg-3)',
              borderLeft: `4px solid ${t.color}`,
              borderRadius: '0 8px 8px 0',
              padding: '0.8rem 1.2rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-h)' }}>{t.label}</span>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginLeft: '0.8rem' }}>{t.event}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interpretabilidad */}
      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
            INTERPRETABILIDAD MECANICISTA
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.6 }}>
            Hoy es posible visualizar qué "features" detectan neuronas específicas en modelos grandes.
            Las leyes de escala de Kaplan muestran que la pérdida cae como potencia de los parámetros.
            Pero la pregunta de Hinton sigue abierta: ¿estas representaciones son como las del cerebro?
          </p>
        </div>
      )}

      {/* Preguntas abiertas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', width: '100%', maxWidth: '1000px' }}>
        {OPEN_QUESTIONS.map(q => (
          <div key={q.q} style={{
            background: 'var(--bg-3)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderLeft: '4px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem',
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-h)', marginBottom: '0.4rem' }}>
              {q.q}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
              {q.desc}
            </div>
          </div>
        ))}
      </div>

      {/* ST Badges */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <STModalBadge symbol="◇" content="CONV_POSS" />
        <STModalBadge symbol="◇" content="¬BRAIN_COMP" />
      </div>

      {/* Mensaje final - Conclusion box */}
      <div style={{
        background: 'rgba(124,109,250,0.1)',
        border: '1px solid rgba(124,109,250,0.4)',
        borderRadius: '12px',
        padding: '1.5rem 2rem',
        maxWidth: '900px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(124,109,250,0.15)'
      }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-2)', fontStyle: 'italic', lineHeight: 1.6 }}>
          "Hinton no está afirmando una verdad eterna —<br />
          está apostando en un programa de investigación."
        </div>
        <div style={{ marginTop: '1rem', fontSize: '1rem', color: 'var(--text-dim)' }}>
          Los ST lo hacen visible: <code>◇(CONV_POSS)</code> satisfacible en Modal K.
          La convergencia es posible, no necesaria.
        </div>
      </div>
    </div>
  )
}
