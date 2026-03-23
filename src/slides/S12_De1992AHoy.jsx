import STTooltip from "../components/st/STTooltip"
import STFloatingButton from "../components/st/STFloatingButton"
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import STModalBadge from '../components/st/STModalBadge'

// ── Pre-computed deterministic background data ─────────────────────────────────
const N_BG = 80

const BG_NODES = Array.from({ length: N_BG }, (_, i) => ({
  x:  ((i * 7919 + 13)  % 97)  / 97,
  y:  ((i * 6271 + 31)  % 89)  / 89,
  vx: (((i * 1237) % 200) / 100 - 1) * 0.000050,
  vy: (((i * 5417) % 200) / 100 - 1) * 0.000050,
  ph: (i * 2.71828) % (Math.PI * 2),
  r:  1.0 + ((i * 4637) % 10) / 10 * 2.2,
}))

const BG_CONNS = (() => {
  const list = []
  for (let a = 0; a < N_BG; a++) {
    for (let b = a + 1; b < N_BG; b++) {
      const dx = BG_NODES[a].x - BG_NODES[b].x
      const dy = BG_NODES[a].y - BG_NODES[b].y
      if (dx * dx + dy * dy < 0.23 * 0.23) {
        list.push({
          a, b,
          sig: ((a * 13 + b * 7) % 100) / 100,
          spd: 0.0016 + ((a * 3 + b) % 50) / 50 * 0.007,
        })
      }
    }
  }
  return list
})()

// ── Animated neural background ─────────────────────────────────────────────────
function NeuralBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const nodes = BG_NODES.map(n => ({ ...n }))
    const conns = BG_CONNS.map(c => ({ ...c }))

    let W = 0, H = 0
    const setSize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    ro.observe(canvas)

    let animId
    let ringT  = 0   // ring expansion timer (period ~4 s)
    let ring2T = 2   // second ring, offset by 2 s

    const draw = (timestamp) => {
      if (!W || !H) { animId = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      const t   = timestamp * 0.001

      // ── Trail fade (creates comet trails on signals) ──
      ctx.fillStyle = 'rgba(1,1,14,0.14)'
      ctx.fillRect(0, 0, W, H)

      // ── Drift nodes ──
      nodes.forEach(n => {
        n.x = ((n.x + n.vx) + 1) % 1
        n.y = ((n.y + n.vy) + 1) % 1
      })

      // ── Slow color cycle: violet → cyan → violet ──
      const cycle = (Math.sin(t * 0.055) + 1) / 2   // 0→1→0 every ~57s
      const cr = Math.round(124 - cycle * 50)         // #7c → #4a
      const cg = Math.round(109 + cycle * 73)         // #6d → #b6
      const cb = Math.round(250 - cycle * 38)         // #fa → #d4

      // ── Connections + signals ──
      conns.forEach(c => {
        c.sig = (c.sig + c.spd) % 1
        const na = nodes[c.a], nb = nodes[c.b]
        const ax = na.x * W, ay = na.y * H
        const bx = nb.x * W, by = nb.y * H

        // Faint line
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.048)`
        ctx.lineWidth = 0.45
        ctx.stroke()

        // Signal glow
        const pAlpha = 0.7 * Math.sin(c.sig * Math.PI)
        if (pAlpha > 0.07) {
          const sx = ax + (bx - ax) * c.sig
          const sy = ay + (by - ay) * c.sig
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 6)
          grd.addColorStop(0, `rgba(${Math.min(255, cr + 50)},${Math.min(255, cg + 50)},${cb},${pAlpha})`)
          grd.addColorStop(0.5, `rgba(${cr},${cg},${cb},${pAlpha * 0.35})`)
          grd.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath()
          ctx.arc(sx, sy, 6, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }
      })

      // ── Nodes ──
      nodes.forEach((n, i) => {
        const x = n.x * W, y = n.y * H
        const pulse = 0.5 + 0.5 * Math.sin(t * (0.6 + (i % 11) * 0.09) + n.ph)
        const r = n.r * (0.6 + 0.6 * pulse)

        // Outer halo
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 7)
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${0.11 * pulse})`)
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(x, y, r * 7, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Inner core
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${Math.min(255, cr + 55)},${Math.min(255, cg + 40)},${cb},${0.5 * pulse})`
        ctx.fill()
      })

      // ── Expanding rings (heartbeat — two offset rings) ──
      ringT  += 0.016; if (ringT  > 4) ringT  -= 4
      ring2T += 0.016; if (ring2T > 4) ring2T -= 4
      ;[ringT, ring2T].forEach(rt => {
        const p = rt / 4
        const rR = p * Math.hypot(W, H) * 0.62
        const rA = Math.max(0, 0.06 - p * 0.06)
        if (rA > 0.003) {
          ctx.beginPath()
          ctx.arc(W / 2, H / 2, rR, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${rA})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      })

      // ── Subtle center radial glow ──
      const centerPulse = 0.5 + 0.5 * Math.sin(t * 0.4)
      const cGrd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.45)
      cGrd.addColorStop(0, `rgba(${cr},${cg},${cb},${0.025 * centerPulse})`)
      cGrd.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = cGrd
      ctx.fillRect(0, 0, W, H)

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

// ── Slide data ────────────────────────────────────────────────────────────────
// 12 items → 3 rows of 4 in snake layout
const TIMELINE = [
  // ── Row 1 (prehistoria) →
  { year: 1943, label: 'McCulloch-Pitts', event: 'Neurona formal',       era: 'pre', color: '#64748b',
    detail: 'Primera unidad de cómputo neuronal. Umbral lógico binario. Base matemática que todo lo posterior hereda.' },
  { year: 1949, label: 'Hebb',            event: 'Regla de Hebb',        era: 'pre', color: '#64748b',
    detail: '"Las neuronas que se activan juntas se conectan." Primera regla de aprendizaje sin supervisor. Funda la plasticidad sináptica computacional.' },
  { year: 1958, label: 'Rosenblatt',      event: 'Perceptrón',           era: 'pre', color: '#475569',
    detail: 'Primera red con aprendizaje supervisado garantizado. Convergencia probada para problemas linealmente separables.' },
  { year: 1969, label: 'Minsky-Papert',   event: 'Crisis del XOR',       era: 'crisis', color: '#7f1d1d',
    detail: '"Perceptrons" demuestra que una sola capa no puede resolver XOR. Primer invierno de la IA. El conexionismo queda en hibernación.' },
  // ── Row 2 (renacimiento) ←
  { year: 1974, label: 'Werbos',          event: 'Backprop (tesis)',      era: 'pre', color: '#78350f',
    detail: 'Tesis doctoral de Paul Werbos. Retropropagación del error como método general. Ignorado por una década.' },
  { year: 1986, label: 'Rumelhart',       event: 'Backprop publicado',   era: 'pre', color: '#92400e',
    detail: 'PDP Vol. 1. Rumelhart, Hinton & Williams. Backprop funciona en redes multicapa. Fin del primer invierno de la IA.' },
  { year: 1992, label: 'Hinton',          event: 'Conexionismo',         era: 'modern', color: '#7c6dfa',
    detail: 'Artículo Scientific American. Retropropagación + representaciones distribuidas. Apuesta programática, no dogma.' },
  { year: 1998, label: 'LeCun',           event: 'CNN — LeNet',          era: 'modern', color: '#06b6d4',
    detail: 'Redes convolucionales aplicadas a dígitos postales. La jerarquía de rasgos emerge sola sin diseño manual.' },
  // ── Row 3 (era moderna) →
  { year: 2012, label: 'AlexNet',         event: 'ImageNet (+10%)',      era: 'modern', color: '#22c55e',
    detail: 'GPU + datos masivos + dropout. Brecha de 10% con el segundo lugar. Inicio del Deep Learning como paradigma dominante.' },
  { year: 2017, label: 'Transformers',    event: 'Atención',             era: 'modern', color: '#eab308',
    detail: '"Attention is all you need." La atención es recuperación masivamente paralela de representaciones distribuidas.' },
  { year: 2020, label: 'GPT-3',           event: '175B params',          era: 'modern', color: '#f97316',
    detail: '175 mil millones de parámetros. Emergencia de capacidades no predichas. Las leyes de escala de Kaplan.' },
  { year: 2024, label: 'LLMs',            event: 'Agentes generativos',  era: 'modern', color: '#ef4444',
    detail: 'Multimodalidad, razonamiento emergente, agentes autónomos. ¿La red ha llegado a ser lo que el cerebro no pudo ser?' },
]

const ROWS = [TIMELINE.slice(0, 4), TIMELINE.slice(4, 8), TIMELINE.slice(8, 12)]

const REALIZABILIDAD = [
  { titulo: 'Putnam (1967)', color: '#06b6d4', t: 'La función, no el material, define el estado mental.' },
  { titulo: 'Fodor', color: '#eab308', t: 'Psicología autónoma respecto a neurociencia.' },
  { titulo: 'Tensión', color: '#f97316', t: 'Si el sustrato importa, la equivalencia se rompe.' },
]

// ── Snake connector component ─────────────────────────────────────────────────
function SnakeConnector({ side }) {
  return (
    <div style={{ display: 'flex', justifyContent: side === 'right' ? 'flex-end' : 'flex-start', width: '100%', paddingRight: side === 'right' ? '12.5%' : 0, paddingLeft: side === 'left' ? '12.5%' : 0, height: '20px', alignItems: 'center' }}>
      <div style={{ width: 2, height: '100%', background: 'linear-gradient(to bottom, rgba(124,109,250,0.35), rgba(124,109,250,0.15))' }} />
    </div>
  )
}

// ── Slide component ───────────────────────────────────────────────────────────
export default function S12_De1992AHoy({ profesorMode }) {
  const [detailIdx, setDetailIdx] = useState(null)

  return (
    <div
      className="section-slide"
      style={{
        gap: '0.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0.6rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <NeuralBackground />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div className="section-title" style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.4rem)' }}>De 1943 a Hoy</div>
          <div className="section-subtitle" style={{ fontSize: '0.9rem' }}>Ontología en Evolución</div>
        </div>

        {/* ── Snake timeline ── */}
        <div style={{ width: '100%', maxWidth: '1120px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {ROWS.map((row, ri) => (
            <div key={ri}>
              {/* Era label */}
              {ri === 0 && (
                <div style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.12em', marginBottom: '0.3rem', paddingLeft: '2px' }}>
                  PRE-HISTORIA · 1943–1969
                </div>
              )}
              {ri === 1 && (
                <div style={{ fontSize: '0.62rem', color: '#a78bfa', fontFamily: 'monospace', letterSpacing: '0.12em', marginBottom: '0.3rem', paddingLeft: '2px', marginTop: '0.2rem' }}>
                  RENACIMIENTO · 1974–1998
                </div>
              )}
              {ri === 2 && (
                <div style={{ fontSize: '0.62rem', color: '#22c55e', fontFamily: 'monospace', letterSpacing: '0.12em', marginBottom: '0.3rem', paddingLeft: '2px', marginTop: '0.2rem' }}>
                  ERA MODERNA · 2012–2024
                </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: ri % 2 === 1 ? 'row-reverse' : 'row',
                gap: '0.5rem',
                width: '100%',
              }}>
                {row.map((t) => {
                  const globalIdx = TIMELINE.indexOf(t)
                  const isOpen = detailIdx === globalIdx
                  return (
                    <motion.div
                      key={t.year}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: globalIdx * 0.06 }}
                      onClick={() => setDetailIdx(isOpen ? null : globalIdx)}
                      whileHover={{ scale: 1.025, y: -2 }}
                      style={{
                        flex: '1 1 0',
                        backdropFilter: 'blur(12px)',
                        background: isOpen ? `rgba(${hexRgb(t.color)},0.18)` : 'rgba(8,8,22,0.75)',
                        borderTop: `4px solid ${t.color}`,
                        borderRadius: '10px',
                        border: `1px solid ${isOpen ? t.color + 'bb' : t.color + '40'}`,
                        padding: '0.75rem 0.9rem',
                        cursor: 'pointer',
                        transition: 'background 0.2s, border-color 0.2s',
                        boxShadow: isOpen ? `0 0 22px ${t.color}44` : 'none',
                        opacity: t.era === 'pre' ? 0.75 : 1,
                      }}
                    >
                      <div style={{ fontSize: '1rem', color: t.color, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.02em' }}>{t.year}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)', marginTop: '0.1rem' }}>{t.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>{t.event}</div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ maxHeight: 0, opacity: 0 }}
                            animate={{ maxHeight: 120, opacity: 1 }}
                            exit={{ maxHeight: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <p style={{
                              fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5,
                              margin: '0.5rem 0 0', paddingTop: '0.4rem',
                              borderTop: `1px solid ${t.color}44`,
                            }}>
                              {t.detail}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {/* Snake connector between rows */}
              {ri < ROWS.length - 1 && (
                <SnakeConnector side={ri % 2 === 0 ? 'right' : 'left'} />
              )}
            </div>
          ))}
        </div>

        {/* Realizabilidad múltiple */}
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '1120px' }}>
          {REALIZABILIDAD.map(r => (
            <div key={r.titulo} style={{
              flex: 1, backdropFilter: 'blur(10px)', background: 'rgba(8,8,22,0.7)',
              borderLeft: `3px solid ${r.color}`, borderRadius: '4px',
              padding: '0.5rem 0.8rem', border: `1px solid ${r.color}33`,
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: r.color }}>{r.titulo}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.4 }}>{r.t}</div>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{
            backdropFilter: 'blur(16px)', background: 'rgba(124,109,250,0.1)',
            border: '1px solid rgba(124,109,250,0.4)', borderRadius: '12px',
            padding: '0.8rem 1.6rem', maxWidth: '820px', width: '100%',
            textAlign: 'center', boxShadow: '0 0 30px rgba(124,109,250,0.1)',
          }}
        >
          <div style={{ fontSize: '1rem', color: 'var(--accent-2)', fontStyle: 'italic', lineHeight: 1.55 }}>
            "Hinton no afirma una verdad eterna — apuesta en un programa de investigación."
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            <code>◇(CONV_POSS)</code> satisfacible en Modal K. La convergencia es posible, no necesaria.
          </div>
        </motion.div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <STModalBadge symbol="◇" content="CONV_POSS" />
          <STModalBadge symbol="◇" content="¬BRAIN_COMP" />
        </div>

        {profesorMode && (
          <div className="st-card" style={{ maxWidth: '1100px', width: '100%', fontSize: '0.85rem', backdropFilter: 'blur(10px)', background: 'rgba(8,8,22,0.8)' }}>
            <strong style={{ color: 'var(--accent-2)' }}>Interpretabilidad mecanicista:</strong>{' '}
            Leyes de escala de Kaplan (2020). Features detectadas por neuronas individuales en modelos grandes
            (Anthropic, 2023). La pregunta sigue abierta: ¿estas representaciones son como las del cerebro,
            o son una nueva ontología computacional sin análogo biológico?
          </div>
        )}

        <STFloatingButton />
      </div>
    </div>
  )
}

function hexRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '124,109,250'
}
