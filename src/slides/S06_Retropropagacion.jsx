import { useState, useRef, useEffect } from 'react'
import 'katex/dist/katex.min.css'
import { BlockMath } from 'react-katex'

const HISTORY = [
  { year: 1974, who: 'Werbos', label: 'Werbos 1974', color: '#6b6b88', desc: 'Descubierto. Ignorado.' },
  { year: 1982, who: 'Rumelhart + Parker', label: '1982 (×2)', color: '#eab308', desc: 'Redescubierto independientemente.' },
  { year: 1986, who: 'Hinton, Williams, Rumelhart', label: 'Hinton 1986', color: '#7c6dfa', desc: 'Publicado. El mundo lo escucha.' },
]

const STEPS = [
  {
    id: 'ea',
    label: 'Error de activación',
    formula: 'EA_j = y_j - d_j',
    desc: 'Diferencia entre la salida real y la deseada en la unidad j.',
    color: '#ef4444',
    dir: 'backward',
  },
  {
    id: 'ei',
    label: 'Error de entrada',
    formula: 'EI_j = EA_j \\cdot y_j \\cdot (1 - y_j)',
    desc: 'Ponderado por la derivada de la sigmoide — cuánto cambiar la entrada total.',
    color: '#eab308',
    dir: 'backward',
  },
  {
    id: 'ew',
    label: 'Error del peso',
    formula: 'EW_{ij} = EI_j \\cdot y_i',
    desc: 'La responsabilidad de cada peso en el error final.',
    color: '#7c6dfa',
    dir: 'backward',
  },
  {
    id: 'ea_prev',
    label: 'Propagar atrás',
    formula: 'EA_i = \\sum_j EI_j \\cdot w_{ij}',
    desc: 'El error se propaga a la capa anterior, suma ponderada por los pesos.',
    color: '#a78bfa',
    dir: 'backward',
  },
]

export default function S06_Retropropagacion({ profesorMode }) {
  const [activeStep, setActiveStep] = useState(null)
  const [showHistory, setShowHistory] = useState(true)
  const netRef = useRef(null)
  const [mode, setMode] = useState('forward') // 'forward' | 'backward'

  useEffect(() => {
    const canvas = netRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    const layers = [3, 3, 2]
    const layerX = layers.map((_, l) => (W / (layers.length + 1)) * (l + 1))

    // Connections
    layers.slice(0, -1).forEach((fromSize, l) => {
      const toSize = layers[l + 1]
      for (let i = 0; i < fromSize; i++) {
        for (let j = 0; j < toSize; j++) {
          const x1 = layerX[l], y1 = getY(H, fromSize, i)
          const x2 = layerX[l + 1], y2 = getY(H, toSize, j)
          const isActive = activeStep !== null

          ctx.strokeStyle = mode === 'forward' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.5)'
          ctx.lineWidth = 1.5
          ctx.setLineDash(mode === 'backward' ? [4, 3] : [])
          ctx.beginPath()
          ctx.moveTo(mode === 'forward' ? x1 : x2, mode === 'forward' ? y1 : y2)
          ctx.lineTo(mode === 'forward' ? x2 : x1, mode === 'forward' ? y2 : y1)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    })

    // Nodes
    layers.forEach((size, l) => {
      for (let i = 0; i < size; i++) {
        const x = layerX[l], y = getY(H, size, i)
        ctx.beginPath()
        ctx.arc(x, y, 18, 0, Math.PI * 2)
        ctx.fillStyle = l === layers.length - 1 && mode === 'backward'
          ? 'rgba(239,68,68,0.3)' : 'rgba(124,109,250,0.2)'
        ctx.fill()
        ctx.strokeStyle = l === layers.length - 1 ? '#ef4444' : '#7c6dfa'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    })

    // Arrow direction label
    ctx.fillStyle = mode === 'forward' ? '#22c55e' : '#ef4444'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(mode === 'forward' ? '→ forward pass' : '← error backprop', W / 2, H - 8)

  }, [mode, activeStep])

  return (
    <div className="section-slide" style={{ gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Retropropagación</div>
        <div className="section-subtitle">La matemática hecha visible</div>
      </div>

      <div className="quote" style={{ maxWidth: '640px' }}>
        "En 1974 Werbos lo descubrió. Nadie lo escuchó. En 1986 Hinton lo popularizó.
        ¿Por qué costó 12 años que el mundo lo viera?"
      </div>

      {/* Timeline */}
      {showHistory && (
        <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '640px', width: '100%', alignItems: 'center' }}>
          {HISTORY.map((h, i) => (
            <div key={h.year} style={{ display: 'contents' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: h.color }}>{h.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{h.desc}</div>
              </div>
              {i < HISTORY.length - 1 && (
                <div style={{ color: 'var(--border)', fontSize: '1.2rem' }}>→</div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: '760px', flexWrap: 'wrap' }}>
        {/* Network canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['forward', 'backward'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0.6rem',
                  borderRadius: '6px',
                  border: `1px solid ${mode === m ? (m === 'forward' ? '#22c55e' : '#ef4444') : 'var(--border)'}`,
                  background: mode === m ? (m === 'forward' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'var(--bg-3)',
                  color: mode === m ? (m === 'forward' ? '#22c55e' : '#ef4444') : 'var(--text-dim)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                {m === 'forward' ? '→ Forward' : '← Backprop'}
              </button>
            ))}
          </div>
          <div style={{
            width: '260px',
            height: '180px',
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <canvas ref={netRef} style={{ width: '100%', height: '100%' }} />
          </div>
        </div>

        {/* Steps */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '280px' }}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              onClick={() => { setActiveStep(i); setMode('backward') }}
              style={{
                background: activeStep === i ? `${s.color}18` : 'var(--bg-3)',
                border: `1px solid ${activeStep === i ? s.color : 'var(--border)'}`,
                borderLeft: `3px solid ${s.color}`,
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: s.color, fontWeight: 600, marginBottom: '0.15rem' }}>
                Paso {i + 1}: {s.label}
              </div>
              {profesorMode && (
                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-h)', marginBottom: '0.2rem' }}>
                  <code>{s.formula}</code>
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '760px', width: '100%', fontSize: '0.78rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Andersen & Zipser:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            Redes entrenadas con retropropagación desarrollaron unidades ocultas cuyas respuestas se
            parecían a neuronas reales de la corteza visual.
            La idealización produce algo biológicamente relevante.
          </span>
          <br />
          <strong style={{ color: 'var(--yellow)', marginTop: '0.3rem', display: 'inline-block' }}>Límite biológico:</strong>{' '}
          <span style={{ color: 'var(--text-dim)' }}>
            El cerebro no envía señales de error hacia atrás por las mismas conexiones — ningún
            mecanismo biológico conocido hace eso. Hinton reconoce el problema pero señala
            posibles vías de salida (feedback pathways).
          </span>
        </div>
      )}
    </div>
  )
}

function getY(H, size, i) {
  const spacing = Math.min(52, (H - 50) / size)
  const totalH = spacing * (size - 1)
  return H / 2 - totalH / 2 + i * spacing
}
