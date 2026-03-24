import { useEffect, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import { useNeuralNet } from '../hooks/useNeuralNet'
import STTooltip from '../components/st/STTooltip'
import STFloatingButton from '../components/st/STFloatingButton'

// ── Subtle neural background ───────────────────────────────────────────────────
function NeuralBg() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    let id
    const N = 55
    let W = 0, H = 0
    const setSize = () => {
      const nw = canvas.offsetWidth, nh = canvas.offsetHeight
      if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00035, vy: (Math.random() - 0.5) * 0.00035,
      r: 1.2 + Math.random() * 1.8, ph: Math.random() * Math.PI * 2,
    }))
    let startT = null
    function draw(ts) {
      if (!W || !H) { id = requestAnimationFrame(draw); return }
      if (!startT) startT = ts
      const t = (ts - startT) * 0.001
      const cyc = (Math.sin(t * 0.05) + 1) / 2
      const cr = Math.round(124 - cyc * 40), cg = Math.round(109 + cyc * 70), cb = Math.round(250 - cyc * 28)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'rgba(1,1,14,0.14)'; ctx.fillRect(0, 0, W, H)
      nodes.forEach(n => { n.x = ((n.x + n.vx) + 1) % 1; n.y = ((n.y + n.vy) + 1) % 1 })
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = (nodes[i].x - nodes[j].x) * W, dy = (nodes[i].y - nodes[j].y) * H
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < 180) {
          ctx.beginPath()
          ctx.moveTo(nodes[i].x * W, nodes[i].y * H); ctx.lineTo(nodes[j].x * W, nodes[j].y * H)
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(1 - d / 180) * 0.06})`; ctx.lineWidth = 0.5; ctx.stroke()
        }
      }
      nodes.forEach((n, i) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * (0.6 + (i % 11) * 0.08) + n.ph)
        const x = n.x * W, y = n.y * H, r = n.r * (0.7 + 0.5 * pulse)
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6)
        g.addColorStop(0, `rgba(${cr},${cg},${cb},${0.10 * pulse})`); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(x, y, r * 6, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${Math.min(255, cr + 55)},${Math.min(255, cg + 45)},${cb},${0.45 + pulse * 0.45})`
        ctx.fill()
      })
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}

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

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default function S04_Arquitectura({ profesorMode }) {
  const { activations, weights, epoch, data, getActivationsFor, start, stop } = useNeuralNet({ hiddenSizes: [8, 8] })
  const canvasRef   = useRef(null)
  const [sample, setSample]       = useState(0)
  const [showW, setShowW]         = useState(true)
  const [animPhase, setAnimPhase] = useState(-1)
  const loopRef = useRef(null)

  // Auto-start training + forward-pass loop on mount
  useEffect(() => {
    start()
    // Start a continuous forward-pass animation loop
    let phase = 0
    let sampleIdx = 0
    loopRef.current = setInterval(() => {
      setAnimPhase(phase)
      phase++
      if (phase > 4) {
        phase = 0
        // Rotate sample on each full cycle
        sampleIdx = (sampleIdx + 1) % 6
        setSample(sampleIdx)
      }
    }, 600)
    return () => {
      stop()
      clearInterval(loopRef.current)
    }
  }, [start, stop])

  // Trigger activations when sample or epoch changes
  useEffect(() => {
    if (data?.X?.[sample]) getActivationsFor(data.X[sample])
  }, [data, epoch, getActivationsFor, sample])

  // Manual forward pass: restart the loop from current sample
  const runForward = () => {
    clearInterval(loopRef.current)
    let phase = 0
    setAnimPhase(0)
    loopRef.current = setInterval(() => {
      phase++
      if (phase > 3) {
        clearInterval(loopRef.current)
        setAnimPhase(-1)
        // Resume auto-loop after manual pass
        let autoPhase = 0
        let autoSample = sample
        loopRef.current = setInterval(() => {
          setAnimPhase(autoPhase)
          autoPhase++
          if (autoPhase > 4) {
            autoPhase = 0
            autoSample = (autoSample + 1) % 6
            setSample(autoSample)
          }
        }, 600)
      } else {
        setAnimPhase(phase)
      }
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
    const columnWidth = Math.min(172, xStep * 0.78)

    // ── Layer columns + separators ──
    layerSizes.forEach((_, l) => {
      const isFocused = animPhase === l
      const isVisited = animPhase > l || animPhase < 0
      const color = LAYER_COLORS[l] ?? '#888'
      const alpha = isFocused ? 0.12 : (isVisited ? 0.07 : 0.035)
      drawRoundedRect(ctx, lx[l] - columnWidth / 2, 24, columnWidth, H - 54, 18)
      ctx.fillStyle = `rgba(${hexRgb(color)},${alpha})`
      ctx.fill()
      ctx.strokeStyle = `rgba(${hexRgb(color)},${isFocused ? 0.32 : 0.12})`
      ctx.lineWidth = isFocused ? 1.6 : 1
      ctx.stroke()
    })

    for (let l = 0; l < nL - 1; l++) {
      const separatorX = (lx[l] + lx[l + 1]) / 2
      ctx.beginPath()
      ctx.setLineDash([5, 6])
      ctx.moveTo(separatorX, 28)
      ctx.lineTo(separatorX, H - 24)
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
    }

    // ── Connections ──
    layerSizes.slice(0, -1).forEach((fromSize, l) => {
      const toSize = layerSizes[l + 1]
      const displayFrom = Math.min(fromSize, 10)
      const displayTo   = Math.min(toSize, 10)
      const wMat = weights[l]?.matrix
      const transitionFocused = animPhase === l + 1
      const transitionVisited = animPhase > l + 1 || animPhase < 0

      for (let i = 0; i < displayFrom; i++) {
        const y1 = nodeY(H, displayFrom, i)
        for (let j = 0; j < displayTo; j++) {
          const y2 = nodeY(H, displayTo, j)
          const w = wMat?.[i]?.[j] ?? 0
          const alpha = showW ? Math.max(0.18, Math.min(Math.abs(w) * 1.2, 0.9)) : 0.18
          const idle = animPhase < 0
          const dimFactor = idle ? 1 : (transitionFocused ? 1 : (transitionVisited ? 0.4 : 0.18))

          ctx.strokeStyle = transitionFocused
            ? `rgba(255,220,50,${Math.max(0.45, alpha)})`
            : w > 0 ? `rgba(124,109,250,${alpha * dimFactor})` : `rgba(239,68,68,${alpha * dimFactor})`
          ctx.lineWidth = transitionFocused
            ? Math.max(1.2, Math.abs(w) * 3)
            : (showW ? Math.max(0.6, Math.abs(w) * (transitionVisited || idle ? 1.5 : 0.9)) : 0.9)
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
      const layerFocused = animPhase === l
      const layerVisited = animPhase > l || animPhase < 0
      const layerAlphaBoost = layerFocused ? 1 : (layerVisited ? 0.78 : 0.35)

      for (let i = 0; i < displaySize; i++) {
        const x = lx[l]
        const y = nodeY(H, displaySize, i)
        const act = Array.isArray(activations[l]) ? activations[l][i] : (activations[l] ?? 0)
        const norm = Math.max(0, Math.min(1, typeof act === 'number' ? act : 0))

        // Outer glow for active neurons
        if (norm > 0.25 && layerVisited) {
          ctx.beginPath()
          ctx.arc(x, y, nodeR + 8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${hexRgb(color)},${norm * (layerFocused ? 0.22 : 0.12)})`
          ctx.fill()
        }

        // Node body with radial gradient
        ctx.beginPath()
        ctx.arc(x, y, nodeR, 0, Math.PI * 2)
        const g = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, nodeR)
        const alpha = (0.18 + norm * 0.72) * layerAlphaBoost
        g.addColorStop(0, `rgba(${hexRgb(color)},${Math.min(alpha + 0.2, 1)})`)
        g.addColorStop(1, `rgba(${hexRgb(color)},${alpha * 0.3})`)
        ctx.fillStyle = g
        ctx.fill()
        ctx.strokeStyle = layerVisited ? color : `${color}55`
        ctx.lineWidth = layerFocused ? 2.6 : (layerVisited ? 1.6 : 1.2)
        ctx.stroke()

        // Activation value label
        ctx.fillStyle = layerFocused
          ? '#ffffff'
          : (norm > 0.5 ? 'rgba(255,255,255,0.86)' : (norm > 0.15 ? 'rgba(221,221,221,0.78)' : 'rgba(136,136,136,0.72)'))
        ctx.font = 'bold 9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(norm.toFixed(2), x, y + 3)
      }

      // Layer header
      ctx.fillStyle = layerVisited ? color : `${color}66`
      ctx.font = `${layerFocused ? 'bold ' : ''}10px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(LAYER_LABELS[l] ?? `L${l}`, lx[l], 16)
    })

    // ── Weight value labels on strongest connections (when showW) ──
    if (showW) {
      layerSizes.slice(0, -1).forEach((fromSize, l) => {
        const toSize = layerSizes[l + 1]
        const displayFrom = Math.min(fromSize, 10)
        const displayTo   = Math.min(toSize, 10)
        const wMat = weights[l]?.matrix
        if (!wMat) return
        // Find top-3 connections by |w|
        const conns = []
        for (let i = 0; i < displayFrom; i++)
          for (let j = 0; j < displayTo; j++) {
            const w = wMat[i]?.[j] ?? 0
            if (Math.abs(w) > 0.3) conns.push({ i, j, w })
          }
        conns.sort((a, b) => Math.abs(b.w) - Math.abs(a.w))
        const labelsToShow = animPhase < 0 ? 1 : (animPhase === l + 1 ? 2 : 0)
        conns.slice(0, labelsToShow).forEach(({ i, j, w }) => {
          const x1 = lx[l],     y1 = nodeY(H, displayFrom, i)
          const x2 = lx[l + 1], y2 = nodeY(H, displayTo, j)
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
          ctx.save()
          ctx.font = 'bold 8px monospace'
          ctx.textAlign = 'center'
          drawRoundedRect(ctx, mx - 17, my - 11, 34, 14, 5)
          ctx.fillStyle = 'rgba(8,12,24,0.88)'
          ctx.fill()
          ctx.fillStyle = w > 0 ? 'rgba(167,139,250,0.95)' : 'rgba(248,113,113,0.95)'
          ctx.shadowColor = '#000'
          ctx.shadowBlur = 3
          ctx.fillText(w.toFixed(2), mx, my - 1)
          ctx.restore()
        })
      })
    }

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
    <div className="section-slide" style={{ gap: '1.5rem', position: 'relative' }}>
      <NeuralBg />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Arquitectura de tres capas</div>
        <div className="section-subtitle">Red TF.js en vivo — Propagación hacia adelante</div>
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
            border: `1px solid ${animPhase >= 0 ? '#eab308' : '#22c55e'}`,
            background: animPhase >= 0 ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
            color: animPhase >= 0 ? '#eab308' : '#22c55e', fontSize: '0.95rem', cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          <Play size={15} strokeWidth={2} style={{ flexShrink: 0 }} /> {animPhase >= 0 ? `Capa ${Math.min(animPhase + 1, 4)}/4` : 'Propagación Forward'}
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

      {/* Weight color legend */}
      <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
        {[
          { color: 'rgba(124,109,250,0.9)', label: 'peso positivo' },
          { color: 'rgba(239,68,68,0.9)',   label: 'peso negativo' },
          { color: 'rgba(255,220,50,0.9)',   label: 'señal propagándose' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ display: 'inline-block', width: 22, height: 3, background: color, borderRadius: 2 }} />
            {label}
          </span>
        ))}
        <span style={{ color: 'var(--text-dim)' }}>grosor de línea = magnitud del peso</span>
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

      <STFloatingButton slideId="S04" />

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
    </div>
  )
}
