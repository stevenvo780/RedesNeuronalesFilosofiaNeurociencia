import { useEffect, useRef, useState } from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'
import STTooltip from '../components/st/STTooltip'
import STModalBadge from '../components/st/STModalBadge'

const INPUTS      = [0.8, 0.3, 0.9, 0.1, 0.6]
const INIT_WEIGHTS = [0.5, -0.3, 0.7, 0.2, -0.5]
const BIAS = 0.1

function sigmoid(x)   { return 1 / (1 + Math.exp(-x)) }
function relu(x)      { return Math.max(0, x) }
function threshold(x) { return x >= 0 ? 1 : 0 }

const TRANSFER_FNS = {
  sigmoid:   { fn: sigmoid,   label: 'Sigmoide σ', color: '#7c6dfa', desc: 'Salida continua 0→1. Diferenciable en todo punto — base del backprop.' },
  relu:      { fn: relu,      label: 'ReLU',        color: '#22c55e', desc: 'max(0,x). Rápido, evita gradientes saturados. Núcleo de redes modernas.' },
  threshold: { fn: threshold, label: 'Umbral',      color: '#eab308', desc: 'Todo-o-nada. Análogo al potencial de acción biológico (McCulloch-Pitts 1943).' },
}

const BIO_PAIRS = [
  { bio: 'Dendrita',       bio_sub: 'recibe señales',         art: 'Entrada xᵢ',          art_sub: 'valor numérico',          color: '#7c6dfa' },
  { bio: 'Sinapsis',       bio_sub: 'fuerza de conexión',     art: 'Peso wᵢ',              art_sub: '+excitador / −inhibidor', color: '#a78bfa' },
  { bio: 'Colina axónica', bio_sub: 'integra entradas',       art: 'Suma Σ xᵢwᵢ+b',       art_sub: 'integración lineal',      color: '#06b6d4' },
  { bio: 'Umbral de disparo', bio_sub: '~−55 mV',             art: 'Activación f(·)',       art_sub: 'sigmoide / ReLU / umbral',color: '#22c55e' },
  { bio: 'Tasa de disparo', bio_sub: 'Hz de potenciales',     art: 'Salida y',              art_sub: 'valor 0→1',              color: '#10b981' },
]

// ── SVG Neuron Diagram ─────────────────────────────────────────────────────────
function NeuronDiagram({ inputs, weights, sum, output, transferFn }) {
  const color = TRANSFER_FNS[transferFn].color
  const n = inputs.length
  const svgH = 195
  const inputX = 65, sumX = 275, fnX = 400, outX = 510
  const spacing = (svgH - 44) / (n - 1)
  const centerY = svgH / 2
  const inputYs = inputs.map((_, i) => 22 + i * spacing)

  return (
    <svg viewBox={`0 0 570 ${svgH}`} style={{ width: '100%', height: 'auto', overflow: 'visible', display: 'block' }}>
      <defs>
        <marker id="arrowGray3"  markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill="#555" />
        </marker>
        <marker id={`arrowColor3-${transferFn}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 z" fill={color} />
        </marker>
      </defs>

      {/* ── Input→Σ weight lines ── */}
      {inputs.map((x, i) => {
        const w = weights[i]
        const wColor = w > 0 ? '#7c6dfa' : '#ef4444'
        const absW = Math.abs(w)
        const midX = (inputX + 16 + sumX - 28) / 2 + (i % 2 === 0 ? -12 : 12)
        const midY = (inputYs[i] + centerY) / 2
        return (
          <g key={i}>
            <line
              x1={inputX + 16} y1={inputYs[i]}
              x2={sumX - 28}   y2={centerY}
              stroke={wColor}
              strokeWidth={Math.max(0.5, absW * 3.8)}
              strokeOpacity={0.12 + absW * 0.72}
            />
            <text x={midX} y={midY - 2}
              fill={wColor} fontSize="8" textAnchor="middle" fontFamily="monospace" opacity={0.9}>
              {w >= 0 ? '+' : ''}{w.toFixed(2)}
            </text>
          </g>
        )
      })}

      {/* ── Σ → f() ── */}
      <line
        x1={sumX + 28} y1={centerY} x2={fnX - 26} y2={centerY}
        stroke="#666" strokeWidth={2} markerEnd="url(#arrowGray3)"
      />
      <text x={(sumX + 28 + fnX - 26) / 2} y={centerY - 7}
        fill={sum >= 0 ? '#a78bfa' : '#ef4444'} fontSize="9.5" textAnchor="middle" fontFamily="monospace">
        {sum >= 0 ? '+' : ''}{sum.toFixed(3)}
      </text>
      <text x={(sumX + 28 + fnX - 26) / 2} y={centerY + 15}
        fill="#444" fontSize="7" textAnchor="middle" fontFamily="monospace">net input</text>

      {/* ── f() → output ── */}
      <line
        x1={fnX + 26} y1={centerY} x2={outX - 20} y2={centerY}
        stroke={color} strokeWidth={2.5} markerEnd={`url(#arrowColor3-${transferFn})`}
      />

      {/* ── Input nodes ── */}
      {inputs.map((_, i) => (
        <g key={i}>
          <circle cx={inputX} cy={inputYs[i]} r={16} fill="#0b0b1f" stroke="#7c6dfa33" strokeWidth={1} />
          <text x={inputX} y={inputYs[i] - 3}
            fill="#555" fontSize="7" textAnchor="middle" fontFamily="monospace">x{i+1}=</text>
          <text x={inputX} y={inputYs[i] + 7}
            fill="#a78bfa" fontSize="9" textAnchor="middle" fontFamily="monospace">{x}</text>
        </g>
      ))}
      <text x={inputX} y={svgH - 3} fill="#444" fontSize="7" textAnchor="middle" fontFamily="monospace">dendrita</text>

      {/* ── Σ node ── */}
      <circle cx={sumX} cy={centerY} r={28} fill="#0f0f28" stroke="#7c6dfa" strokeWidth={2} />
      <text x={sumX} y={centerY + 7}
        fill="#a78bfa" fontSize="22" textAnchor="middle">Σ</text>
      <text x={sumX + 20} y={centerY + 36}
        fill="#555" fontSize="7.5" textAnchor="start" fontFamily="monospace">+b={BIAS}</text>
      <text x={sumX} y={svgH - 3} fill="#444" fontSize="7" textAnchor="middle" fontFamily="monospace">suma ponderada</text>

      {/* ── f() box ── */}
      <rect x={fnX - 26} y={centerY - 24} width={52} height={48} rx={9}
        fill="#0f0f28" stroke={color} strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 4px ${color}55)` }} />
      <text x={fnX} y={centerY + 6}
        fill={color} fontSize="14" textAnchor="middle" fontFamily="monospace">f(·)</text>
      <text x={fnX} y={svgH - 3} fill="#444" fontSize="7" textAnchor="middle" fontFamily="monospace">activación</text>

      {/* ── Output node ── */}
      <circle cx={outX} cy={centerY} r={20} fill="#0b0b1f" stroke={color} strokeWidth={2.8}
        style={{ filter: `drop-shadow(0 0 8px ${color}77)` }} />
      <text x={outX} y={centerY - 5}
        fill="#666" fontSize="7" textAnchor="middle" fontFamily="monospace">y =</text>
      <text x={outX} y={centerY + 8}
        fill={color} fontSize="11" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
        {output.toFixed(3)}
      </text>
      <text x={outX} y={svgH - 3} fill="#444" fontSize="7" textAnchor="middle" fontFamily="monospace">salida</text>
    </svg>
  )
}

// ── Activation function graph ──────────────────────────────────────────────────
function ActivationGraph({ transferFn, sum }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth, h = canvas.offsetHeight
    canvas.width = w * dpr; canvas.height = h * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = '#16162a'
    ctx.lineWidth = 1
    ;[0.25, 0.5, 0.75].forEach(f => {
      ctx.beginPath(); ctx.moveTo(f * w, 0); ctx.lineTo(f * w, h); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, f * h); ctx.lineTo(w, f * h); ctx.stroke()
    })

    // Axes
    ctx.strokeStyle = '#2a2a44'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke()

    // Axis labels
    ctx.fillStyle = '#333'
    ctx.font = '8px monospace'
    ctx.textAlign = 'right'
    ctx.fillText('+1', w / 2 - 3, 10)
    ctx.fillText('0',  w / 2 - 3, h / 2 - 2)

    // All functions
    Object.entries(TRANSFER_FNS).forEach(([key, { fn, color }]) => {
      const active = key === transferFn
      ctx.strokeStyle = active ? color : '#222233'
      ctx.lineWidth = active ? 2.5 : 1
      ctx.globalAlpha = active ? 1 : 0.5
      ctx.beginPath()
      for (let px = 0; px <= w; px++) {
        const x  = (px / w - 0.5) * 8
        const y  = fn(x)
        const py = h / 2 - y * (h / 2.8)
        px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    })

    // Current point marker
    const { fn, color } = TRANSFER_FNS[transferFn]
    const mx = w / 2 + (sum / 4) * (w / 2)
    const my = h / 2 - fn(sum) * (h / 2.8)
    ctx.beginPath()
    ctx.arc(Math.max(5, Math.min(w - 5, mx)), Math.max(5, Math.min(h - 5, my)), 6, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.shadowBlur = 0

    // Net input label
    ctx.fillStyle = '#555'
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('entrada neta', w / 2, h - 4)
  }, [transferFn, sum])

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ── Main slide ─────────────────────────────────────────────────────────────────
export default function S03_NeuronasArtificial({ profesorMode }) {
  const [weights, setWeights]     = useState(INIT_WEIGHTS)
  const [transferFn, setTransferFn] = useState('sigmoid')

  const sum    = INPUTS.reduce((acc, x, i) => acc + x * weights[i], BIAS)
  const output = TRANSFER_FNS[transferFn].fn(sum)
  const color  = TRANSFER_FNS[transferFn].color

  return (
    <div className="section-slide" style={{ gap: '0.9rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">La neurona artificial</div>
        <div className="section-subtitle">Idealización formal del cómputo neuronal</div>
      </div>

      <div className="quote" style={{ maxWidth: '860px' }}>
        "Hinton no copia la <STTooltip term="neurona_biologica">neurona</STTooltip> — la <em>idealiza</em>.
        Esa <STTooltip term="idealizacion">idealización burda</STTooltip> es poderosa. ¿Qué se gana? ¿Qué se pierde?"
      </div>

      {/* ── SVG diagram ── */}
      <div style={{
        width: '100%', maxWidth: '880px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '1rem 1.5rem',
      }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.55rem', letterSpacing: '0.1em' }}>
          UNIDAD McCULLOCH-PITTS — DIAGRAMA DE CÓMPUTO INTERACTIVO
        </div>
        <NeuronDiagram inputs={INPUTS} weights={weights} sum={sum} output={output} transferFn={transferFn} />
        <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          {profesorMode
            ? <InlineMath math={`y = f\\!\\left(\\sum_{i=1}^{5} x_i w_i + b\\right) = f(${sum.toFixed(3)}) = ${output.toFixed(3)}`} />
            : <>y = f( <span style={{ color }}>Σ xᵢwᵢ</span> + b ) = f(<span style={{ color }}>{sum.toFixed(3)}</span>) = <span style={{ color, fontWeight: 700 }}>{output.toFixed(3)}</span></>
          }
        </div>
      </div>

      {/* ── Two columns: sliders | activation graph ── */}
      <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '880px', flexWrap: 'wrap' }}>
        {/* Weight sliders */}
        <div className="st-card" style={{ flex: '1 1 290px', padding: '1rem 1.2rem' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.7rem', letterSpacing: '0.08em' }}>
            <STTooltip term="peso">PESOS SINÁPTICOS</STTooltip> — arrastra para cambiar la influencia de cada entrada
          </div>
          {INPUTS.map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#555', width: '38px', fontFamily: 'monospace', flexShrink: 0 }}>
                x{i+1}={x}
              </span>
              <input
                type="range" min="-1" max="1" step="0.05"
                value={weights[i]}
                onChange={e => {
                  const nw = [...weights]; nw[i] = parseFloat(e.target.value); setWeights(nw)
                }}
                style={{ flex: 1, accentColor: weights[i] > 0 ? '#7c6dfa' : '#ef4444', height: '4px', cursor: 'pointer' }}
              />
              <span style={{
                fontSize: '0.72rem', width: '52px', textAlign: 'right', fontFamily: 'monospace',
                color: weights[i] > 0 ? '#a78bfa' : weights[i] < 0 ? '#ef4444' : '#555',
                fontWeight: Math.abs(weights[i]) > 0.5 ? 700 : 400,
              }}>
                w={weights[i].toFixed(2)}
              </span>
            </div>
          ))}
          <div style={{ marginTop: '0.7rem', paddingTop: '0.55rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>
              <STTooltip term="entrada_total">Entrada total Σ:</STTooltip>
            </span>
            <span style={{ fontFamily: 'monospace', color: sum >= 0 ? '#a78bfa' : '#ef4444', fontWeight: 700 }}>
              {sum.toFixed(3)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: '0.25rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>Salida f({sum.toFixed(2)}):</span>
            <span style={{ fontFamily: 'monospace', color, fontWeight: 700 }}>{output.toFixed(3)}</span>
          </div>
        </div>

        {/* Activation graph + selector */}
        <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {Object.entries(TRANSFER_FNS).map(([key, { label, color: c }]) => (
              <button
                key={key}
                onClick={() => setTransferFn(key)}
                style={{
                  flex: 1, padding: '0.4rem 0.2rem', borderRadius: '7px',
                  border: `1px solid ${transferFn === key ? c : 'var(--border)'}`,
                  background: transferFn === key ? `${c}22` : 'var(--bg-3)',
                  color: transferFn === key ? c : 'var(--text-dim)',
                  fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: '155px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <ActivationGraph transferFn={transferFn} sum={sum} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <span style={{ color }}>{TRANSFER_FNS[transferFn].label}:</span>{' '}
            {TRANSFER_FNS[transferFn].desc}
          </div>
        </div>
      </div>

      {/* ── Biological analogy ── */}
      <div style={{ width: '100%', maxWidth: '880px' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.45rem', letterSpacing: '0.08em' }}>
          ANALOGÍA BIOLÓGICA — <STTooltip term="idealizacion">lo que se conserva y lo que se pierde</STTooltip>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          {BIO_PAIRS.map(b => (
            <div key={b.bio} style={{
              flex: '1 1 130px',
              background: 'var(--bg-3)', borderRadius: '8px',
              border: `1px solid ${b.color}33`, borderTop: `3px solid ${b.color}`,
              padding: '0.45rem 0.6rem',
            }}>
              <div style={{ fontSize: '0.7rem', color: b.color, fontWeight: 600 }}>{b.bio}</div>
              <div style={{ fontSize: '0.6rem', color: '#555', marginBottom: '0.28rem' }}>{b.bio_sub}</div>
              <div style={{ borderTop: `1px solid ${b.color}22`, paddingTop: '0.25rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text)', fontFamily: 'monospace' }}>→ {b.art}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{b.art_sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        <STModalBadge symbol="T" content="IDEALIZATION_TRADE" title="Trade-off Epistémico" />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '880px', width: '100%', fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--yellow)' }}>Lo que se pierde:</strong>{' '}
          geometría del axón, química sináptica, temporalidad, morfología dendrítica, neuromodulación.
          Hinton lo llama explícitamente "<STTooltip term="idealizacion">idealización burda</STTooltip>" —
          pero es lo que permite calcular derivadas de forma tratable.
          McCulloch &amp; Pitts (1943) proponen la unidad formal. Rosenblatt (1958) agrega el aprendizaje.
          Rumelhart, Hinton &amp; Williams (1986) cierran el ciclo con retropropagación.
        </div>
      )}
    </div>
  )
}
