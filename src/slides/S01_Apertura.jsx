import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import STArgGraph from '../components/st/STArgGraph'

function NetworkBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h, animationId

    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const nodes = Array.from({ length: 40 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
    }))

    const render = () => {
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(124, 109, 250, 0.15)'
      ctx.strokeStyle = 'rgba(124, 109, 250, 0.05)'

      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1

        ctx.beginPath()
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }
      animationId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.7 }} />
  )
}

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
    <div className="section-slide" style={{ gap: '2rem', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      <NetworkBackground />
      {/* Frase de apertura */}
      <div style={{ textAlign: 'center', zIndex: 1 }}>
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
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%', zIndex: 1 }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.6rem', fontFamily: 'monospace' }}>
            MARCO FILOSÓFICO
          </div>
          <p style={{ color: 'var(--text)', lineHeight: 1.6 }}>
            Este texto instala un <span style={{ color: 'var(--accent-2)' }}>marco computacional-representacional</span> con
            compromisos ontológicos fuertes. El cerebro como computadora no es metáfora decorativa — es una apuesta
            empírica que genera predicciones falsificables. Al final la cuestionaremos con el propio formalismo del texto.
          </p>
        </div>
      )}

      {/* Contexto en el curso */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', zIndex: 1 }}>
        {[
          { label: 'Daugman 1992', desc: 'metáforas del cerebro', color: 'var(--text-dim)' },
          { label: 'Hinton 1992', desc: 'redes neuronales', color: 'var(--accent)' },
          { label: 'Bechtel 2001', desc: 'representaciones', color: 'var(--text-dim)' },
        ].map(n => (
          <div key={n.label} style={{
            background: n.color === 'var(--accent)' ? 'rgba(124,109,250,0.15)' : 'var(--bg-3)',
            border: `1px solid ${n.color === 'var(--accent)' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '12px',
            padding: '0.8rem 1.5rem',
            textAlign: 'center',
            boxShadow: n.color === 'var(--accent)' ? '0 0 20px rgba(124,109,250,0.2)' : 'none'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: n.color === 'var(--accent)' ? 'var(--accent-2)' : 'var(--text-h)' }}>
              {n.label}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>{n.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
