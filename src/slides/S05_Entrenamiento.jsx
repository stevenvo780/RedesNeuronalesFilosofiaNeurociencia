import { useState, useRef, useEffect, useCallback } from 'react'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import { useNeuralNet } from '../hooks/useNeuralNet'
import STTooltip from '../components/st/STTooltip'
import STModalBadge from '../components/st/STModalBadge'

const PHASES = [
  { id: 'presentar', label: '1. PRESENTAR',   color: '#22c55e', desc: 'Un punto (x,y) del espacio espiral entra a la red. La capa de entrada se activa.' },
  { id: 'evaluar',   label: '2. EVALUAR',     color: '#ef4444', desc: 'La red produce una predicción. Se mide el error respecto a la clase real.' },
  { id: 'calcular',  label: '3. CALCULAR EP', color: '#eab308', desc: 'Se calcula el gradiente de la pérdida respecto a cada peso — la responsabilidad de cada conexión.' },
  { id: 'actualizar',label: '4. ACTUALIZAR',  color: '#7c6dfa', desc: 'Los pesos se ajustan en la dirección opuesta al gradiente. La frontera se mueve.' },
]

// ── Decision boundary canvas ──────────────────────────────────────────────────
function BoundaryCanvas({ gridPreds, gridRes, data, phase }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !gridPreds?.length || !data) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    const offscreen = new OffscreenCanvas(gridRes, gridRes)
    const oct = offscreen.getContext('2d')
    const imageData = oct.createImageData(gridRes, gridRes)

    for (let i = 0; i < gridRes * gridRes; i++) {
      const p = gridPreds[i] ?? 0.5
      imageData.data[i * 4 + 0] = Math.round(120 * p + 20)
      imageData.data[i * 4 + 1] = Math.round(30 + 80 * (1 - Math.abs(p - 0.5) * 2))
      imageData.data[i * 4 + 2] = Math.round(120 * (1 - p) + 20)
      imageData.data[i * 4 + 3] = 200
    }
    oct.putImageData(imageData, 0, 0)

    canvas.width = W; canvas.height = H
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(offscreen, 0, 0, W, H)

    // Decision boundary line (0.5 contour) — approximate with thick highlight
    for (let i = 0; i < gridRes * gridRes; i++) {
      const p = gridPreds[i] ?? 0.5
      if (Math.abs(p - 0.5) < 0.04) {
        const row = Math.floor(i / gridRes)
        const col = i % gridRes
        const px = (col / gridRes) * W
        const py = (row / gridRes) * H
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillRect(px, py, W / gridRes + 1, H / gridRes + 1)
      }
    }

    // Data points
    if (data.X) {
      data.X.forEach(([x, y_], i) => {
        const px = ((x + 1) / 2) * W
        const py = ((y_ + 1) / 2) * H
        const isClass1 = data.y[i] === 1
        ctx.beginPath()
        ctx.arc(px, py, 4, 0, Math.PI * 2)
        ctx.fillStyle = isClass1 ? 'rgba(124,109,250,0.9)' : 'rgba(239,68,68,0.9)'
        ctx.fill()
        ctx.strokeStyle = '#0a0a1a'
        ctx.lineWidth = 0.8
        ctx.stroke()
      })
    }

    // Phase overlay indicator
    ctx.fillStyle = PHASES[phase]?.color + '22' ?? 'transparent'
    ctx.fillRect(0, 0, W, H)

  }, [gridPreds, gridRes, data, phase])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', top: 6, left: 8,
        fontSize: '0.62rem', color: '#ffffff88', fontFamily: 'monospace',
        background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '3px',
      }}>
        frontera de decisión
      </div>
      <div style={{
        position: 'absolute', bottom: 6, left: 8, display: 'flex', gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(239,68,68,0.9)', fontFamily: 'monospace' }}>● clase 0</span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(124,109,250,0.9)', fontFamily: 'monospace' }}>● clase 1</span>
      </div>
    </div>
  )
}

// ── Loss curve ────────────────────────────────────────────────────────────────
function LossCurve({ lossHistory, accHistory }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || lossHistory.length < 2) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#1e1e2e'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = H * i / 4
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    const drawCurve = (data, color, fillColor) => {
      if (data.length < 2) return
      ctx.strokeStyle = color; ctx.lineWidth = 2
      ctx.beginPath()
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * W
        const y = H - v * H
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
      ctx.fillStyle = fillColor; ctx.fill()
    }

    drawCurve(lossHistory, '#ef4444', 'rgba(239,68,68,0.08)')
    drawCurve(accHistory,  '#22c55e', 'rgba(34,197,94,0.07)')

    // Labels
    const last = lossHistory[lossHistory.length - 1]
    const lastAcc = accHistory[accHistory.length - 1]
    ctx.font = '9px monospace'; ctx.textAlign = 'right'
    ctx.fillStyle = '#ef4444'
    ctx.fillText(`loss: ${last?.toFixed(3)}`, W - 4, 12)
    ctx.fillStyle = '#22c55e'
    ctx.fillText(`acc: ${(lastAcc * 100)?.toFixed(1)}%`, W - 4, 24)
  }, [lossHistory, accHistory])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}

// ── Main slide ────────────────────────────────────────────────────────────────
export default function S05_Entrenamiento({ profesorMode }) {
  const net = useNeuralNet({ hiddenSizes: [8, 8], gridRes: 50 })

  const [phase, setPhase]           = useState(0)
  const [lossHistory, setLossH]     = useState([1.0])
  const [accHistory, setAccH]       = useState([0.5])
  const phaseTimerRef               = useRef(null)

  // Keep loss/acc history in sync with real values
  useEffect(() => {
    if (net.loss) setLossH(h => [...h.slice(-79), net.loss])
    if (net.accuracy) setAccH(h => [...h.slice(-79), net.accuracy])
  }, [net.epoch])

  // Auto-advance phase while training
  useEffect(() => {
    clearInterval(phaseTimerRef.current)
    if (net.training) {
      phaseTimerRef.current = setInterval(() => setPhase(p => (p + 1) % 4), 900)
    }
    return () => clearInterval(phaseTimerRef.current)
  }, [net.training])

  const current = PHASES[phase]

  return (
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title"><STTooltip term="aprendizaje_supervisado">Entrenamiento supervisado</STTooltip></div>
        <div className="section-subtitle">Red en vivo ajustando topología de decisión</div>
      </div>

      {/* Main layout: boundary + curve */}
      <div style={{ display: 'flex', gap: '1.5rem', width: '100%', maxWidth: '1200px', height: '400px' }}>
        {/* Decision boundary */}
        <div style={{
          flex: '1.5', background: 'var(--bg-3)', borderRadius: '12px',
          border: '1px solid var(--border)', overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
        }}>
          <BoundaryCanvas gridPreds={net.gridPreds} gridRes={net.gridRes} data={net.data} phase={phase} />
        </div>

        {/* Loss curve + stats */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            flex: 1, background: 'var(--bg-3)', borderRadius: '12px',
            border: '1px solid var(--border)', overflow: 'hidden',
            position: 'relative',
          }}>
            <LossCurve lossHistory={lossHistory} accHistory={accHistory} />
            <div style={{ position: 'absolute', top: 10, left: 14, fontSize: '0.9rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              curva de <STTooltip term="error">aprendizaje (loss)</STTooltip>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '1rem 1.5rem',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem',
          }}>
            {[
              { label: 'época', value: net.epoch, color: '#7c6dfa' },
              { label: 'error', value: net.loss?.toFixed(4), color: '#ef4444' },
              { label: 'precisión', value: `${((net.accuracy ?? 0.5) * 100).toFixed(1)}%`, color: '#22c55e' },
              { label: 'estado', value: net.training ? 'entrenando' : 'pausado', color: net.training ? '#22c55e' : '#888' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.2rem' }}>{s.label}</div>
                <div style={{ fontSize: '1.2rem', color: s.color, fontWeight: 600, fontFamily: 'monospace' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div style={{ display: 'flex', gap: '0.8rem', width: '100%', maxWidth: '1200px' }}>
        {PHASES.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { net.stop(); setPhase(i) }}
            style={{
              flex: 1, padding: '0.8rem 0.5rem',
              borderRadius: '8px',
              border: `2px solid ${phase === i ? p.color : 'var(--border)'}`,
              background: phase === i ? `${p.color}1a` : 'var(--bg-3)',
              color: phase === i ? p.color : 'var(--text-dim)',
              fontSize: '0.95rem', fontWeight: phase === i ? 700 : 400,
              cursor: 'pointer', textAlign: 'center', lineHeight: 1.3,
              transition: 'all 0.2s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Current phase description */}
      <div style={{
        background: `${current.color}14`,
        border: `1px solid ${current.color}55`,
        borderLeft: `5px solid ${current.color}`,
        borderRadius: '8px', padding: '1rem 1.5rem',
        maxWidth: '1200px', width: '100%',
        minHeight: '120px',
      }}>
        <div style={{ fontSize: '1.1rem', color: current.color, fontWeight: 600, marginBottom: '0.4rem' }}>
          {current.label}
        </div>
        <div style={{ fontSize: '1.05rem', color: 'var(--text)', lineHeight: 1.5 }}>
          {phase === 0 && <>Un punto (x,y) entra a la red. La <STTooltip term="capa_de_entrada">capa de entrada</STTooltip> propaga la señal hacia adelante.</>}
          {phase === 1 && <>La red predice. Se mide la divergencia o <STTooltip term="error">señal de error</STTooltip> contra la respuesta experada.</>}
          {phase === 2 && <>Cálculo del gradiente: se halla la <STTooltip term="derivada_del_error">derivada del error</STTooltip> para rastrear la culpa topológica.</>}
          {phase === 3 && <>Actualización: los <STTooltip term="peso">pesos</STTooltip> mutan para reducir el error. La representación ha cambiado.</>}
        </div>
        {profesorMode && phase === 1 && (
          <div style={{ marginTop: '0.8rem', fontSize: '1.1rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>
            <InlineMath math="\mathcal{L} = -\frac{1}{N}\sum_i [y_i \log \hat{y}_i + (1-y_i)\log(1-\hat{y}_i)]" />
          </div>
        )}
        {profesorMode && phase === 2 && (
          <div style={{ marginTop: '0.8rem', fontSize: '1.1rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>
            <InlineMath math="\nabla_{W} \mathcal{L} = \frac{\partial \mathcal{L}}{\partial W}" />
          </div>
        )}
        {profesorMode && phase === 3 && (
          <div style={{ marginTop: '0.8rem', fontSize: '1.1rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>
            <InlineMath math="W \leftarrow W - \alpha \nabla_{W} \mathcal{L}" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={() => net.training ? net.stop() : net.start()}
          style={{
            padding: '0.8rem 2rem', borderRadius: '8px',
            border: `2px solid ${net.training ? '#ef4444' : 'var(--accent)'}`,
            background: net.training ? 'rgba(239,68,68,0.15)' : 'rgba(124,109,250,0.15)',
            color: net.training ? '#ef4444' : 'var(--accent-2)',
            fontSize: '1.1rem', cursor: 'pointer', fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          {net.training ? '⏸ Pausar Entrenamiento' : '▶ Iniciar Entrenamiento'}
        </button>
        <button onClick={net.step} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-dim)', fontSize: '1rem', cursor: 'pointer' }}>
          → 1 época manual
        </button>
        <button onClick={net.reset} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', border: '1px solid #ef444466', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '1rem', cursor: 'pointer' }}>
          ↺ Reiniciar Pesos
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <STModalBadge symbol="=" content="MODEL_EQ" title="Identidad Matemática" />
        <STModalBadge symbol="C" content="CAUSAL_AGENCY" title="Agencia Causal por Error" />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1200px', width: '100%', fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Ontología del límite:</strong>{' '}
          La frontera de decisión no es pre-programada. Emerge del cálculo iterativo.
          Blanco = umbral epistémico. Azul/Rojo coinciden con el mapeo del espacio subyacente.
          Cada época demuestra cómo la estructura formal del error esculpe la materialidad virtual de la red.
        </div>
      )}
    </div>
  )
}
