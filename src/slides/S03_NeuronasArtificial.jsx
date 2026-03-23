import { useEffect, useRef, useState } from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'
import STTooltip from '../components/st/STTooltip'
import STModalBadge from '../components/st/STModalBadge'

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
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">La neurona artificial</div>
        <div className="section-subtitle">El análogo formal</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px' }}>
        "Hinton no copia la <STTooltip term="neurona_biologica">neurona</STTooltip> — la <em>idealiza</em>. Y esa <STTooltip term="idealizacion">idealización</STTooltip>,
        aunque burda, es poderosa. ¿Qué se gana? ¿Qué se pierde?"
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1100px' }}>
        {/* Diagrama de la unidad */}
        <div className="st-card" style={{ flex: '1 1 350px', minWidth: '320px', padding: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1rem', fontFamily: 'monospace' }}>
            <STTooltip term="neurona_artificial">UNIDAD ARTIFICIAL</STTooltip> — ajusta los <STTooltip term="peso">pesos</STTooltip>
          </div>
          {INPUTS.map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '1rem', color: 'var(--text-dim)', width: '30px', fontFamily: 'monospace' }}>
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
                style={{ flex: 1, accentColor: weights[i] > 0 ? '#7c6dfa' : '#ef4444', height: '6px' }}
              />
              <span style={{
                fontSize: '1rem',
                width: '60px',
                textAlign: 'right',
                fontFamily: 'monospace',
                color: weights[i] > 0 ? 'var(--accent-2)' : 'var(--red)',
              }}>
                w={weights[i].toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            {profesorMode && (
              <div style={{ fontSize: '1rem', fontFamily: 'monospace', color: 'var(--text-dim)', marginBottom: '0.8rem' }}>
                <InlineMath math={`\\text{entrada total} = \\sum_i x_i w_i + b = ${sum.toFixed(3)}`} />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-dim)' }}><STTooltip term="entrada_total">Entrada total:</STTooltip></span>
              <span style={{ color: 'var(--cyan)', fontFamily: 'monospace' }}>{sum.toFixed(3)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginTop: '0.4rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Salida (<STTooltip term="sigmoide">{transferFn}</STTooltip>):</span>
              <span style={{ color: 'var(--accent-2)', fontFamily: 'monospace', fontWeight: 700 }}>
                {output.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Panel derecho: función de transferencia */}
        <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Botones */}
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            {Object.entries(TRANSFER_FNS).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setTransferFn(key)}
                style={{
                  flex: 1,
                  padding: '0.6rem',
                  borderRadius: '8px',
                  border: `1px solid ${transferFn === key ? color : 'var(--border)'}`,
                  background: transferFn === key ? `${color}22` : 'var(--bg-3)',
                  color: transferFn === key ? color : 'var(--text-dim)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
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
            borderRadius: '12px',
            overflow: 'hidden',
            height: '240px',
            position: 'relative',
          }}>
            <canvas ref={fnCanvasRef} style={{ width: '100%', height: '100%' }} />
          </div>

          <div style={{ fontSize: '1rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            {TRANSFER_FNS[transferFn].desc}
          </div>

          <STModalBadge symbol="T" content="IDEALIZATION_TRADE" title="Trade-off Epistémico" />

          {profesorMode && (
            <div className="st-card" style={{ fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--yellow)' }}>Lo que se pierde:</strong> geometría del axón, 
              química sináptica, temporalidad, morfología. Hinton lo llama explícitamente 
              "<STTooltip term="idealizacion">idealización</STTooltip> burda" — pero es lo que permite el cálculo tratable de derivadas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
