import { useEffect, useRef, useState } from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'

const INPUTS = [0.8, 0.3, 0.9, 0.1, 0.6]
const INIT_WEIGHTS = [0.5, -0.3, 0.7, 0.2, -0.5]
const BIAS = 0.1

function sigmoid(x) { return 1 / (1 + Math.exp(-x)) }
function linear(x) { return x }
function threshold(x) { return x >= 0 ? 1 : 0 }

const TRANSFER_FNS = {
  sigmoid: { fn: sigmoid, label: 'Sigmoide', color: '#7c6dfa', desc: 'Salida suave entre 0 y 1. Permite gradientes.' },
  linear: { fn: linear, label: 'Lineal', color: '#06b6d4', desc: 'Salida proporcional a la entrada.' },
  threshold: { fn: threshold, label: 'Umbral', color: '#eab308', desc: 'Disparo todo-o-nada. Binario.' },
}

export default function S03_NeuronasArtificial({ profesorMode }) {
  const [weights, setWeights] = useState(INIT_WEIGHTS)
  const [transferFn, setTransferFn] = useState('sigmoid')
  const fnCanvasRef = useRef(null)

  const sum = INPUTS.reduce((acc, x, i) => acc + x * weights[i], BIAS)
  const output = TRANSFER_FNS[transferFn].fn(sum)

  useEffect(() => {
    const canvas = fnCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth * window.devicePixelRatio
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio
    canvas.style.width = canvas.offsetWidth + 'px'
    canvas.style.height = canvas.offsetHeight + 'px'
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    const w = canvas.offsetWidth, h = canvas.offsetHeight

    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = '#2a2a38'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke()

    Object.entries(TRANSFER_FNS).forEach(([key, { fn, color }]) => {
      ctx.strokeStyle = key === transferFn ? color : '#2a2a38'
      ctx.lineWidth = key === transferFn ? 2.5 : 1
      ctx.beginPath()
      for (let px = 0; px < w; px++) {
        const x = (px / w - 0.5) * 10
        const y = fn(x)
        const py = h / 2 - y * (h / 2.5)
        px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()
    })

    // Current input marker
    const markerX = w / 2 + (sum / 5) * (w / 2)
    const markerY = h / 2 - TRANSFER_FNS[transferFn].fn(sum) * (h / 2.5)
    ctx.beginPath()
    ctx.arc(Math.min(Math.max(markerX, 4), w - 4), Math.min(Math.max(markerY, 4), h - 4), 5, 0, Math.PI * 2)
    ctx.fillStyle = TRANSFER_FNS[transferFn].color
    ctx.fill()
  }, [weights, transferFn, sum])

  return (
    <div className="section-slide" style={{ gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">La neurona artificial</div>
        <div className="section-subtitle">El análogo formal</div>
      </div>

      <div className="quote" style={{ maxWidth: '600px' }}>
        "Hinton no copia la neurona — la <em>idealiza</em>. Y esa idealización,
        aunque burda, es poderosa. ¿Qué se gana? ¿Qué se pierde?"
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '820px' }}>
        {/* Diagrama de la unidad */}
        <div className="st-card" style={{ flex: '1 1 280px', minWidth: '260px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
            UNIDAD ARTIFICIAL — ajusta los pesos
          </div>
          {INPUTS.map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', width: '20px', fontFamily: 'monospace' }}>
                x{i + 1}={x}
              </span>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={weights[i]}
                onChange={e => {
                  const nw = [...weights]
                  nw[i] = parseFloat(e.target.value)
                  setWeights(nw)
                }}
                style={{ flex: 1, accentColor: weights[i] > 0 ? '#7c6dfa' : '#ef4444' }}
              />
              <span style={{
                fontSize: '0.75rem',
                width: '40px',
                textAlign: 'right',
                fontFamily: 'monospace',
                color: weights[i] > 0 ? 'var(--accent-2)' : 'var(--red)',
              }}>
                w={weights[i].toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
            {profesorMode && (
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                <InlineMath math={`\\text{entrada total} = \\sum_i x_i w_i + b = ${sum.toFixed(3)}`} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Entrada total:</span>
              <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{sum.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '0.2rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Salida ({transferFn}):</span>
              <span style={{ color: 'var(--accent-2)', fontFamily: 'monospace', fontWeight: 700 }}>
                {output.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Panel derecho: función de transferencia */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {Object.entries(TRANSFER_FNS).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setTransferFn(key)}
                style={{
                  flex: 1,
                  padding: '0.35rem',
                  borderRadius: '6px',
                  border: `1px solid ${transferFn === key ? color : 'var(--border)'}`,
                  background: transferFn === key ? `${color}22` : 'var(--bg-3)',
                  color: transferFn === key ? color : 'var(--text-dim)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Canvas fn */}
          <div style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
            height: '140px',
            position: 'relative',
          }}>
            <canvas ref={fnCanvasRef} style={{ width: '100%', height: '100%' }} />
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {TRANSFER_FNS[transferFn].desc}
          </div>

          {profesorMode && (
            <div className="st-card" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--yellow)' }}>Lo que se pierde:</strong> geometría del axón,
              química sináptica, temporalidad, morfología. Hinton lo llama explícitamente
              "idealización burda" — pero productiva.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
