import STTooltip from "../components/st/STTooltip"
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
      w = canvas.width = canvas.offsetWidth || window.innerWidth
      h = canvas.height = canvas.offsetHeight || window.innerHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const N = 90
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.45, vy: (Math.random() - 0.5) * 0.45,
      r: 1.8 + Math.random() * 2.8,
      ph: Math.random() * Math.PI * 2,
    }))

    // Pre-build edge list with signal state
    const MAX_DIST = 210
    const edges = []
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        if (dx * dx + dy * dy < MAX_DIST * MAX_DIST) {
          edges.push({ a: i, b: j, sig: Math.random(), spd: 0.003 + Math.random() * 0.007 })
        }
      }
    }

    let startTime = null
    const render = (ts) => {
      if (!startTime) startTime = ts
      const t = (ts - startTime) * 0.001

      // color cycle violet↔cyan
      const cycle = (Math.sin(t * 0.07) + 1) / 2
      const cr = Math.round(124 - cycle * 45)
      const cg = Math.round(109 + cycle * 78)
      const cb = Math.round(250 - cycle * 32)

      ctx.fillStyle = 'rgba(1,1,14,0.18)'
      ctx.fillRect(0, 0, w, h)

      // drift nodes
      nodes.forEach(n => {
        n.x = ((n.x + n.vx) + w) % w
        n.y = ((n.y + n.vy) + h) % h
      })

      // edges + signals
      edges.forEach(e => {
        e.sig = (e.sig + e.spd) % 1
        const na = nodes[e.a], nb = nodes[e.b]
        const dx = nb.x - na.x, dy = nb.y - na.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > MAX_DIST) return
        const fade = 1 - dist / MAX_DIST
        const lw = 0.6 + fade * 0.9

        // line
        ctx.beginPath()
        ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y)
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.08 + fade * 0.28})`
        ctx.lineWidth = lw; ctx.stroke()

        // signal pulse
        const pA = 0.85 * Math.sin(e.sig * Math.PI)
        if (pA > 0.1) {
          const sx = na.x + dx * e.sig, sy = na.y + dy * e.sig
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8)
          grd.addColorStop(0, `rgba(${Math.min(255,cr+60)},${Math.min(255,cg+50)},${cb},${pA})`)
          grd.addColorStop(0.5, `rgba(${cr},${cg},${cb},${pA * 0.4})`)
          grd.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2)
          ctx.fillStyle = grd; ctx.fill()
        }
      })

      // nodes with halo + core
      nodes.forEach((n, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * (0.7 + (i % 13) * 0.08) + n.ph)
        const r = n.r * (0.7 + 0.5 * pulse)

        // halo
        const hrd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 8)
        hrd.addColorStop(0, `rgba(${cr},${cg},${cb},${0.18 * pulse})`)
        hrd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 8, 0, Math.PI * 2)
        ctx.fillStyle = hrd; ctx.fill()

        // core
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${Math.min(255,cr+65)},${Math.min(255,cg+50)},${cb},${0.6 + pulse * 0.4})`
        ctx.shadowColor = `rgb(${cr},${cg},${cb})`
        ctx.shadowBlur = 8 * pulse
        ctx.fill(); ctx.shadowBlur = 0
      })

      animationId = requestAnimationFrame(render)
    }
    animationId = requestAnimationFrame(render)

    return () => { cancelAnimationFrame(animationId); ro.disconnect() }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
  )
}

const WORDS = ['La', 'máquina...', 'que', 'aprende...', 'a', 'ser...', 'cerebro.']

export default function S01_Apertura({ profesorMode }) {
  const wordsRef = useRef([])
  const questionRef = useRef(null)
  const betRef = useRef(null)

  useEffect(() => {
    // Set initial states via GSAP so kill() doesn't revert to CSS inline
    wordsRef.current.forEach(el => { if (el) gsap.set(el, { opacity: 0, y: 10 }) })
    if (questionRef.current) gsap.set(questionRef.current, { opacity: 0, y: 16 })
    if (betRef.current) gsap.set(betRef.current, { opacity: 0 })

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
    wordsRef.current.forEach((el, i) => {
      if (!el) return
      tl.to(el,
        { opacity: 1, y: 0, duration: 0.4 },
        i === 0 ? 0 : `+=${i < 3 ? 0.35 : 0.6}`
      )
    })
    tl.to(questionRef.current,
      { opacity: 1, y: 0, duration: 0.6 },
      '+=0.5'
    )
    tl.to(betRef.current,
      { opacity: 1, duration: 0.5 },
      '+=0.3'
    )

    return () => {
      tl.progress(1)  // snap to end state before killing
      tl.kill()
    }
  }, [])

  return (
    <div className="section-slide" style={{ position: 'relative' }}>
      <NetworkBackground />
      <div style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        position: 'relative',
        zIndex: 1,
      }}>
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
                color: w.includes('...') || w === 'cerebro.' ? 'var(--accent-2)' : 'var(--text-h)',
              }}
            >
              {w}
            </span>
          ))}
        </div>
        <div
          ref={questionRef}
          style={{
            marginTop: '1.8rem',
            fontSize: 'clamp(1.2rem, 3vw, 1.65rem)',
            color: 'var(--text)',
            fontStyle: 'italic',
            letterSpacing: '0.03em',
            textShadow: '0 0 24px rgba(124,109,250,0.35)',
          }}
        >
          ¿Es eso una <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>descripción</span> o una <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>apuesta</span>?
        </div>
      </div>

      {/* Mapa argumental ST */}
      <div ref={betRef} style={{ width: '100%', position: 'relative' }}>
        <STArgGraph />
      </div>

      {/* Apuesta filosófica */}
      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.6rem', fontFamily: 'monospace' }}>
            MARCO FILOSÓFICO
          </div>
          <p style={{ color: 'var(--text)', lineHeight: 1.6, fontSize: '1.05rem' }}>
            Este texto instala un <STTooltip term="representacionalismo"><span style={{ color: 'var(--accent-2)' }}>marco computacional-representacional</span></STTooltip> con
            compromisos ontológicos fuertes. El cerebro como computadora no es metáfora decorativa — es una apuesta
            empírica que genera predicciones falsificables. Pero Daugman ya nos advirtió: cada época tiene su metáfora
            tecnológica dominante (hidráulica → relojería → telégrafo → <em>computadora</em>). La pregunta al final
            del recorrido: ¿esta vez es diferente, o simplemente es la más potente hasta ahora?
          </p>
        </div>
      )}

      {/* Contexto en el curso */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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

      {/* Identificación de la fuente */}
      <div style={{
        fontSize: '0.82rem',
        color: 'var(--text-dim)',
        fontFamily: 'monospace',
        textAlign: 'center',
        padding: '0.6rem 1.2rem',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        maxWidth: '700px',
        width: '100%',
        lineHeight: 1.7,
      }}>
        <span style={{ color: 'var(--accent-2)' }}>Fuente:</span>{' '}
        Hinton, G.E. (1992). "How neural networks learn from experience."{' '}
        <em style={{ color: 'var(--text)' }}>Scientific American</em>, 267(3), 144–151.
        <span style={{ display: 'block', color: 'var(--text-dim)', opacity: 0.65, marginTop: '0.2rem', fontSize: '0.76rem' }}>
          Artículo de divulgación — propuesta programática dirigida a público amplio, no demostración formal
        </span>
      </div>
      </div>
    </div>
  )
}
