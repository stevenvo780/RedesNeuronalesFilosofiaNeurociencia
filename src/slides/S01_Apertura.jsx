import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import STArgGraph from '../components/st/STArgGraph'

const WORDS = ['El', 'cerebro...', 'es', 'una', 'computadora...', 'notable.']

export default function S01_Apertura({ profesorMode }) {
  const wordsRef = useRef([])
  const questionRef = useRef(null)
  const betRef = useRef(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    wordsRef.current.forEach((el, i) => {
      if (!el) return
      tl.fromTo(el,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4 },
        i === 0 ? 0 : `+=${i < 3 ? 0.35 : 0.6}`
      )
    })
    tl.fromTo(questionRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.6 },
      '+=0.5'
    )
    tl.fromTo(betRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      '+=0.3'
    )
    return () => tl.kill()
  }, [])

  return (
    <div className="section-slide" style={{ gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Frase de apertura */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
          fontWeight: 700,
          color: 'var(--text-h)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.4em',
        }}>
          {WORDS.map((w, i) => (
            <span
              key={i}
              ref={el => wordsRef.current[i] = el}
              style={{
                opacity: 0,
                color: w.includes('...') || w === 'notable.' ? 'var(--accent-2)' : 'var(--text-h)',
              }}
            >
              {w}
            </span>
          ))}
        </div>
        <div
          ref={questionRef}
          style={{
            marginTop: '1.5rem',
            fontSize: 'clamp(0.9rem, 2vw, 1.15rem)',
            color: 'var(--text-dim)',
            fontStyle: 'italic',
            opacity: 0,
          }}
        >
          ¿Es eso una descripción o una apuesta?
        </div>
      </div>

      {/* Mapa argumental ST */}
      <div ref={betRef} style={{ width: '100%', opacity: 0 }}>
        <STArgGraph />
      </div>

      {/* Apuesta filosófica */}
      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '680px', width: '100%' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
            MARCO FILOSÓFICO
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>
            Este texto instala un <span style={{ color: 'var(--accent-2)' }}>marco computacional-representacional</span> con
            compromisos ontológicos fuertes. El cerebro como computadora no es metáfora decorativa — es una apuesta
            empírica que genera predicciones falsificables. Al final la cuestionaremos con el propio formalismo del texto.
          </p>
        </div>
      )}

      {/* Contexto en el curso */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { label: 'Daugman 1992', desc: 'metáforas del cerebro', color: 'var(--text-dim)' },
          { label: 'Hinton 1992', desc: 'redes neuronales', color: 'var(--accent)' },
          { label: 'Bechtel 2001', desc: 'representaciones', color: 'var(--text-dim)' },
        ].map(n => (
          <div key={n.label} style={{
            background: n.color === 'var(--accent)' ? 'rgba(124,109,250,0.15)' : 'var(--bg-3)',
            border: `1px solid ${n.color === 'var(--accent)' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: n.color === 'var(--accent)' ? 'var(--accent-2)' : 'var(--text-h)' }}>
              {n.label}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{n.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
