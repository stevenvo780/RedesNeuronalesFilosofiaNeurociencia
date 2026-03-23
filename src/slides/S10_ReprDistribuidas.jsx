import STTooltip from "../components/st/STTooltip"
import STFloatingButton from "../components/st/STFloatingButton"
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const REPR_TYPES = [
  {
    id: 'distributed',
    label: 'Distribuida',
    tooltip: 'representacion_distribuida',
    desc: 'Muchas unidades activas simultáneamente. El patrón emerge del conjunto, no de una sola célula. Base de PCA y backprop.',
    color: '#7c6dfa',
    pattern: [0.9, 0.7, 0.8, 0.6, 0.8, 0.7, 0.9, 0.5],
  },
  {
    id: 'local',
    label: 'Local',
    tooltip: 'representacion',
    desc: 'Una sola unidad activa representa un patrón. Extremo competitivo: "neurona abuela". Frágil pero interpretable.',
    color: '#22c55e',
    pattern: [0.05, 0.05, 0.95, 0.05, 0.05, 0.05, 0.05, 0.05],
  },
  {
    id: 'sparse',
    label: 'Sparse (Barlow)',
    tooltip: 'representacion',
    desc: 'Subconjunto pequeño activo — economía + calidad. El caso más interesante: decodificable pero no redundante.',
    color: '#eab308',
    pattern: [0.08, 0.85, 0.06, 0.07, 0.78, 0.06, 0.07, 0.06],
  },
]

// ── Animated representation diagram ──────────────────────────────────────────
function ReprDiagram({ type }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let id, startTime = null
    let W = 0, H = 0

    const setSize = () => {
      const nw = canvas.offsetWidth || 300
      const nh = canvas.offsetHeight || 70
      if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    function draw(ts) {
      if (!W || !H) { id = requestAnimationFrame(draw); return }
      if (!startTime) startTime = ts
      const t = (ts - startTime) * 0.001
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      const n = type.pattern.length
      const r = Math.min(W / (n * 2.8), 20)
      const spacing = W / (n + 1)

      type.pattern.forEach((act, i) => {
        const pulse  = act > 0.5 ? 0.7 + 0.3 * Math.sin(t * 2.2 + i * 0.8) : act
        const glow   = act > 0.5 ? act * 0.25 : 0
        const x = spacing * (i + 1)
        const y = H / 2

        // Outer glow for active nodes
        if (glow > 0) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5)
          g.addColorStop(0, `rgba(${hexToRgb(type.color)},${glow})`)
          g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = g; ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${hexToRgb(type.color)},${pulse})`
        ctx.fill()
        ctx.strokeStyle = type.color
        ctx.lineWidth = 1.5
        ctx.stroke()
      })

      id = requestAnimationFrame(draw)
    }

    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); ro.disconnect() }
  }, [type])

  return <canvas ref={ref} style={{ width: '100%', height: '70px', display: 'block' }} />
}

// ── Animated recurrent network ────────────────────────────────────────────────
function RecurrentNet() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let id

    function setup() {
      const W = canvas.offsetWidth || 900
      const H = canvas.offsetHeight || 240
      if (!W) { id = requestAnimationFrame(setup); return }
      canvas.width = W; canvas.height = H

      const nodes = [
        { x: W * 0.20, y: H * 0.50, label: 'A' },
        { x: W * 0.50, y: H * 0.30, label: 'B' },
        { x: W * 0.80, y: H * 0.50, label: 'C' },
        { x: W * 0.50, y: H * 0.70, label: 'D' },
      ]
      const edges = [[0,1],[1,2],[2,3],[3,0],[0,3],[2,1]]

      // Signal pulses on each edge
      const pulses = edges.map((_, i) => ({
        prog: i / edges.length,
        spd: 0.004 + (i % 3) * 0.002,
      }))

      let startTime = null

      function draw(ts) {
        if (!startTime) startTime = ts
        const t = (ts - startTime) * 0.001
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, W, H)
        ctx.fillStyle = '#0b0b1e'; ctx.fillRect(0, 0, W, H)

        // Edges
        edges.forEach(([a, b], ei) => {
          const na = nodes[a], nb = nodes[b]
          const mx = (na.x + nb.x) / 2
          const my = (na.y + nb.y) / 2 - 22
          ctx.beginPath()
          ctx.moveTo(na.x, na.y)
          ctx.quadraticCurveTo(mx, my, nb.x, nb.y)
          ctx.strokeStyle = 'rgba(124,109,250,0.35)'
          ctx.lineWidth = 1.5; ctx.stroke()

          // Pulse along the curve
          const p = pulses[ei]
          p.prog = (p.prog + p.spd) % 1
          const tq = p.prog
          const px = (1-tq)*(1-tq)*na.x + 2*(1-tq)*tq*mx + tq*tq*nb.x
          const py = (1-tq)*(1-tq)*na.y + 2*(1-tq)*tq*my + tq*tq*nb.y
          const alpha = Math.sin(tq * Math.PI)
          if (alpha > 0.05) {
            const grd = ctx.createRadialGradient(px, py, 0, px, py, 7)
            grd.addColorStop(0, `rgba(167,139,250,${alpha * 0.9})`)
            grd.addColorStop(1, 'rgba(0,0,0,0)')
            ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2)
            ctx.fillStyle = grd; ctx.fill()
          }
        })

        // Nodes
        nodes.forEach((n, i) => {
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 1.2)
          const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 22)
          grd.addColorStop(0, `rgba(124,109,250,${0.35 + pulse * 0.3})`)
          grd.addColorStop(1, 'rgba(124,109,250,0.04)')
          ctx.beginPath(); ctx.arc(n.x, n.y, 22, 0, Math.PI * 2)
          ctx.fillStyle = grd; ctx.fill()

          ctx.beginPath(); ctx.arc(n.x, n.y, 18, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(124,109,250,${0.2 + pulse * 0.15})`; ctx.fill()
          ctx.strokeStyle = '#7c6dfa'; ctx.lineWidth = 2; ctx.stroke()
          ctx.fillStyle = '#a78bfa'; ctx.font = '12px monospace'; ctx.textAlign = 'center'
          ctx.fillText(n.label, n.x, n.y + 4)
        })

        ctx.fillStyle = '#6b6b88'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
        ctx.fillText('la actividad vuelve → estado estable o dinámica temporal', W / 2, H - 6)

        id = requestAnimationFrame(draw)
      }
      draw(0)
    }
    id = requestAnimationFrame(setup)
    return () => cancelAnimationFrame(id)
  }, [])

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ── Main slide ────────────────────────────────────────────────────────────────
export default function S10_ReprDistribuidas({ profesorMode }) {
  return (
    <div className="section-slide" style={{ gap: '1.6rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Ontología de las Representaciones</div>
        <div className="section-subtitle">Del Localismo al Sparse Coding Recurrente</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px', fontSize: '1.05rem' }}>
        "¿Dónde reside el concepto de 'abuela' en la red? ¿En una sola <STTooltip term="neurona_biologica">neurona</STTooltip> (<em>célula de la abuela</em>) o distribuida holográficamente en mil <STTooltip term="peso">sinapsis</STTooltip>? Hinton y Barlow buscaban el punto medio ontológico."
      </div>

      <STFloatingButton />

      {/* Tres tipos de representación — animated */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '1100px', justifyContent: 'center' }}>
        {REPR_TYPES.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            style={{
              flex: '1 1 200px',
              background: 'var(--bg-3)',
              border: `1px solid ${t.color}44`,
              borderTop: `3px solid ${t.color}`,
              borderRadius: '10px',
              padding: '0.85rem',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: t.color, marginBottom: '0.5rem' }}>
              <STTooltip term={t.tooltip}>{t.label}</STTooltip>
            </div>
            <ReprDiagram type={t} />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '0.75rem', lineHeight: 1.5 }}>
              {t.desc}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ fontSize: '1.05rem', color: 'var(--text)', textAlign: 'center', maxWidth: '900px', lineHeight: 1.6 }}>
        Hinton subraya que:{' '}
        <span style={{ color: 'var(--accent-2)' }}>
          "los casos más interesantes ocurren en la frontera entre la extrema <STTooltip term="representacion">economía</STTooltip> (localismo) y la extrema densidad"
        </span>{' '}
        — El <STTooltip term="representacion">Sparse Coding</STTooltip> de Barlow soluciona esto garantizando que el estado sea decodificable pero empleando fracciones mínimas de neuronas activas.
      </div>

      {/* Redes recurrentes — animated */}
      <div style={{ width: '100%', maxWidth: '900px', alignSelf: 'center' }}>
        <div style={{ fontSize: '1.05rem', color: 'var(--text-h)', fontWeight: 600, marginBottom: '0.7rem', textAlign: 'center' }}>
          Topología No Lineal: <STTooltip term="arquitectura">Redes Recurrentes (RNN)</STTooltip>
        </div>
        <div style={{ height: '220px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <RecurrentNet />
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.4rem' }}>
          Las señales circulan entre nodos — cada pulso es un estado que <STTooltip term="vector_de_estado">persiste en el tiempo</STTooltip>
        </div>
      </div>

      {/* Puente a Bechtel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.32)',
          borderRadius: '12px', padding: '1.2rem 2rem',
          maxWidth: '900px', width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '0.5rem', letterSpacing: '0.08em' }}>
          HACIA BECHTEL (2001)
        </div>
        <p style={{ fontSize: '1.05rem', color: 'var(--accent-2)', fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>
          "Hasta aquí hemos <em>asumido</em> que las redes tienen representaciones. Pero ¿qué es exactamente una representación mental — qué condiciones debe cumplir algo para contar como representación y no solo como correlato funcional?"
        </p>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '0.6rem' }}>
          → Siguiente texto: Bechtel — mecanismos y condiciones de la representación mental
        </div>
      </motion.div>

      {/* Profesor notes — sticky at bottom so they never leave the slide */}
      {profesorMode && (
        <div style={{
          position: 'sticky', bottom: '0.5rem',
          width: '100%', maxWidth: '1000px',
          background: 'rgba(10,10,22,0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(124,109,250,0.35)',
          borderRadius: '10px',
          padding: '0.8rem 1.2rem',
          fontSize: '0.95rem', lineHeight: 1.6,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
          zIndex: 20,
        }}>
          <strong style={{ color: 'var(--accent-2)' }}>Vínculo con hoy:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            Las LSTM y los transformers son descendientes directos de las redes recurrentes de Hinton.
            La <STTooltip term="representacion">atención</STTooltip> es un mecanismo de recuperación de representaciones distribuidas
            que operacionaliza el criterio de "buena representación" de forma masivamente paralela.
          </span>
        </div>
      )}
    </div>
  )
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '124,109,250'
}
