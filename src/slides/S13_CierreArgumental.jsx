import STFloatingButton from "../components/st/STFloatingButton"
import STModalBadge from '../components/st/STModalBadge'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

void motion

function NeuralBg() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let id
    const N = 70
    let W = 0, H = 0
    const setSize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    const nodes = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random()-0.5)*0.00045, vy: (Math.random()-0.5)*0.00045,
      r: 1.4 + Math.random()*2.2, ph: Math.random()*Math.PI*2,
    }))

    let startT = null
    function draw(ts) {
      if (!W) { id = requestAnimationFrame(draw); return }
      if (!startT) startT = ts
      const t = (ts - startT) * 0.001
      const cyc = (Math.sin(t*0.06)+1)/2
      const cr = Math.round(124 - cyc*44), cg = Math.round(109 + cyc*76), cb = Math.round(250 - cyc*30)

      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'rgba(1,1,14,0.16)'; ctx.fillRect(0, 0, W, H)

      nodes.forEach(n => { n.x = ((n.x+n.vx)+1)%1; n.y = ((n.y+n.vy)+1)%1 })

      // connections
      for (let i = 0; i < N; i++) for (let j = i+1; j < N; j++) {
        const dx = (nodes[i].x - nodes[j].x)*W, dy = (nodes[i].y - nodes[j].y)*H
        const d = Math.sqrt(dx*dx+dy*dy)
        if (d < 190) {
          const f = 1 - d/190
          ctx.beginPath()
          ctx.moveTo(nodes[i].x*W, nodes[i].y*H); ctx.lineTo(nodes[j].x*W, nodes[j].y*H)
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.06+f*0.22})`; ctx.lineWidth = 0.5+f*0.7; ctx.stroke()
        }
      }
      // nodes
      nodes.forEach((n, i) => {
        const pulse = 0.5 + 0.5*Math.sin(t*(0.65+(i%11)*0.09)+n.ph)
        const x = n.x*W, y = n.y*H, r = n.r*(0.7+0.5*pulse)
        const g = ctx.createRadialGradient(x,y,0,x,y,r*7)
        g.addColorStop(0,`rgba(${cr},${cg},${cb},${0.14*pulse})`); g.addColorStop(1,'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(x,y,r*7,0,Math.PI*2); ctx.fillStyle=g; ctx.fill()
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2)
        ctx.fillStyle=`rgba(${Math.min(255,cr+60)},${Math.min(255,cg+45)},${cb},${0.55+pulse*0.45})`
        ctx.shadowColor=`rgb(${cr},${cg},${cb})`; ctx.shadowBlur=7*pulse; ctx.fill(); ctx.shadowBlur=0
      })
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />
}

const ARCO = [
  {
    autor: 'Daugman 1992',
    color: '#06b6d4',
    symbol: '□',
    tesis: 'Toda teoría del cerebro viene acompañada de una metáfora tecnológica de época.',
    implicacion: 'La computación no es el lenguaje final — es el lenguaje vigente. Necesario reconocerlo.',
  },
  {
    autor: 'Hinton 1992',
    color: '#7c6dfa',
    symbol: '◇',
    tesis: 'El aprendizaje distribuido puede modelar cognición sin reglas simbólicas explícitas.',
    implicacion: 'Funciona como herramienta; si explica el cerebro, es una apuesta empírica, no un hecho.',
  },
  {
    autor: 'Bechtel 2001',
    color: '#a78bfa',
    symbol: '?',
    tesis: '¿Qué es exactamente una representación mental y qué condiciones la constituyen?',
    implicacion: 'La convergencia cerebro–red exige responder esto antes de poder afirmarla.',
  },
]

const TESIS = `La red neuronal artificial no es una descripción del cerebro,
sino una apuesta en un programa de investigación. Su valor explicativo —
no solo instrumental — depende de si ese programa genera predicciones
nuevas y corroborables sobre cómo funciona la cognición real.`

export default function S13_CierreArgumental({ profesorMode }) {
  return (
    <div className="section-slide" style={{ gap: '2rem', position: 'relative', overflow: 'hidden' }}>
      <NeuralBg />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="section-title">Tesis y Arco Argumentativo</div>
        <div className="section-subtitle">¿Qué hemos argumentado en esta presentación?</div>
      </div>

      {/* Tesis central */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'rgba(124,109,250,0.10)',
          border: '1px solid rgba(124,109,250,0.45)',
          borderRadius: '16px',
          padding: '1.5rem 2.5rem',
          maxWidth: '920px',
          width: '100%',
          textAlign: 'center',
          position: 'relative', zIndex: 1,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.8rem', letterSpacing: '0.12em' }}>
          TESIS CENTRAL
        </div>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-h)', lineHeight: 1.75, margin: 0, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
          {TESIS}
        </p>
      </motion.div>

      {/* Arco de tres autores */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '1100px', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        {ARCO.map((a, i) => (
          <motion.div
            key={a.autor}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.15 }}
            style={{
              flex: '1 1 280px',
              background: 'rgba(10,10,22,0.82)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${a.color}55`,
              borderTop: `4px solid ${a.color}`,
              borderRadius: '10px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span style={{ fontSize: '1.3rem', color: a.color, fontFamily: 'monospace', fontWeight: 700 }}>{a.symbol}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: a.color }}>{a.autor}</span>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-h)', lineHeight: 1.55, margin: '0 0 0.6rem' }}>
              {a.tesis}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              → {a.implicacion}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tensión final */}
      <STFloatingButton slideId="S13" />

      {/* Pregunta para la discusión */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          background: 'rgba(10,10,22,0.82)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(124,109,250,0.3)',
          borderRadius: '12px',
          padding: '1.25rem 2rem',
          maxWidth: '900px',
          width: '100%',
          textAlign: 'center',
          position: 'relative', zIndex: 1,
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.6rem', letterSpacing: '0.1em' }}>
          PREGUNTA PARA LA DISCUSIÓN
        </div>
        <p style={{ fontSize: '1.1rem', color: 'var(--accent-2)', fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>
          "¿Cuándo un modelo computacional cuenta como explicación neurocientífica —
          y no solo como predicción o herramienta?"
        </p>
      </motion.div>

      {/* Modal badges */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <STModalBadge symbol="◇" content="CONV_POSS" />
        <STModalBadge symbol="□" content="META_HIST" title="Metáfora Históricamente Contingente" />
        <STModalBadge symbol="O" content="EPISTEMOLOGICAL_GAP" title="Brecha Explicativa Persistente" />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1100px', width: '100%', fontSize: '1rem', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Lakatos y los programas de investigación:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            Un programa es <em>progresivo</em> si predice hechos novedosos que luego se verifican.
            <em> Degenerativo</em> si solo explica post-hoc lo que ya sabíamos.
            La pregunta para el conexionismo de Hinton: en 2024, ¿los LLMs han generado predicciones
            corroborables sobre cognición biológica, o han divergido hacia ingeniería pura?
            Si divergieron, el programa sigue vivo como tecnología pero muere como neurofilosofía.
          </span>
        </div>
      )}
    </div>
  )
}
