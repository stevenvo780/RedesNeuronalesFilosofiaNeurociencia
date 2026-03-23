import { useEffect, useRef, useState } from 'react'
import { useNeuralNet } from '../hooks/useNeuralNet'

const LAYER_COLORS = ['#06b6d4', '#7c6dfa', '#a78bfa', '#22c55e']
const LAYER_LABELS = ['Entrada (2)', 'Oculta 1 (8)', 'Oculta 2 (8)', 'Salida (1)']
const LAYER_DESCS  = [
  'Coordenadas (x, y) del espacio 2D',
  'Patrones no lineales detectados',
  'Abstracción de segundo orden',
  'Probabilidad clase 1',
]

function hexRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '124,109,250'
}

function nodeY(H, size, i) {
  const spacing = Math.min(44, (H - 55) / Math.max(size - 1, 1))
  return H / 2 - ((size - 1) * spacing) / 2 + i * spacing
}

export default function S04_Arquitectura({ profesorMode }) {
  const { activations, weights, epoch, data, getActivationsFor, training, start, stop } = useNeuralNet({ hiddenSizes: [8, 8] })
  const canvasRef   = useRef(null)
  const [sample, setSample]       = useState(0)
  const [showW, setShowW]         = useState(true)
  const [animPhase, setAnimPhase] = useState(-1)  // -1 = idle, 0..3 = layer highlight

  // Trigger activations when sample or epoch changes
  useEffect(() => {
    if (data?.X?.[sample]) getActivationsFor(data.X[sample])
  }, [sample, data, epoch]) // eslint-disable-line react-hooks/exhaustive-deps

  // Animate forward pass
  const runForward = () => {
    let phase = 0
    setAnimPhase(0)
    const iv = setInterval(() => {
      phase++
      if (phase > 3) { clearInterval(iv); setAnimPhase(-1) }
      else setAnimPhase(phase)
    }, 500)
  }

  // Draw network
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || activations.length === 0) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    const layerSizes = activations.map(a => (Array.isArray(a) ? a.length : 1))
    const nL = layerSizes.length
    const xStep = W / (nL + 1)
    const lx = layerSizes.map((_, l) => xStep * (l + 1))
    const nodeR = 15

    // ── Connections ──
    layerSizes.slice(0, -1).forEach((fromSize, l) => {
      const toSize = layerSizes[l + 1]
      const displayFrom = Math.min(fromSize, 10)
      const displayTo   = Math.min(toSize, 10)
      const wMat = weights[l]?.matrix

      for (let i = 0; i < displayFrom; i++) {
        const y1 = nodeY(H, displayFrom, i)
        for (let j = 0; j < displayTo; j++) {
          const y2 = nodeY(H, displayTo, j)
          const w = wMat?.[i]?.[j] ?? 0
          const alpha = showW ? Math.min(Math.abs(w) * 0.9, 0.75) : 0.12
          const isActive = animPhase >= l + 1

          ctx.strokeStyle = isActive
            ? `rgba(255,220,50,${alpha + 0.15})`
            : w > 0 ? `rgba(124,109,250,${alpha})` : `rgba(239,68,68,${alpha})`
          ctx.lineWidth = showW ? Math.abs(w) * 1.8 + 0.4 : 0.8
          ctx.beginPath()
          ctx.moveTo(lx[l], y1)
          ctx.lineTo(lx[l + 1], y2)
          ctx.stroke()
        }
      }
    })

    // ── Nodes ──
    layerSizes.forEach((size, l) => {
      const displaySize = Math.min(size, 10)
      const color = LAYER_COLORS[l] ?? '#888'
      const layerActive = animPhase < 0 || animPhase >= l

      for (let i = 0; i < displaySize; i++) {
        const x = lx[l]
        const y = nodeY(H, displaySize, i)
        const act = Array.isArray(activations[l]) ? activations[l][i] : (activations[l] ?? 0)
        const norm = Math.max(0, Math.min(1, typeof act === 'number' ? act : 0))

        // Outer glow for active neurons
        if (norm > 0.25 && layerActive) {
          ctx.beginPath()
          ctx.arc(x, y, nodeR + 8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${hexRgb(color)},${norm * 0.18})`
          ctx.fill()
        }

        // Node body with radial gradient
        ctx.beginPath()
        ctx.arc(x, y, nodeR, 0, Math.PI * 2)
        const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, nodeR)
        const alpha = layerActive ? 0.25 + norm * 0.75 : 0.1
        g.addColorStop(0, `rgba(${hexRgb(color)},${Math.min(alpha + 0.2, 1)})`)
        g.addColorStop(1, `rgba(${hexRgb(color)},${alpha * 0.3})`)
        ctx.fillStyle = g
        ctx.fill()
        ctx.strokeStyle = layerActive ? color : `${color}55`
        ctx.lineWidth = animPhase === l ? 2.5 : 1.5
        ctx.stroke()

        // Activation value label
        ctx.fillStyle = norm > 0.45 ? '#fff' : '#aaa'
        ctx.font = '7.5px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(norm.toFixed(2), x, y + 2.5)
      }

      // Layer header
      ctx.fillStyle = layerActive ? color : `${color}66`
      ctx.font = `${animPhase === l ? 'bold ' : ''}10px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(LAYER_LABELS[l] ?? `L${l}`, lx[l], 13)
    })

    // ── Direction arrow ──
    ctx.strokeStyle = '#ffffff22'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(lx[0] + nodeR + 5, H - 14)
    ctx.lineTo(lx[nL - 1] - nodeR - 5, H - 14)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ffffff33'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('forward pass →', W / 2, H - 5)

  }, [activations, weights, showW, animPhase])

  return (
    <div className="section-slide" style={{ gap: '1rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Arquitectura de tres capas</div>
        <div className="section-subtitle">Red TF.js real — activaciones en vivo</div>
      </div>

      <div className="quote" style={{ maxWidth: '600px' }}>
        "Las <em>unidades ocultas</em> descubren solas qué representar.
        Nadie les dijo. Los colores son sus activaciones reales."
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Muestra:</span>
        {Array.from({ length: 6 }, (_, i) => (
          <button
            key={i}
            onClick={() => setSample(i)}
            style={{
              padding: '0.25rem 0.55rem',
              borderRadius: '4px',
              border: `1px solid ${sample === i ? 'var(--accent)' : 'var(--border)'}`,
              background: sample === i ? 'rgba(124,109,250,0.2)' : 'var(--bg-3)',
              color: sample === i ? 'var(--accent-2)' : 'var(--text-dim)',
              fontSize: '0.7rem', cursor: 'pointer',
            }}
          >
            #{i} · C{data?.y?.[i] ?? '?'}
          </button>
        ))}

        <button
          onClick={runForward}
          style={{
            padding: '0.3rem 0.9rem', borderRadius: '5px', marginLeft: '0.5rem',
            border: '1px solid #22c55e', background: 'rgba(34,197,94,0.12)',
            color: '#22c55e', fontSize: '0.72rem', cursor: 'pointer',
          }}
        >
          ▶ Forward pass
        </button>

        <label style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          <input type="checkbox" checked={showW} onChange={e => setShowW(e.target.checked)} />
          Pesos visibles
        </label>
      </div>

      {/* Network canvas */}
      <div style={{
        width: '100%', maxWidth: '740px', height: '290px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden',
        position: 'relative',
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: 6, right: 10, fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          época {epoch}
        </div>
      </div>

      {/* Layer descriptions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {LAYER_LABELS.map((label, l) => (
          <div key={l} style={{
            background: 'var(--bg-3)',
            border: `1px solid ${LAYER_COLORS[l]}44`,
            borderLeft: `3px solid ${LAYER_COLORS[l]}`,
            borderRadius: '6px',
            padding: '0.4rem 0.7rem',
            minWidth: '130px',
          }}>
            <div style={{ fontSize: '0.7rem', color: LAYER_COLORS[l], fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>{LAYER_DESCS[l]}</div>
          </div>
        ))}
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '740px', width: '100%', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Red real:</strong>{' '}
          2→8→8→1, dataset espiral, Adam lr=0.04. Violeta = peso positivo, rojo = negativo.
          Intensidad del nodo = valor de activación real (ReLU capas ocultas, sigmoid salida).
          Hinton 1992: los pesos de la capa oculta detectan rasgos del espacio de entrada
          sin instrucciones — exactamente lo que muestra esta red.
        </div>
      )}
    </div>
  )
}
