import { useState, useRef, useEffect, useCallback } from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath } from 'react-katex'

const PHASES = [
  { id: 'presentar', label: '1. PRESENTAR', color: '#22c55e', desc: 'La imagen entra. La capa de entrada se activa.' },
  { id: 'evaluar', label: '2. EVALUAR', color: '#ef4444', desc: 'Salida generada vs. salida deseada. El error aparece.' },
  { id: 'calcular', label: '3. CALCULAR EP', color: '#eab308', desc: 'Se calcula el error parcial por cada conexión.' },
  { id: 'actualizar', label: '4. ACTUALIZAR', color: '#7c6dfa', desc: 'Los pesos se mueven. El error baja.' },
]

export default function S05_Entrenamiento({ profesorMode }) {
  const [phase, setPhase] = useState(0)
  const [running, setRunning] = useState(false)
  const [errorHistory, setErrorHistory] = useState(Array.from({ length: 40 }, (_, i) => 1 - i * 0.015 + Math.random() * 0.05))
  const [epoch, setEpoch] = useState(40)
  const intervalRef = useRef(null)
  const chartRef = useRef(null)

  const step = useCallback(() => {
    setPhase(p => (p + 1) % 4)
    setEpoch(e => {
      const ne = e + 1
      setErrorHistory(h => {
        const last = h[h.length - 1]
        const next = Math.max(0.02, last - (0.012 + Math.random() * 0.015))
        return [...h.slice(-59), next]
      })
      return ne
    })
  }, [])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(step, 800)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, step])

  // Chart
  useEffect(() => {
    const canvas = chartRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#2a2a38'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = H - (H * i / 4)
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Error curve
    const data = errorHistory
    ctx.strokeStyle = '#7c6dfa'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = H - v * H
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Fill
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath()
    ctx.fillStyle = 'rgba(124,109,250,0.08)'
    ctx.fill()

    // Current error label
    ctx.fillStyle = '#a78bfa'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`error: ${(data[data.length - 1] * 100).toFixed(1)}%`, W - 4, 14)
  }, [errorHistory])

  const current = PHASES[phase]

  return (
    <div className="section-slide" style={{ gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Entrenamiento supervisado</div>
        <div className="section-subtitle">Los 4 pasos en vivo</div>
      </div>

      <div className="quote" style={{ maxWidth: '560px' }}>
        "El aprendizaje no es magia — es una curva de error cayendo. Y vamos a verla caer."
      </div>

      {/* Phase indicator */}
      <div style={{ display: 'flex', gap: '0.4rem', width: '100%', maxWidth: '640px' }}>
        {PHASES.map((p, i) => (
          <button
            key={p.id}
            onClick={() => { setRunning(false); setPhase(i) }}
            style={{
              flex: 1,
              padding: '0.5rem 0.25rem',
              borderRadius: '6px',
              border: `2px solid ${phase === i ? p.color : 'var(--border)'}`,
              background: phase === i ? `${p.color}22` : 'var(--bg-3)',
              color: phase === i ? p.color : 'var(--text-dim)',
              fontSize: '0.68rem',
              fontWeight: phase === i ? 700 : 400,
              cursor: 'pointer',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Current phase description */}
      <div style={{
        background: `${current.color}18`,
        border: `1px solid ${current.color}66`,
        borderLeft: `4px solid ${current.color}`,
        borderRadius: '6px',
        padding: '0.75rem 1rem',
        maxWidth: '640px',
        width: '100%',
      }}>
        <div style={{ fontSize: '0.85rem', color: current.color, fontWeight: 600, marginBottom: '0.25rem' }}>
          {current.label}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{current.desc}</div>
        {profesorMode && phase === 1 && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-dim)' }}>
            <InlineMath math="E = \frac{1}{2}(y - d)^2" />
          </div>
        )}
      </div>

      {/* Controls + chart */}
      <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '640px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            onClick={() => setRunning(r => !r)}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '6px',
              border: `1px solid ${running ? '#ef4444' : 'var(--accent)'}`,
              background: running ? 'rgba(239,68,68,0.15)' : 'rgba(124,109,250,0.15)',
              color: running ? '#ef4444' : 'var(--accent-2)',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            {running ? '⏸ Pausar' : '▶ Iniciar'}
          </button>
          <button
            onClick={step}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-3)',
              color: 'var(--text-dim)',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            → Frame
          </button>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace', textAlign: 'center' }}>
            época {epoch}
          </div>
        </div>

        <div style={{
          flex: 1,
          height: '140px',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', top: 4, left: 8, fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            curva de aprendizaje
          </div>
        </div>
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '640px', width: '100%', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Nota filosófica:</strong>{' '}
          La complejidad como posicionalidad — el aprendizaje persiste y puede modificarse.
          Las neuronas son las células que sostienen funcionalmente el cambio aprendido.
        </div>
      )}
    </div>
  )
}
