import { useEffect, useRef, useState, useImperativeHandle } from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'
import { Check, ChevronRight } from 'lucide-react'
import STTooltip from '../components/st/STTooltip'
import STFloatingButton from '../components/st/STFloatingButton'

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

// ── Animated Neuron Diagram Canvas ────────────────────────────────────────────
function NeuronDiagram({ inputs, weights, sum, output, transferFn }) {
  const ref      = useRef(null)
  const propsRef = useRef({ inputs, weights, sum, output, transferFn })
  useEffect(() => { propsRef.current = { inputs, weights, sum, output, transferFn } })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let id
    const BW = 570, BH = 195  // base viewbox
    const PERIOD = 2.8
    let cW = 0, cH = 0

    const setSize = () => {
      const nw = canvas.offsetWidth || BW
      const nh = Math.round(nw * BH / BW)
      if (nw !== cW || nh !== cH) { cW = nw; cH = nh; canvas.width = cW; canvas.height = cH }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    function draw(ts) {
      if (!cW || !cH) { id = requestAnimationFrame(draw); return }
      const { inputs, weights, sum, output, transferFn } = propsRef.current
      const W = cW, H = cH
      const s = W / BW

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#0a0a1e'
      ctx.fillRect(0, 0, W, H)

      const n = inputs.length
      const iX = 65, sX = 275, fX = 400, oX = 510
      const sp = (BH - 44) / (n - 1)
      const cY = BH / 2
      const iYs = inputs.map((_, i) => 22 + i * sp)
      const col = TRANSFER_FNS[transferFn].color
      const t = (ts * 0.001) % PERIOD

      // glow intensities
      const sGlow = t >= 1.2 && t <= 2.0 ? Math.sin((t - 1.2) / 0.8 * Math.PI) * 0.8 : 0
      const fGlow = t >= 1.8 && t <= 2.5 ? Math.sin((t - 1.8) / 0.7 * Math.PI) * 0.8 : 0
      const oGlow = t >= 2.25 && t <= PERIOD ? Math.sin(Math.min((t - 2.25) / 0.4, 1) * Math.PI) * 0.8 : 0

      // ── weight lines ──
      inputs.forEach((_, i) => {
        const w = weights[i]
        const wc = w > 0 ? '#7c6dfa' : '#ef4444'
        const aw = Math.abs(w)
        ctx.beginPath()
        ctx.moveTo((iX + 16) * s, iYs[i] * s)
        ctx.lineTo((sX - 28) * s, cY * s)
        ctx.strokeStyle = wc
        ctx.lineWidth = Math.max(0.5, aw * 3.8) * s
        ctx.globalAlpha = 0.12 + aw * 0.72
        ctx.stroke()
        ctx.globalAlpha = 1
        const mxL = ((iX + 16 + sX - 28) / 2 + (i % 2 === 0 ? -12 : 12)) * s
        const myL = ((iYs[i] + cY) / 2) * s
        ctx.fillStyle = wc; ctx.font = `${8 * s}px monospace`; ctx.textAlign = 'center'
        ctx.fillText((w >= 0 ? '+' : '') + w.toFixed(2), mxL, myL - 2 * s)
      })

      // ── Σ→f() connector ──
      ctx.beginPath()
      ctx.moveTo((sX + 28) * s, cY * s); ctx.lineTo((fX - 26) * s, cY * s)
      ctx.strokeStyle = sGlow > 0 ? `rgba(167,139,250,${0.4 + sGlow * 0.6})` : '#555'
      ctx.lineWidth = (1.5 + sGlow * 1.5) * s; ctx.globalAlpha = 1; ctx.stroke()
      const smX = ((sX + 28 + fX - 26) / 2) * s
      ctx.fillStyle = sum >= 0 ? '#a78bfa' : '#ef4444'
      ctx.font = `${9.5 * s}px monospace`; ctx.textAlign = 'center'
      ctx.fillText((sum >= 0 ? '+' : '') + sum.toFixed(3), smX, (cY - 7) * s)
      ctx.fillStyle = '#444'; ctx.font = `${7 * s}px monospace`
      ctx.fillText('net input', smX, (cY + 15) * s)

      // ── f()→output connector ──
      ctx.beginPath()
      ctx.moveTo((fX + 26) * s, cY * s); ctx.lineTo((oX - 20) * s, cY * s)
      ctx.strokeStyle = fGlow > 0 ? col : col + '88'
      ctx.lineWidth = (1.5 + fGlow * 1.5) * s; ctx.stroke()

      // ── PULSE: inputs→Σ ──
      inputs.forEach((_, i) => {
        const w = weights[i]
        const pc = w > 0 ? '#a78bfa' : '#ff5555'
        const t0 = i * 0.13, t1 = t0 + 0.75
        const lt = t - t0
        if (lt >= 0 && lt <= (t1 - t0)) {
          const p = lt / (t1 - t0)
          const alpha = Math.sin(p * Math.PI)
          const px = ((iX + 16) + ((sX - 28) - (iX + 16)) * p) * s
          const py = (iYs[i] + (cY - iYs[i]) * p) * s
          ctx.beginPath(); ctx.arc(px, py, 7 * s, 0, Math.PI * 2)
          ctx.fillStyle = pc; ctx.globalAlpha = alpha * 0.92
          ctx.shadowColor = pc; ctx.shadowBlur = 14 * s
          ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1
        }
      })

      // ── PULSE: Σ→f() ──
      if (t >= 1.4 && t <= 1.85) {
        const p = (t - 1.4) / 0.45
        const px = ((sX + 28) + ((fX - 26) - (sX + 28)) * p) * s
        const alpha = Math.sin(p * Math.PI)
        ctx.beginPath(); ctx.arc(px, cY * s, 7 * s, 0, Math.PI * 2)
        ctx.fillStyle = '#c4b5fd'; ctx.globalAlpha = alpha * 0.92
        ctx.shadowColor = '#a78bfa'; ctx.shadowBlur = 14 * s
        ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1
      }

      // ── PULSE: f()→output ──
      if (t >= 1.85 && t <= 2.3) {
        const p = (t - 1.85) / 0.45
        const px = ((fX + 26) + ((oX - 20) - (fX + 26)) * p) * s
        const alpha = Math.sin(p * Math.PI)
        ctx.beginPath(); ctx.arc(px, cY * s, 7 * s, 0, Math.PI * 2)
        ctx.fillStyle = col; ctx.globalAlpha = alpha * 0.92
        ctx.shadowColor = col; ctx.shadowBlur = 14 * s
        ctx.fill(); ctx.shadowBlur = 0; ctx.globalAlpha = 1
      }

      // ── INPUT NODES ──
      inputs.forEach((_, i) => {
        const pulseT = t - i * 0.13
        const np = (pulseT >= 0 && pulseT <= 0.35) ? Math.sin(pulseT / 0.35 * Math.PI) * 0.55 : 0
        if (np > 0) {
          const w = weights[i]
          ctx.beginPath(); ctx.arc(iX * s, iYs[i] * s, 24 * s, 0, Math.PI * 2)
          ctx.fillStyle = w > 0 ? `rgba(124,109,250,${np * 0.3})` : `rgba(239,68,68,${np * 0.3})`
          ctx.shadowColor = w > 0 ? '#7c6dfa' : '#ef4444'; ctx.shadowBlur = 14 * s
          ctx.fill(); ctx.shadowBlur = 0
        }
        ctx.beginPath(); ctx.arc(iX * s, iYs[i] * s, 16 * s, 0, Math.PI * 2)
        ctx.fillStyle = '#0b0b1f'; ctx.strokeStyle = '#7c6dfa44'; ctx.lineWidth = s; ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#666'; ctx.font = `${7 * s}px monospace`; ctx.textAlign = 'center'
        ctx.fillText(`x${i + 1}=`, iX * s, (iYs[i] - 3) * s)
        ctx.fillStyle = '#a78bfa'; ctx.font = `${9 * s}px monospace`
        ctx.fillText(inputs[i], iX * s, (iYs[i] + 7) * s)
      })
      ctx.fillStyle = '#555'; ctx.font = `${7 * s}px monospace`; ctx.textAlign = 'center'
      ctx.fillText('dendrita', iX * s, (BH - 3) * s)

      // ── Σ NODE ──
      if (sGlow > 0) { ctx.shadowColor = '#7c6dfa'; ctx.shadowBlur = 20 * s * sGlow }
      ctx.beginPath(); ctx.arc(sX * s, cY * s, 28 * s, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(15,15,40,${0.9 + sGlow * 0.1})`
      ctx.strokeStyle = sGlow > 0 ? `rgba(167,139,250,${0.5 + sGlow * 0.5})` : '#7c6dfa'
      ctx.lineWidth = (2 + sGlow * 3) * s; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
      ctx.fillStyle = `rgba(167,139,250,${0.7 + sGlow * 0.3})`
      ctx.font = `${22 * s}px sans-serif`; ctx.textAlign = 'center'
      ctx.fillText('Σ', sX * s, (cY + 7) * s)
      ctx.fillStyle = '#555'; ctx.font = `${7.5 * s}px monospace`; ctx.textAlign = 'left'
      ctx.fillText(`+b=${BIAS}`, (sX + 20) * s, (cY + 36) * s)
      ctx.fillStyle = '#555'; ctx.font = `${7 * s}px monospace`; ctx.textAlign = 'center'
      ctx.fillText('suma ponderada', sX * s, (BH - 3) * s)

      // ── f() BOX ──
      if (fGlow > 0) { ctx.shadowColor = col; ctx.shadowBlur = 16 * s * fGlow }
      const bx = (fX - 26) * s, by = (cY - 24) * s, bw = 52 * s, bh = 48 * s, br = 9 * s
      ctx.beginPath()
      ctx.moveTo(bx + br, by); ctx.lineTo(bx + bw - br, by)
      ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br)
      ctx.lineTo(bx + bw, by + bh - br); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh)
      ctx.lineTo(bx + br, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br)
      ctx.lineTo(bx, by + br); ctx.quadraticCurveTo(bx, by, bx + br, by); ctx.closePath()
      ctx.fillStyle = '#0f0f28'
      ctx.strokeStyle = col; ctx.lineWidth = (2 + fGlow * 3) * s; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
      ctx.fillStyle = fGlow > 0 ? col : col + 'cc'
      ctx.font = `${14 * s}px monospace`; ctx.textAlign = 'center'
      ctx.fillText('f(·)', fX * s, (cY + 6) * s)
      ctx.fillStyle = '#555'; ctx.font = `${7 * s}px monospace`
      ctx.fillText('activación', fX * s, (BH - 3) * s)

      // ── OUTPUT NODE ──
      if (oGlow > 0) { ctx.shadowColor = col; ctx.shadowBlur = 24 * s * oGlow }
      ctx.beginPath(); ctx.arc(oX * s, cY * s, 20 * s, 0, Math.PI * 2)
      ctx.fillStyle = '#0b0b1f'
      ctx.strokeStyle = col; ctx.lineWidth = (2.8 + oGlow * 3) * s; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
      ctx.fillStyle = '#666'; ctx.font = `${7 * s}px monospace`; ctx.textAlign = 'center'
      ctx.fillText('y =', oX * s, (cY - 5) * s)
      ctx.fillStyle = oGlow > 0 ? col : col + 'cc'
      ctx.font = `bold ${11 * s}px monospace`
      ctx.fillText(output.toFixed(3), oX * s, (cY + 8) * s)
      ctx.fillStyle = '#555'; ctx.font = `${7 * s}px monospace`
      ctx.fillText('salida', oX * s, (BH - 3) * s)

      id = requestAnimationFrame(draw)
    }

    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); ro.disconnect() }
  }, [])

  return <canvas ref={ref} style={{ width: '100%', display: 'block' }} />
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
export default function S03_NeuronasArtificial({ profesorMode, ref }) {
  const [weights, setWeights]     = useState(INIT_WEIGHTS)
  const [transferFn, setTransferFn] = useState('sigmoid')

  // Step-by-step: track visited transfer functions (unlocks next in sequence)
  const [visitedFns, setVisitedFns] = useState(new Set(['sigmoid']))
  const fnOrder = ['sigmoid', 'relu', 'threshold']

  const handleFnClick = (key) => {
    setTransferFn(key)
    setVisitedFns(prev => {
      const next = new Set(prev)
      next.add(key)
      return next
    })
    // Sync stepRef so arrow-key nav stays coherent with clicks
    const idx = SUB_STEPS.findIndex(s => s?.type === 'fn' && s.key === key)
    if (idx >= 0 && idx + 1 > stepRef.current) stepRef.current = idx + 1
  }

  const nextFn = fnOrder.find(k => !visitedFns.has(k)) || null

  // Step-by-step: track visited bio pairs (unlocks next in sequence)
  const [visitedBio, setVisitedBio] = useState(new Set())
  const [selectedBio, setSelectedBio] = useState(null)

  const handleBioClick = (label) => {
    setSelectedBio(s => s === label ? null : label)
    setVisitedBio(prev => {
      const next = new Set(prev)
      next.add(label)
      return next
    })
    // Sync stepRef
    const idx = SUB_STEPS.findIndex(s => s?.type === 'bio' && s.key === label)
    if (idx >= 0 && idx + 1 > stepRef.current) stepRef.current = idx + 1
  }

  const nextBio = BIO_PAIRS.find(b => !visitedBio.has(b.bio))?.bio || null

  // ── Sub-step navigation via arrow keys / remote ──
  const SUB_STEPS = [
    null,                                       // step 0: initial state
    { type: 'fn',  key: 'sigmoid' },
    { type: 'fn',  key: 'relu' },
    { type: 'fn',  key: 'threshold' },
    ...BIO_PAIRS.map(b => ({ type: 'bio', key: b.bio })),
  ]
  const stepRef = useRef(0)

  const applyStep = (step) => {
    if (!step) {
      // Reset to initial
      setTransferFn('sigmoid')
      setSelectedBio(null)
      return
    }
    if (step.type === 'fn') {
      setTransferFn(step.key)
      setVisitedFns(prev => { const n = new Set(prev); n.add(step.key); return n })
    } else if (step.type === 'bio') {
      setSelectedBio(step.key)
      setVisitedBio(prev => { const n = new Set(prev); n.add(step.key); return n })
    }
  }

  useImperativeHandle(ref, () => ({
    advanceStep() {
      if (stepRef.current >= SUB_STEPS.length - 1) return false
      stepRef.current++
      applyStep(SUB_STEPS[stepRef.current])
      return true
    },
    retreatStep() {
      if (stepRef.current <= 0) return false
      stepRef.current--
      applyStep(SUB_STEPS[stepRef.current])
      return true
    },
  }))

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
            {Object.entries(TRANSFER_FNS).map(([key, { label, color: c }]) => {
              const active = transferFn === key
              const done   = visitedFns.has(key) && !active
              const isNext = key === nextFn
              return (
                <button
                  key={key}
                  onClick={() => handleFnClick(key)}
                  style={{
                    flex: 1, padding: '0.4rem 0.2rem', borderRadius: '7px',
                    border: `1px solid ${active ? c : done ? c + '66' : isNext ? c + '55' : 'var(--border)'}`,
                    background: active ? `${c}22` : 'var(--bg-3)',
                    color: active ? c : done ? c + 'aa' : 'var(--text-dim)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isNext && !active ? `0 0 6px ${c}33` : 'none',
                  }}
                >
                  {done && (
                    <span style={{ marginRight: '0.2rem', display: 'inline-flex', verticalAlign: 'middle' }}>
                      <Check size={11} strokeWidth={2.4} />
                    </span>
                  )}
                  {isNext && !active && !done && (
                    <span style={{ marginRight: '0.2rem', display: 'inline-flex', verticalAlign: 'middle' }}>
                      <ChevronRight size={11} strokeWidth={2.4} />
                    </span>
                  )}
                  {label}
                </button>
              )
            })}
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
          {BIO_PAIRS.map((b) => {
            const active = selectedBio === b.bio
            const done   = visitedBio.has(b.bio)
            const isNext = b.bio === nextBio
            return (
              <div key={b.bio}
                onClick={() => handleBioClick(b.bio)}
                style={{
                  flex: '1 1 130px',
                  background: active ? `${b.color}11` : 'var(--bg-3)',
                  borderRadius: '8px',
                  border: `1px solid ${active ? b.color + '88' : done ? b.color + '44' : b.color + '33'}`,
                  borderTop: `3px solid ${b.color}`,
                  padding: '0.45rem 0.6rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  boxShadow: isNext && !active ? `0 0 6px ${b.color}33` : 'none',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {done && !active && (
                    <span style={{ display: 'inline-flex', color: b.color }}>
                      <Check size={11} strokeWidth={2.4} />
                    </span>
                  )}
                  {isNext && !active && !done && (
                    <span style={{ display: 'inline-flex', color: b.color }}>
                      <ChevronRight size={11} strokeWidth={2.4} />
                    </span>
                  )}
                  <span style={{ fontSize: '0.7rem', color: b.color, fontWeight: 600 }}>{b.bio}</span>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#555', marginBottom: '0.28rem' }}>{b.bio_sub}</div>
                {(active || done) && (
                  <div style={{ borderTop: `1px solid ${b.color}22`, paddingTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text)', fontFamily: 'monospace' }}>→ {b.art}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{b.art_sub}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <STFloatingButton slideId="S03" />

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
