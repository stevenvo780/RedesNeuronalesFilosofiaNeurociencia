import { useState, useRef, useEffect, useImperativeHandle } from 'react'
import { Play, Pause, ArrowRight, ArrowLeft } from 'lucide-react'
import { BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useNeuralNet } from '../hooks/useNeuralNet'
import STTooltip from '../components/st/STTooltip'
import STModalBadge from '../components/st/STModalBadge'

const HISTORY = [
  { year: 1974, label: 'Werbos 1974', color: '#6b6b88', desc: 'Descubierto. Ignorado por una década.' },
  { year: 1982, label: '1982 (×2)',   color: '#eab308', desc: 'Redescubierto independientemente.' },
  { year: 1986, label: 'Hinton 1986', color: '#7c6dfa', desc: 'Publicado. El mundo lo escucha.' },
]

const STEPS = [
  { id: 'ea',      label: 'Error de activación',  color: '#ef4444', formula: 'EA_j = y_j - d_j',                  desc: 'Diferencia entre salida real y deseada.' },
  { id: 'ei',      label: 'Error de entrada',      color: '#eab308', formula: 'EI_j = EA_j \\cdot y_j(1-y_j)',    desc: 'Ponderado por la derivada de la sigmoide.' },
  { id: 'ew',      label: 'Error del peso',        color: '#7c6dfa', formula: 'EW_{ij} = EI_j \\cdot y_i',        desc: 'Responsabilidad de cada conexión en el error.' },
  { id: 'ea_prev', label: 'Propagar atrás',        color: '#a78bfa', formula: 'EA_i = \\sum_j EI_j \\cdot w_{ij}', desc: 'El error fluye hacia la capa anterior.' },
]

// ── Gradient flow network canvas ──────────────────────────────────────────────
function GradNetCanvas({ gradMags, activations, weights, mode, activeStep }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(0)
  const particlesRef = useRef([])

  // Initialize/reset particles when mode changes
  useEffect(() => {
    if (mode !== 'backward') { particlesRef.current = []; return }
    const layers = [2, 8, 8, 1]
    const newP = []
    layers.slice(0, -1).forEach((fromSize, l) => {
      for (let k = 0; k < 3; k++) {
        newP.push({
          layer: l,
          fromNode: Math.floor(Math.random() * fromSize),
          toNode: Math.floor(Math.random() * layers[l + 1]),
          t: Math.random(),
          speed: 0.008 + Math.random() * 0.012,
        })
      }
    })
    particlesRef.current = newP
  }, [mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf
    let W = 0, H = 0

    const setSize = () => {
      const nw = canvas.offsetWidth
      const nh = canvas.offsetHeight
      if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    const draw = () => {
      if (!W || !H) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      const layers = [2, 8, 8, 1]
      const lx = layers.map((_, l) => (W / (layers.length + 1)) * (l + 1))
      const nodeR = 14

      // ── Connections ──
      layers.slice(0, -1).forEach((fromSize, l) => {
        const toSize = layers[l + 1]
        const gRms = gradMags[l]?.rms ?? 0
        const maxRms = 0.3

        for (let i = 0; i < fromSize; i++) {
          for (let j = 0; j < toSize; j++) {
            const x1f = mode === 'forward' ? lx[l] : lx[l + 1]
            const y1f = mode === 'forward' ? getY(H, fromSize, i) : getY(H, toSize, j)
            const x2f = mode === 'forward' ? lx[l + 1] : lx[l]
            const y2f = mode === 'forward' ? getY(H, toSize, j) : getY(H, fromSize, i)

            let alpha = 0.1
            let strokeColor = '#555577'

            if (mode === 'backward') {
              // Color by gradient magnitude for this specific weight if available
              const flatIdx = i * toSize + j
              const mag = gradMags[l]?.flat?.[flatIdx] ?? 0
              const maxMag = Math.max(...(gradMags[l]?.flat ?? [0.001]), 0.001)
              alpha = 0.15 + (mag / maxMag) * 0.7
              const rVal = Math.round(180 + 75 * (mag / maxMag))
              strokeColor = `rgba(${rVal}, 60, 60, ${alpha})`
            } else {
              const w = weights[l]?.matrix?.[i]?.[j] ?? 0
              alpha = Math.min(Math.abs(w) * 0.8, 0.6)
              strokeColor = w > 0 ? `rgba(124,109,250,${alpha})` : `rgba(239,68,68,${alpha})`
            }

            ctx.strokeStyle = strokeColor
            ctx.lineWidth = mode === 'backward' ? 1.5 : 1
            ctx.setLineDash(mode === 'backward' ? [4, 3] : [])
            ctx.beginPath()
            ctx.moveTo(x1f, y1f)
            ctx.lineTo(x2f, y2f)
            ctx.stroke()
          }
        }
        ctx.setLineDash([])
      })

      // ── Particles (backward mode) ──
      if (mode === 'backward') {
        particlesRef.current.forEach(p => {
          const l = p.layer
          const fromSize = layers[l]
          const toSize   = layers[l + 1]
          const x1 = lx[l + 1]; const y1 = getY(H, toSize, p.toNode)
          const x2 = lx[l];     const y2 = getY(H, fromSize, p.fromNode)
          const px = x1 + (x2 - x1) * p.t
          const py = y1 + (y2 - y1) * p.t
          const mag = gradMags[l]?.rms ?? 0.1
          const intensity = Math.min(mag * 5, 1)

          ctx.beginPath()
          ctx.arc(px, py, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,${Math.round(100 + 155 * (1 - intensity))},60,0.9)`
          ctx.fill()

          p.t = (p.t + p.speed) % 1
        })
      }

      // ── Nodes ──
      layers.forEach((size, l) => {
        const color = ['#06b6d4', '#7c6dfa', '#a78bfa', '#22c55e'][l]
        for (let i = 0; i < size; i++) {
          const x = lx[l]; const y = getY(H, size, i)
          const act = Array.isArray(activations[l]) ? activations[l][i] : (activations[l] ?? 0)
          const norm = Math.max(0, Math.min(1, act))
          const isOutput = l === layers.length - 1
          const isInput  = l === 0

          ctx.beginPath(); ctx.arc(x, y, nodeR, 0, Math.PI * 2)
          const g = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, nodeR)
          const alpha = mode === 'backward' && isOutput ? 0.9 : 0.25 + norm * 0.6
          g.addColorStop(0, `rgba(${hexRgb(color)},${Math.min(alpha + 0.15, 1)})`)
          g.addColorStop(1, `rgba(${hexRgb(color)},${alpha * 0.25})`)
          ctx.fillStyle = g; ctx.fill()

          if (mode === 'backward' && isOutput) {
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5
          } else {
            ctx.strokeStyle = color; ctx.lineWidth = 1.5
          }
          ctx.stroke()

          ctx.fillStyle = '#ccc'; ctx.font = '7px monospace'; ctx.textAlign = 'center'
          ctx.fillText(norm.toFixed(2), x, y + 2.5)
        }
      })

      // ── Arrow label ──
      ctx.fillStyle = mode === 'forward' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'
      ctx.font = '10px monospace'; ctx.textAlign = 'center'
      ctx.fillText(mode === 'forward' ? '→ forward pass' : '← error propagation', W / 2, H - 6)

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [gradMags, activations, weights, mode, activeStep])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}

function hexRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '124,109,250'
}
function getY(H, size, i) {
  const spacing = Math.min(50, (H - 50) / Math.max(size - 1, 1))
  return H / 2 - ((size - 1) * spacing) / 2 + i * spacing
}

// ── Inline Animated Equation (like S03 style) ─────────────────────────────────
function BackpropEquationLine({ activeStep, mode }) {
  if (mode === 'forward') {
    return (
      <div style={{
        textAlign: 'center', padding: '0.5rem 0.8rem',
        fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-dim)',
        transition: 'all 0.4s ease',
      }}>
        <span style={{ color: '#22c55e' }}>→ Forward: </span>
        <span style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
          <BlockMath math="\textcolor{#22c55e}{y_j} = f\!\left(\sum_i x_i \cdot w_{ij} + b_j\right)" />
        </span>
      </div>
    )
  }

  // Backward mode: build the chain progressively
  // Step 0: EA  |  Step 1: EA → EI  |  Step 2: EA → EI → EW  |  Step 3: EA → EI → EW → EA_prev
  const segments = [
    { color: '#ef4444', tex: '\\textcolor{#ef4444}{EA_j} = y_j - d_j', label: 'error activación' },
    { color: '#eab308', tex: '\\textcolor{#eab308}{EI_j} = EA_j \\cdot y_j(1{-}y_j)', label: 'error entrada' },
    { color: '#7c6dfa', tex: '\\textcolor{#7c6dfa}{EW_{ij}} = EI_j \\cdot y_i', label: 'error peso' },
    { color: '#a78bfa', tex: '\\textcolor{#a78bfa}{EA_i} = \\sum_j EI_j \\cdot w_{ij}', label: 'propagar' },
  ]

  return (
    <div style={{
      textAlign: 'center', padding: '0.4rem 0.6rem',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.15rem', flexWrap: 'wrap',
      transition: 'all 0.4s ease',
      minHeight: '3.2rem',
    }}>
      {segments.map((seg, i) => {
        const isVisible = activeStep !== null && i <= activeStep
        const isActive = activeStep === i
        return (
          <span key={i} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
            opacity: isVisible ? 1 : 0.15,
            transform: isVisible ? 'scale(1)' : 'scale(0.92)',
            transition: 'all 0.45s ease',
            filter: isActive ? `drop-shadow(0 0 6px ${seg.color})` : 'none',
          }}>
            {i > 0 && (
              <span style={{
                color: isVisible ? 'var(--text-dim)' : 'transparent',
                fontSize: '1.1rem', margin: '0 0.2rem',
                transition: 'color 0.4s',
              }}>→</span>
            )}
            <span style={{
              background: isActive ? `${seg.color}18` : 'transparent',
              border: isActive ? `1px solid ${seg.color}55` : '1px solid transparent',
              borderRadius: '6px', padding: '0.15rem 0.4rem',
              transition: 'all 0.35s',
              display: 'inline-flex', alignItems: 'center',
            }}>
              <BlockMath math={seg.tex} />
            </span>
          </span>
        )
      })}
    </div>
  )
}

// ── Main slide ────────────────────────────────────────────────────────────────
export default function S06_Retropropagacion({ profesorMode, ref }) {
  const { gradMags, activations, weights, epoch, training, start, stop } = useNeuralNet({ hiddenSizes: [8, 8] })
  
  // Seq state: 0 = Forward, 1 = Backprop Inicio, 2 = Paso 1, 3 = Paso 2, 4 = Paso 3, 5 = Paso 4
  const [seqIndex, setSeqIndex] = useState(0)
  const seqRef = useRef(0)

  // Omitimos dependencias o usamos ref para evitar stale closures en imperative_handle
  useImperativeHandle(ref, () => ({
    advanceStep() {
      if (seqRef.current >= 5) return false
      seqRef.current++
      setSeqIndex(seqRef.current)
      return true
    },
    retreatStep() {
      if (seqRef.current <= 0) return false
      seqRef.current--
      setSeqIndex(seqRef.current)
      return true
    }
  }))

  const setStepIdx = (idx) => {
    seqRef.current = idx
    setSeqIndex(idx)
  }

  // Derived state
  const mode = seqIndex === 0 ? 'forward' : 'backward'
  const activeStep = seqIndex >= 2 ? seqIndex - 2 : null

  // Auto-start on slide mount, run indefinitely
  useEffect(() => {
    start()
    return () => stop()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="section-slide" style={{ gap: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title"><STTooltip term="backpropagacion">Retropropagación</STTooltip></div>
        <div className="section-subtitle">Gradientes reales fluyendo — TF.js en vivo</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px' }}>
        "En 1974 Werbos lo descubrió. Nadie lo escuchó.
        En 1986 Hinton lo popularizó. ¿Por qué costó 12 años?"
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', gap: '0.8rem', maxWidth: '1000px', width: '100%', alignItems: 'center' }}>
        {HISTORY.map((h, i) => (
          <div key={h.year} style={{ display: 'contents' }}>
            <div style={{ textAlign: 'center', flex: 1, background: 'var(--bg-3)', border: `1px solid ${h.color}44`, borderLeft: `4px solid ${h.color}`, borderRadius: '8px', padding: '0.55rem 0.8rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: h.color, marginBottom: '0.15rem' }}>{h.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{h.desc}</div>
            </div>
            {i < HISTORY.length - 1 && <div style={{ color: 'var(--border)', fontSize: '1.2rem', flexShrink: 0 }}>→</div>}
          </div>
        ))}
      </div>

      {/* ── Full-width animation card (like S03) ── */}
      <div style={{
        width: '100%', maxWidth: '1000px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '0.8rem 1.2rem',
      }}>
        {/* Sequential Controls inside card */}
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.6rem' }}>
          <button onClick={() => setStepIdx(0)} style={{
            flex: 1, padding: '0.45rem', borderRadius: '8px',
            border: `1px solid ${mode === 'forward' ? '#22c55e' : 'var(--border)'}`,
            background: mode === 'forward' ? 'rgba(34,197,94,0.12)' : 'transparent',
            color: mode === 'forward' ? '#22c55e' : 'var(--text-dim)',
            fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center',
          }}>
            <ArrowRight size={13} strokeWidth={2} style={{ flexShrink: 0 }} /> Forward Pass
          </button>
          <button onClick={() => setStepIdx(1)} style={{
            flex: 1, padding: '0.45rem', borderRadius: '8px',
            border: `1px solid ${mode === 'backward' ? '#ef4444' : 'var(--border)'}`,
            background: mode === 'backward' ? 'rgba(239,68,68,0.12)' : 'transparent',
            color: mode === 'backward' ? '#ef4444' : 'var(--text-dim)',
            fontSize: '0.88rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center',
          }}>
            <ArrowLeft size={13} strokeWidth={2} style={{ flexShrink: 0 }} /> Backprop Pass
          </button>
        </div>

        {/* Canvas */}
        <div style={{ height: '320px', borderRadius: '8px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          <GradNetCanvas gradMags={gradMags} activations={activations} weights={weights} mode={mode} activeStep={activeStep} />
          <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            época {epoch}
          </div>
          {/* Play/Pause overlay */}
          <button onClick={() => training ? stop() : start()} style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            padding: '0.3rem 1rem', borderRadius: '20px',
            border: `1px solid ${training ? 'rgba(239,68,68,0.5)' : 'rgba(124,109,250,0.5)'}`,
            background: training ? 'rgba(239,68,68,0.15)' : 'rgba(124,109,250,0.15)',
            backdropFilter: 'blur(8px)',
            color: training ? '#ef4444' : 'var(--accent-2)',
            fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '0.35rem', zIndex: 2,
          }}>
            {training
              ? <><Pause size={11} strokeWidth={2} style={{ flexShrink: 0 }} /> Pausar</>
              : <><Play  size={11} strokeWidth={2} style={{ flexShrink: 0 }} /> Entrenar</>}
          </button>
        </div>

        {/* Equation line (like S03) */}
        <BackpropEquationLine activeStep={activeStep} mode={mode} />
      </div>

      {/* ── 4 steps as horizontal row below ── */}
      <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '1000px', width: '100%', flexWrap: 'wrap' }}>
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            onClick={() => setStepIdx(i + 2)}
            style={{
              flex: '1 1 160px',
              background: activeStep === i ? `${s.color}14` : 'var(--bg-3)',
              border: `1px solid ${activeStep === i ? s.color : 'var(--border)'}`,
              borderTop: `3px solid ${s.color}`,
              borderRadius: '8px', padding: '0.6rem 0.8rem',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: s.color, fontWeight: 600, marginBottom: '0.2rem' }}>
              Paso {i + 1}: {s.label}
            </div>
            {profesorMode && (
              <div style={{ fontSize: '0.88rem', fontFamily: 'monospace', color: 'var(--text-h)', marginBottom: '0.2rem' }}>
                <code>{s.formula}</code>
              </div>
            )}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        <STModalBadge symbol="T" content="BIO_PLAUSIBILITY_TRADE" title="Plausibilidad Biológica" />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Lo que ves:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            En modo Backprop, las conexiones se colorean según la magnitud real del gradiente (rojo brillante = mayor responsabilidad de <STTooltip term="error">error</STTooltip>).
            Las partículas animadas muestran el flujo de la <STTooltip term="derivada_del_error">derivada</STTooltip> de derecha a izquierda.
          </span>
          <br /><br />
          <strong style={{ color: '#eab308' }}>El problema de la <STTooltip term="plausibilidad_biologica">Plausibilidad Biológica</STTooltip>:</strong>{' '}
          <span style={{ color: 'var(--text-dim)' }}>
            El cerebro no envía señales de error hacia atrás por las mismas conexiones.
            Ningún mecanismo simétrico biológico conocido hace eso. Hinton reconoce este abismo ontológico: el algoritmo es efectivo computacionalmente pero una ficción biológica.
          </span>
        </div>
      )}
    </div>
  )
}

