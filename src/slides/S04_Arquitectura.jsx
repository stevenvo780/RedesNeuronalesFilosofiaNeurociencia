import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useNeuralNet } from '../hooks/useNeuralNet'
import STTooltip from '../components/st/STTooltip'
import STModalBadge from '../components/st/STModalBadge'

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
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Arquitectura de tres capas</div>
        <div className="section-subtitle">Red TF.js en vivio — Propagación hacia adelante</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px' }}>
        "Las <STTooltip term="capa_oculta">unidades ocultas</STTooltip> descubren solas qué <STTooltip term="representacion">representar</STTooltip>.
        Nadie les dijo qué características detectar. Los colores dictan sus activaciones reales."
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>Muestra de entrada:</span>
        {Array.from({ length: 6 }, (_, i) => (
          <button
            key={i}
            onClick={() => setSample(i)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: `1px solid ${sample === i ? 'var(--accent)' : 'var(--border)'}`,
              background: sample === i ? 'rgba(124,109,250,0.2)' : 'var(--bg-3)',
              color: sample === i ? 'var(--accent-2)' : 'var(--text-dim)',
              fontSize: '0.95rem', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            #{i} · C{data?.y?.[i] ?? '?'}
          </button>
        ))}

        <button
          onClick={runForward}
          style={{
            padding: '0.5rem 1.2rem', borderRadius: '8px', marginLeft: '1rem',
            border: '1px solid #22c55e', background: 'rgba(34,197,94,0.12)',
            color: '#22c55e', fontSize: '0.95rem', cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          <Play size={15} strokeWidth={2} style={{ flexShrink: 0 }} /> Propagación Forward
        </button>

        <label style={{ fontSize: '0.95rem', color: 'var(--text-dim)', display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '1rem' }}>
          <input type="checkbox" checked={showW} onChange={e => setShowW(e.target.checked)} style={{ transform: 'scale(1.2)' }} />
          Pesos visibles
        </label>
      </div>

      {/* Network canvas */}
      <div style={{
        width: '100%', maxWidth: '1000px', height: '400px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
        position: 'relative',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: 10, right: 15, fontSize: '0.9rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
          época {epoch}
        </div>
      </div>

      {/* Layer descriptions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1000px' }}>
        {LAYER_LABELS.map((label, l) => (
          <div key={l} style={{
            background: 'var(--bg-3)',
            border: `1px solid ${LAYER_COLORS[l]}44`,
            borderLeft: `4px solid ${LAYER_COLORS[l]}`,
            borderRadius: '8px',
            padding: '0.8rem 1rem',
            flex: '1 1 200px',
          }}>
            <div style={{ fontSize: '0.9rem', color: LAYER_COLORS[l], fontWeight: 600, marginBottom: '0.3rem' }}>{label}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{LAYER_DESCS[l]}</div>
          </div>
        ))}
      </div>

      {/* Teorema de Aproximación Universal */}
      <div style={{
        maxWidth: '1000px', width: '100%',
        background: 'rgba(124,109,250,0.06)',
        border: '1px solid rgba(124,109,250,0.3)',
        borderLeft: '4px solid #7c6dfa',
        borderRadius: '0 10px 10px 0',
        padding: '1rem 1.5rem',
      }}>
        <div style={{ fontSize: '0.75rem', color: '#7c6dfa', fontFamily: 'monospace', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>
          TEOREMA DE APROXIMACIÓN UNIVERSAL — CYBENKO (1989)
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6, margin: '0 0 0.5rem' }}>
          Una red de <em>una sola capa oculta</em> con funciones de activación sigmoide puede aproximar cualquier función continua
          sobre un dominio compacto con precisión arbitraria — dado suficientes unidades ocultas.
        </p>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.55, margin: 0 }}>
          <span style={{ color: '#ef4444' }}>Implicación filosófica:</span>{' '}
          La capacidad de representar <em>cualquier</em> función no explica <em>qué</em> función aprende la red, ni <em>por qué</em>
          esa función corresponde a algo en el cerebro. El teorema funda el poder expresivo, no el poder explicativo.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <STModalBadge symbol="O" content="LAYER_ONTOLOGY" title="Ontología Jerárquica" />
        <STModalBadge symbol="→" content="FWD_PASS" title="Procesamiento Bottom-Up" />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%', fontSize: '0.95rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Red real operando:</strong>{' '}
          Arquitectura 2→8→8→1, dataset espiral, Adam lr=0.04. Violeta = <STTooltip term="peso">peso</STTooltip> positivo, rojo = negativo.
          Intensidad del nodo = valor de activación real (ReLU capas ocultas, sigmoid salida).
          Hinton 1992: Las redes superan la crítica de Minsky y Papert al descubrir rasgos abstractos no lineales
          secuencialmente, lo que funda el concepto de <STTooltip term="representacion_distribuida">representación distribuida iterada</STTooltip>.
        </div>
      )}
    </div>
  )
}
