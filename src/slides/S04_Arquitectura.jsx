import { useEffect, useRef, useState } from 'react'

const LAYER_SIZES = [6, 4, 3]
const LAYER_LABELS = ['Entrada', 'Oculta', 'Salida']
const LAYER_COLORS = ['#06b6d4', '#7c6dfa', '#22c55e']

function initWeights(sizes) {
  const weights = []
  for (let l = 0; l < sizes.length - 1; l++) {
    const layer = []
    for (let i = 0; i < sizes[l]; i++) {
      const row = []
      for (let j = 0; j < sizes[l + 1]; j++) {
        row.push((Math.random() - 0.5) * 2)
      }
      layer.push(row)
    }
    weights.push(layer)
  }
  return weights
}

function forwardPass(input, weights) {
  let activation = input
  const activations = [activation]
  for (const layerW of weights) {
    const next = layerW[0].map((_, j) =>
      Math.tanh(activation.reduce((s, a, i) => s + a * layerW[i][j], 0))
    )
    activations.push(next)
    activation = next
  }
  return activations
}

export default function S04_Arquitectura({ profesorMode }) {
  const canvasRef = useRef(null)
  const [weights] = useState(() => initWeights(LAYER_SIZES))
  const [inputVec] = useState(() => LAYER_SIZES[0] > 0
    ? Array.from({ length: LAYER_SIZES[0] }, () => Math.random())
    : [])
  const [activations] = useState(() => forwardPass(inputVec, weights))
  const [hoveredUnit, setHoveredUnit] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    canvas.width = W
    canvas.height = H
    ctx.clearRect(0, 0, W, H)

    const layerX = LAYER_SIZES.map((_, l) => (W / (LAYER_SIZES.length + 1)) * (l + 1))

    // Draw connections
    LAYER_SIZES.slice(0, -1).forEach((fromSize, l) => {
      const toSize = LAYER_SIZES[l + 1]
      for (let i = 0; i < fromSize; i++) {
        const y1 = getNodeY(H, fromSize, i)
        for (let j = 0; j < toSize; j++) {
          const y2 = getNodeY(H, toSize, j)
          const w = weights[l][i][j]
          const alpha = Math.min(Math.abs(w), 1) * 0.7
          ctx.strokeStyle = w > 0
            ? `rgba(124,109,250,${alpha})`
            : `rgba(239,68,68,${alpha})`
          ctx.lineWidth = Math.abs(w) * 2
          ctx.beginPath()
          ctx.moveTo(layerX[l], y1)
          ctx.lineTo(layerX[l + 1], y2)
          ctx.stroke()
        }
      }
    })

    // Draw nodes
    LAYER_SIZES.forEach((size, l) => {
      for (let i = 0; i < size; i++) {
        const x = layerX[l]
        const y = getNodeY(H, size, i)
        const act = activations[l]?.[i] ?? 0
        const alpha = (act + 1) / 2  // normalize -1..1 to 0..1

        ctx.beginPath()
        ctx.arc(x, y, 18, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${hexToRgb(LAYER_COLORS[l])},${alpha.toFixed(2)})`
        ctx.fill()
        ctx.strokeStyle = LAYER_COLORS[l]
        ctx.lineWidth = hoveredUnit?.layer === l && hoveredUnit?.index === i ? 3 : 1.5
        ctx.stroke()

        ctx.fillStyle = '#f0f0ff'
        ctx.font = '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(act.toFixed(2), x, y + 3)
      }
    })

    // Layer labels
    LAYER_SIZES.forEach((_, l) => {
      ctx.fillStyle = LAYER_COLORS[l]
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(LAYER_LABELS[l], layerX[l], 18)
    })

  }, [weights, activations, hoveredUnit])

  return (
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Arquitectura de tres capas</div>
        <div className="section-subtitle">El flujo de la información</div>
      </div>

      <div className="quote" style={{ maxWidth: '600px' }}>
        "Las <em>unidades ocultas</em> son el corazón filosófico del modelo.
        Nadie les dijo qué representar. Lo descubren solas."
      </div>

      <div style={{
        width: '100%',
        maxWidth: '640px',
        height: '260px',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {LAYER_LABELS.map((label, l) => (
          <div key={l} style={{
            background: 'var(--bg-3)',
            border: `1px solid ${LAYER_COLORS[l]}44`,
            borderLeft: `3px solid ${LAYER_COLORS[l]}`,
            borderRadius: '6px',
            padding: '0.5rem 0.75rem',
          }}>
            <div style={{ fontSize: '0.75rem', color: LAYER_COLORS[l], fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {l === 0 && `${LAYER_SIZES[0]} unidades · entradas del entorno`}
              {l === 1 && `${LAYER_SIZES[1]} unidades · representaciones latentes`}
              {l === 2 && `${LAYER_SIZES[2]} unidades · salidas de clasificación`}
            </div>
          </div>
        ))}
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '640px', width: '100%' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
            Hinton (1992) — ejemplo real: 256 entradas, 9 unidades ocultas, 10 salidas (dígitos 0–9)
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6 }}>
            Los pesos entre entrada y capa oculta determinan qué rasgos detecta cada unidad —
            <span style={{ color: 'var(--accent-2)' }}> sin instrucciones externas sobre qué rasgo detectar.</span>{' '}
            El color de las conexiones indica el signo del peso (violeta = positivo, rojo = negativo).
            La intensidad indica la magnitud.
          </p>
        </div>
      )}
    </div>
  )
}

function getNodeY(H, size, i) {
  const spacing = Math.min(50, (H - 60) / size)
  const totalH = spacing * (size - 1)
  return H / 2 - totalH / 2 + i * spacing
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '124,109,250'
}
