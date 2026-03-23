import { useRef, useEffect, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash, TrendingUp, Microscope, Telescope,
  Layers, Wind, Footprints, Leaf, Droplets, Thermometer, Moon,
  HelpCircle, LoaderCircle, CheckCircle2, RefreshCw, ChevronDown,
  Plus, Minus, SlidersHorizontal, Settings2, X, Maximize2, Minimize2,
} from 'lucide-react'
import STFloatingButton from '../components/st/STFloatingButton'
import STTooltip from '../components/st/STTooltip'
import STModalBadge from '../components/st/STModalBadge'

// ── Animal data ────────────────────────────────────────────────────────────────
const FEATURES = [
  { key: 'pelo',     label: 'Pelo / Pelaje',   Icon: Layers      },
  { key: 'plumas',   label: 'Plumas',           Icon: Wind        },
  { key: 'escamas',  label: 'Escamas',          Icon: Leaf        },
  { key: 'patas4',   label: '4 Patas',          Icon: Footprints  },
  { key: 'vuela',    label: 'Vuela',            Icon: Wind        },
  { key: 'nada',     label: 'Nada / Acuático',  Icon: Droplets    },
  { key: 'caliente', label: 'Sangre caliente',  Icon: Thermometer },
  { key: 'nocturno', label: 'Nocturno',         Icon: Moon        },
]

const ANIMALS = [
  { name: 'Gato',       emoji: '🐱', color: '#a78bfa', features: [1,0,0,1,0,0,1,1] },
  { name: 'Águila',     emoji: '🦅', color: '#06b6d4', features: [0,1,0,0,1,0,1,0] },
  { name: 'Pez',        emoji: '🐟', color: '#22c55e', features: [0,0,1,0,0,1,0,0] },
  { name: 'Serpiente',  emoji: '🐍', color: '#eab308', features: [0,0,1,0,0,0,0,1] },
  { name: 'Rana',       emoji: '🐸', color: '#10b981', features: [0,0,0,1,0,1,0,1] },
  { name: 'Murciélago', emoji: '🦇', color: '#f97316', features: [1,0,0,0,1,0,1,1] },
]

const N_FEAT = 8
const N_CLASS = 6

function addNoise(arr, p = 0.10) {
  return arr.map(v => Math.random() < p ? 1 - v : v)
}

function buildDataset(repeats = 80) {
  const X = [], y = []
  for (let c = 0; c < N_CLASS; c++) {
    for (let r = 0; r < repeats; r++) {
      X.push(addNoise(ANIMALS[c].features, 0.12))
      const oneHot = Array(N_CLASS).fill(0)
      oneHot[c] = 1
      y.push(oneHot)
    }
  }
  // Shuffle
  for (let i = X.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [X[i], X[j]] = [X[j], X[i]];
    [y[i], y[j]] = [y[j], y[i]];
  }
  return { X, y }
}

// ── Training hook ──────────────────────────────────────────────────────────────
function useAnimalNet(hiddenLayersCfg, totalEpochs) {
  const modelRef   = useRef(null)
  const stopRef    = useRef(false)
  const speedRef   = useRef(200)
  const cfgRef     = useRef({ hiddenLayersCfg, totalEpochs })
  cfgRef.current   = { hiddenLayersCfg, totalEpochs }

  const [speed, setSpeed]       = useState(200)
  const [ready, setReady]       = useState(false)
  const [epoch, setEpoch]       = useState(0)
  const [acc, setAcc]           = useState(0)
  const [lossHist, setLossHist] = useState([])
  const [accHist, setAccHist]   = useState([])
  const [hiddenActs, setHiddenActs] = useState(null)
  const [training, setTraining] = useState(false)

  const train = useCallback(async () => {
    stopRef.current = false
    setReady(false)
    setEpoch(0)
    setAcc(0)
    setLossHist([])
    setAccHist([])
    setHiddenActs(null)
    setTraining(true)

    await tf.ready()

    // Read latest config
    const { hiddenLayersCfg: layers, totalEpochs: TOTAL } = cfgRef.current

    // Dispose previous model
    if (modelRef.current) { try { modelRef.current.dispose() } catch (_) {} }

    const model = tf.sequential()
    layers.forEach((units, i) => {
      const opts = { units, activation: 'relu' }
      if (i === 0) opts.inputShape = [N_FEAT]
      model.add(tf.layers.dense(opts))
    })
    model.add(tf.layers.dense({ units: N_CLASS, activation: 'softmax' }))
    model.compile({
      optimizer: tf.train.adam(0.015),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })

    const { X, y } = buildDataset(80)
    const xs = tf.tensor2d(X)
    const ys = tf.tensor2d(y)

    for (let e = 0; e < TOTAL; e++) {
      if (stopRef.current) break
      const res = await model.fit(xs, ys, {
        epochs: 1,
        batchSize: 32,
        shuffle: true,
      })
      const curAcc = res.history.accuracy?.[0] ?? res.history.acc?.[0] ?? 0
      const curLoss = res.history.loss?.[0] ?? 0
      setEpoch(e + 1)
      setAcc(curAcc)
      setLossHist(prev => [...prev, curLoss])
      setAccHist(prev => [...prev, curAcc])

      // Extract hidden activations for visualization
      if ((e + 1) % 3 === 0 || e === TOTAL - 1) {
        tf.tidy(() => {
          const sampleIn = tf.tensor2d([ANIMALS[0].features])
          const acts = {}
          // Build sub-models for each hidden layer
          for (let li = 0; li < layers.length; li++) {
            const sub = tf.model({ inputs: model.input, outputs: model.layers[li].output })
            acts[`h${li}`] = Array.from(sub.predict(sampleIn).dataSync())
          }
          acts.out = Array.from(model.predict(sampleIn).dataSync())
          setHiddenActs(acts)
        })
      }

      await new Promise(r => setTimeout(r, speedRef.current))
    }

    xs.dispose()
    ys.dispose()
    modelRef.current = model
    setReady(true)
    setTraining(false)
  }, [])

  // Start training on mount
  useEffect(() => {
    train()
    return () => {
      stopRef.current = true
      try { modelRef.current?.dispose() } catch (_) {}
    }
  }, [])

  const predict = useCallback((features) => {
    const model = modelRef.current
    if (!model || !ready) return null
    const { hiddenLayersCfg: layers } = cfgRef.current
    return tf.tidy(() => {
      const inp = tf.tensor2d([features])
      const acts = {}
      for (let li = 0; li < layers.length; li++) {
        const sub = tf.model({ inputs: model.input, outputs: model.layers[li].output })
        acts[`h${li}`] = Array.from(sub.predict(inp).dataSync())
      }
      const probs = Array.from(model.predict(inp).dataSync())
      acts.out = probs
      setHiddenActs(acts)
      return probs
    })
  }, [ready])

  const restart = useCallback(() => {
    stopRef.current = true
    setTimeout(() => train(), 100)
  }, [train])

  const updateSpeed = useCallback((v) => {
    speedRef.current = v
    setSpeed(v)
  }, [])

  return { ready, epoch, maxEpoch: totalEpochs, acc, lossHist, accHist, hiddenActs, predict, restart, training, speed, updateSpeed }
}

// ── Animated Network Canvas (interactive — hover shows weights) ─────────────
const HIDDEN_COLORS = ['#06b6d4','#a78bfa','#f59e0b','#ec4899']
function NetworkCanvas({ features, hiddenActs, layerConfig = [12,8], width = 340, height = 280, modelRef }) {
  const ref = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const nodesRef = useRef([]) // store node positions for hit-testing

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = width
    const H = canvas.height = height
    ctx.clearRect(0, 0, W, H)

    // Build layers dynamically
    const totalLayers = 2 + layerConfig.length
    const padX = 40
    const stepX = (W - padX * 2) / (totalLayers - 1)
    const layers = [
      { n: N_FEAT, vals: features, color: '#7c6dfa', label: 'entrada' },
      ...layerConfig.map((units, i) => ({
        n: units, vals: hiddenActs?.[`h${i}`], color: HIDDEN_COLORS[i % HIDDEN_COLORS.length], label: `oculta ${i+1}`,
      })),
      { n: N_CLASS, vals: hiddenActs?.out, color: '#22c55e', label: 'salida' },
    ]
    layers.forEach((l, i) => { l.x = padX + i * stepX })

    // Compute node Y positions
    const nodePositions = layers.map(l => {
      const spacing = Math.min(24, (H - 50) / (l.n + 1))
      const startY = (H - (l.n - 1) * spacing) / 2
      return Array.from({ length: l.n }, (_, i) => ({ x: l.x, y: startY + i * spacing }))
    })

    // Store for hit-testing
    nodesRef.current = { layers, nodePositions }

    // Draw connections
    for (let li = 0; li < layers.length - 1; li++) {
      const from = nodePositions[li]
      const to = nodePositions[li + 1]
      const fromVals = layers[li].vals
      const toVals = layers[li + 1].vals
      for (let f = 0; f < from.length; f++) {
        const fv = fromVals ? Math.abs(fromVals[f]) : 0.3
        for (let t = 0; t < to.length; t++) {
          const tv = toVals ? Math.abs(toVals[t]) : 0.3
          const strength = Math.min(1, (fv + tv) / 2)
          if (strength < 0.05) continue
          ctx.beginPath()
          ctx.moveTo(from[f].x, from[f].y)
          ctx.lineTo(to[t].x, to[t].y)
          ctx.strokeStyle = `rgba(124,109,250,${strength * 0.22})`
          ctx.lineWidth = 0.4 + strength * 1.5
          ctx.stroke()
        }
      }
    }

    // Draw nodes
    layers.forEach((l, li) => {
      nodePositions[li].forEach((pos, ni) => {
        const val = l.vals ? Math.min(1, Math.abs(l.vals[ni])) : 0
        const r = 6 + val * 6

        if (val > 0.3) {
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, r + 5, 0, Math.PI * 2)
          ctx.fillStyle = `${l.color}22`
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
        ctx.fillStyle = val > 0.01 ? l.color + (Math.round(40 + val * 215).toString(16).padStart(2, '0')) : '#1a1a2e'
        ctx.fill()
        ctx.strokeStyle = l.color + '66'
        ctx.lineWidth = 1.2
        ctx.stroke()

        // Show activation value inside node
        if (val > 0.01) {
          ctx.fillStyle = '#ffffffcc'
          ctx.font = '7px monospace'
          ctx.textAlign = 'center'
          ctx.fillText(val.toFixed(2), pos.x, pos.y + 2.5)
        }
      })
    })

    // Labels
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    layers.forEach((l) => {
      ctx.fillStyle = l.color + 'cc'
      ctx.fillText(l.label, l.x, H - 6)
    })

  }, [features, hiddenActs, width, height, layerConfig])

  // Mouse hover for tooltip
  const handleMouseMove = useCallback((e) => {
    const canvas = ref.current
    if (!canvas || !nodesRef.current?.layers) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left) * (width / rect.width)
    const my = (e.clientY - rect.top) * (height / rect.height)
    const { layers, nodePositions } = nodesRef.current
    // Check nodes
    for (let li = 0; li < layers.length; li++) {
      for (let ni = 0; ni < nodePositions[li].length; ni++) {
        const pos = nodePositions[li][ni]
        const dx = mx - pos.x, dy = my - pos.y
        if (dx * dx + dy * dy < 144) { // radius ~12px
          const val = layers[li].vals?.[ni]
          const label = `${layers[li].label} [${ni}]`
          setTooltip({
            x: e.clientX - ref.current.parentElement.getBoundingClientRect().left,
            y: e.clientY - ref.current.parentElement.getBoundingClientRect().top - 40,
            text: `${label}\nact: ${val != null ? val.toFixed(4) : '—'}`,
          })
          return
        }
      }
    }
    setTooltip(null)
  }, [width, height])

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas ref={ref} width={width} height={height}
        style={{ width, height, cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      />
      {tooltip && (
        <div style={{
          position: 'absolute', left: tooltip.x, top: tooltip.y,
          background: '#0d0d1aee', border: '1px solid #7c6dfa55',
          borderRadius: '6px', padding: '4px 8px',
          fontSize: '0.6rem', fontFamily: 'monospace', color: '#e2e8f0',
          pointerEvents: 'none', whiteSpace: 'pre', zIndex: 10,
          transform: 'translate(-50%, -100%)',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

// ── Sparkline (mini chart) ────────────────────────────────────────────────────
function Sparkline({ data, color, width = 160, height = 36, label }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = width
    const H = canvas.height = height
    ctx.clearRect(0, 0, W, H)

    const max = Math.max(...data, 0.001)
    const min = Math.min(...data, 0)

    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = H - ((v - min) / (max - min + 0.001)) * (H - 4) - 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Fill under
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = color + '15'
    ctx.fill()
  }, [data, color, width, height])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <canvas ref={ref} width={width} height={height} style={{ width, height, borderRadius: '4px', background: '#0a0a16' }} />
      {label && <span style={{ fontSize: '0.6rem', color: color, fontFamily: 'monospace' }}>{label}</span>}
    </div>
  )
}

// ── Apps Row ───────────────────────────────────────────────────────────────────
const APPS = [
  {
    label: 'Dígitos manuscritos', Icon: Hash, desc: 'MNIST',
    funciona: 'Clasifica con >98% de precisión usando backprop.',
    explica: 'No revela por qué los humanos reconocemos el "3". Correlaciona píxeles sin comprender forma.',
    color: '#7c6dfa',
  },
  {
    label: 'Tasas cambiarias', Icon: TrendingUp, desc: 'Mercados',
    funciona: 'Predice tendencias de corto plazo mejor que regresión lineal.',
    explica: 'No modela causas económicas reales. Aprende correlaciones sin mecanismo.',
    color: '#22c55e',
  },
  {
    label: 'Células precancerosas', Icon: Microscope, desc: 'Papanicolau',
    funciona: 'Detecta patrones morfológicos con alta sensibilidad clínica.',
    explica: 'No entiende biología celular. Representaciones internas opacas al médico.',
    color: '#06b6d4',
  },
  {
    label: 'Espejos de telescopio', Icon: Telescope, desc: 'Óptica',
    funciona: 'Optimiza formas del espejo que maximizan resolución.',
    explica: 'No deduce leyes físicas. Opera como caja negra dentro del pipeline óptico.',
    color: '#f59e0b',
  },
]

// ── Main Slide ─────────────────────────────────────────────────────────────────
export default function S07_AlcancesYCritica({ profesorMode }) {
  const [hiddenLayers, setHiddenLayers] = useState([12, 8])
  const [totalEpochs, setTotalEpochs]   = useState(100)
  const { ready, epoch, maxEpoch, acc, lossHist, accHist, hiddenActs, predict, restart, training, speed, updateSpeed } = useAnimalNet(hiddenLayers, totalEpochs)
  const [features, setFeatures] = useState([1,0,0,1,0,0,1,1]) // default: gato
  const [probs, setProbs] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [activeApp, setActiveApp] = useState(null)
  const [showArchModal, setShowArchModal] = useState(false)
  const [showNetFullscreen, setShowNetFullscreen] = useState(false)

  // ── Architecture controls ─────────────────
  const addLayer = () => {
    if (hiddenLayers.length >= 4) return
    setHiddenLayers(prev => [...prev, 8])
  }
  const removeLayer = (idx) => {
    if (hiddenLayers.length <= 1) return
    setHiddenLayers(prev => prev.filter((_, i) => i !== idx))
  }
  const setLayerUnits = (idx, units) => {
    setHiddenLayers(prev => prev.map((u, i) => i === idx ? units : u))
  }

  // Predict when features change or model ready
  useEffect(() => {
    if (!ready) return
    const p = predict(features)
    if (p) setProbs(p)
  }, [features, ready, predict])

  // ESC to close fullscreen network
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowNetFullscreen(false) }
    if (showNetFullscreen) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [showNetFullscreen])

  const toggleFeature = (idx) => {
    setFeatures(prev => {
      const next = [...prev]
      next[idx] = next[idx] ? 0 : 1
      return next
    })
    setSelectedPreset(-1)
  }

  const selectAnimal = (idx) => {
    setFeatures([...ANIMALS[idx].features])
    setSelectedPreset(idx)
  }

  const bestIdx = probs ? probs.indexOf(Math.max(...probs)) : -1
  const confidence = probs ? Math.max(...probs) : 0

  return (
    <div className="section-slide" style={{ gap: '0.8rem', padding: '0.5rem 1rem' }}>
      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div className="section-title" style={{ fontSize: '1.6rem' }}>Alcances + Primera Crítica</div>
        <div className="section-subtitle" style={{ fontSize: '0.95rem' }}>
          Funciona. Pero ¿<STTooltip term="modelo">explica</STTooltip>?
        </div>
      </div>

      {/* Apps row — expandable funciona/explica */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1100px', width: '100%', alignItems: 'start' }}>
        {APPS.map((a, i) => {
          const isOpen = activeApp === i
          return (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => setActiveApp(isOpen ? null : i)}
              whileHover={{ scale: 1.02 }}
              style={{
                flex: '1 1 180px',
                background: isOpen ? `rgba(${hexRgb(a.color)},0.08)` : 'var(--bg-3)',
                border: `1px solid ${isOpen ? a.color + '88' : 'var(--border)'}`,
                borderTop: `3px solid ${a.color}`,
                borderRadius: '10px',
                padding: '0.6rem 0.9rem',
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: a.color, display: 'flex', alignItems: 'center' }}><a.Icon size={20} strokeWidth={1.8} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', color: isOpen ? a.color : 'var(--text-h)', fontWeight: 600 }}>{a.label}</div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-dim)' }}>{a.desc}</div>
                </div>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} style={{ display: 'flex', alignItems: 'center', color: a.color }}><ChevronDown size={14} strokeWidth={2} /></motion.span>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ maxHeight: 0, opacity: 0 }}
                    animate={{ maxHeight: 160, opacity: 1 }}
                    exit={{ maxHeight: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ paddingTop: '0.55rem', marginTop: '0.45rem', borderTop: `1px solid ${a.color}33`, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#22c55e', fontFamily: 'monospace' }}>FUNCIONA ✓</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text)', lineHeight: 1.45, margin: '0.1rem 0 0' }}>{a.funciona}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6rem', color: '#ef4444', fontFamily: 'monospace' }}>NO EXPLICA ✗</span>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.45, margin: '0.1rem 0 0', fontStyle: 'italic' }}>{a.explica}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Main interactive area */}
      <div style={{
        display: 'flex', gap: '1rem', width: '100%', maxWidth: '1150px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '14px', padding: '1rem 1.2rem',
      }}>
        {/* LEFT: Feature toggles */}
        <div style={{ flex: '0 0 210px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.2rem', letterSpacing: '0.08em' }}>
            RASGOS DE ENTRADA
          </div>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              onClick={() => toggleFeature(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.3rem 0.5rem',
                borderRadius: '6px',
                background: features[i] ? 'rgba(124,109,250,0.15)' : 'transparent',
                border: `1px solid ${features[i] ? '#7c6dfa55' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: '28px', height: '16px', borderRadius: '8px',
                background: features[i] ? '#7c6dfa' : '#2a2a3a',
                position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute', top: '2px',
                  left: features[i] ? '14px' : '2px',
                  transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ color: features[i] ? 'var(--accent)' : 'var(--text-dim)', display: 'flex', alignItems: 'center' }}><f.Icon size={14} strokeWidth={1.8} /></span>
              <span style={{ fontSize: '0.78rem', color: features[i] ? 'var(--text-h)' : 'var(--text-dim)' }}>
                {f.label}
              </span>
            </motion.div>
          ))}
          {/* Animal presets */}
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginTop: '0.4rem', letterSpacing: '0.06em' }}>
            PRESETS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {ANIMALS.map((a, i) => (
              <motion.button
                key={a.name}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectAnimal(i)}
                style={{
                  padding: '0.25rem 0.5rem', borderRadius: '6px',
                  border: selectedPreset === i ? `1px solid ${a.color}` : '1px solid var(--border)',
                  background: selectedPreset === i ? a.color + '22' : 'transparent',
                  color: selectedPreset === i ? a.color : 'var(--text-dim)',
                  fontSize: '0.72rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '3px',
                }}
              >
                <span>{a.emoji}</span> {a.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* CENTER: Animated network — full width horizontal */}
        <div style={{
          flex: '1 1 auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minWidth: '280px', gap: '0.3rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', justifyContent: 'center' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              RED NEURONAL {N_FEAT}→{hiddenLayers.join('→')}→{N_CLASS}
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowArchModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '2px 8px', borderRadius: '5px',
                border: '1px solid #7c6dfa44', background: 'rgba(124,109,250,0.1)',
                color: '#a78bfa', fontSize: '0.58rem', fontFamily: 'monospace', cursor: 'pointer',
              }}>
              <Settings2 size={11} strokeWidth={2} /> Arquitectura
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowNetFullscreen(true)}
              title="Ver red en pantalla completa"
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '2px 8px', borderRadius: '5px',
                border: '1px solid #06b6d444', background: 'rgba(6,182,212,0.1)',
                color: '#67e8f9', fontSize: '0.58rem', fontFamily: 'monospace', cursor: 'pointer',
              }}>
              <Maximize2 size={11} strokeWidth={2} /> Maximizar
            </motion.button>
          </div>
          <motion.div
            animate={{ opacity: training ? [0.6, 1, 0.6] : 1 }}
            transition={{ repeat: training ? Infinity : 0, duration: 1.5 }}
          >
            <NetworkCanvas features={features} hiddenActs={hiddenActs} layerConfig={hiddenLayers} width={480} height={320} />
          </motion.div>
        </div>

        {/* RIGHT: Prediction */}
        <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
            PREDICCIÓN
          </div>

          {/* Best prediction card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={bestIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                background: ready && bestIdx >= 0 ? ANIMALS[bestIdx].color + '18' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${ready && bestIdx >= 0 ? ANIMALS[bestIdx].color + '66' : 'var(--border)'}`,
                borderRadius: '12px',
                padding: '0.8rem 1rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>
                {ready && bestIdx >= 0 ? ANIMALS[bestIdx].emoji : <HelpCircle size={36} strokeWidth={1.5} color="var(--text-dim)" />}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: ready && bestIdx >= 0 ? ANIMALS[bestIdx].color : 'var(--text-dim)', marginTop: '0.3rem' }}>
                {ready && bestIdx >= 0 ? ANIMALS[bestIdx].name : training ? 'Entrenando…' : '—'}
              </div>
              {ready && probs && (
                <div style={{ fontSize: '0.75rem', color: confidence > 0.7 ? '#22c55e' : '#eab308', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                  {(confidence * 100).toFixed(1)}% confianza
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Probability bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {ANIMALS.map((a, i) => {
              const p = probs ? probs[i] : 0
              const isBest = i === bestIdx && ready
              return (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.85rem', width: '20px', textAlign: 'center' }}>{a.emoji}</span>
                  <div style={{ flex: 1, height: '10px', background: '#111122', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      animate={{ width: `${(ready ? p : 0) * 100}%` }}
                      transition={{ duration: 0.3 }}
                      style={{
                        height: '100%',
                        background: isBest ? `linear-gradient(90deg, ${a.color}, ${a.color}cc)` : '#333355',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                  <span style={{
                    fontSize: '0.6rem', fontFamily: 'monospace', width: '34px', textAlign: 'right',
                    color: isBest ? a.color : '#555',
                  }}>
                    {ready ? (p * 100).toFixed(0) + '%' : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Training controls bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '1150px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '0.5rem 1rem',
      }}>
        {/* Epoch / status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px' }}>
          <motion.div
            animate={training ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            style={{ display: 'flex', alignItems: 'center', color: training ? '#7c6dfa' : '#22c55e' }}
          >
            {training
              ? <LoaderCircle size={18} strokeWidth={1.8} />
              : <CheckCircle2 size={18} strokeWidth={1.8} />}
          </motion.div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-h)', fontFamily: 'monospace' }}>
              {ready ? `Entrenada — ${(acc * 100).toFixed(1)}% acc` : `Época ${epoch}/${maxEpoch}`}
            </div>
            {/* Progress bar */}
            <div style={{ width: '140px', height: '5px', background: '#111122', borderRadius: '3px', marginTop: '2px', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${(epoch / maxEpoch) * 100}%` }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%', background: ready ? '#22c55e' : '#7c6dfa', borderRadius: '3px' }}
              />
            </div>
          </div>
        </div>

        {/* Speed control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>rápido</span>
          <input
            type="range" min={20} max={600} step={10}
            value={speed}
            onChange={e => updateSpeed(Number(e.target.value))}
            style={{ width: '90px', accentColor: '#7c6dfa', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>lento</span>
          <span style={{ fontSize: '0.6rem', color: '#7c6dfa', fontFamily: 'monospace', width: '42px' }}>
            {speed}ms
          </span>
        </div>

        {/* Sparklines */}
        <div style={{ display: 'flex', gap: '0.8rem', flex: 1, justifyContent: 'center' }}>
          <Sparkline data={lossHist} color="#ef4444" width={140} height={32} label={`loss: ${lossHist.length ? lossHist[lossHist.length-1].toFixed(3) : '—'}`} />
          <Sparkline data={accHist} color="#22c55e" width={140} height={32} label={`acc: ${accHist.length ? (accHist[accHist.length-1]*100).toFixed(1)+'%' : '—'}`} />
        </div>

        {/* Restart button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={restart}
          disabled={training}
          style={{
            padding: '0.45rem 1rem',
            borderRadius: '8px',
            border: '1px solid #7c6dfa55',
            background: training ? '#1a1a2e' : 'rgba(124,109,250,0.15)',
            color: training ? 'var(--text-dim)' : '#a78bfa',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: training ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}
        >
          <RefreshCw size={15} strokeWidth={2} style={{ flexShrink: 0 }} /> {training ? 'Entrenando…' : 'Reiniciar'}
        </motion.button>
      </div>

      {/* Daugman closure */}

      {/* Architecture Modal */}
      <AnimatePresence>
        {showArchModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowArchModal(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#0d0d1a', border: '1px solid #7c6dfa55', borderRadius: '16px',
                padding: '1.5rem 2rem', width: '420px', maxWidth: '90vw',
                display: 'flex', flexDirection: 'column', gap: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={16} strokeWidth={2} color="#7c6dfa" />
                  <span style={{ fontSize: '0.9rem', color: '#a78bfa', fontWeight: 700, fontFamily: 'monospace' }}>ARQUITECTURA DE LA RED</span>
                </div>
                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowArchModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex' }}>
                  <X size={18} strokeWidth={2} />
                </motion.button>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                {N_FEAT} → {hiddenLayers.join(' → ')} → {N_CLASS}
              </div>

              {hiddenLayers.map((units, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', color: HIDDEN_COLORS[i % HIDDEN_COLORS.length], fontFamily: 'monospace', width: '70px', flexShrink: 0 }}>
                    Oculta {i + 1}
                  </span>
                  <input
                    type="range" min={2} max={32} step={1} value={units}
                    onChange={e => setLayerUnits(i, Number(e.target.value))}
                    style={{ flex: 1, accentColor: HIDDEN_COLORS[i % HIDDEN_COLORS.length], cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-h)', fontFamily: 'monospace', width: '30px', textAlign: 'center', fontWeight: 600 }}>
                    {units}
                  </span>
                  {hiddenLayers.length > 1 && (
                    <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onClick={() => removeLayer(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: '2px' }}>
                      <Minus size={16} strokeWidth={2} />
                    </motion.button>
                  )}
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {hiddenLayers.length < 4 && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={addLayer}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '0.35rem 0.8rem', borderRadius: '6px',
                      border: '1px dashed rgba(124,109,250,0.4)', background: 'transparent',
                      color: '#7c6dfa', fontSize: '0.75rem', fontFamily: 'monospace', cursor: 'pointer',
                    }}>
                    <Plus size={14} strokeWidth={2.5} /> Añadir capa
                  </motion.button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', borderTop: '1px solid #ffffff11' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>Épocas</span>
                <input
                  type="range" min={10} max={300} step={10} value={totalEpochs}
                  onChange={e => setTotalEpochs(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#22c55e', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#22c55e', fontFamily: 'monospace', fontWeight: 600, width: '35px' }}>{totalEpochs}</span>
              </div>

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                onClick={() => { restart(); setShowArchModal(false) }} disabled={training}
                style={{
                  width: '100%', padding: '0.6rem 0',
                  borderRadius: '8px', border: '1px solid #7c6dfa55',
                  background: training ? '#1a1a2e' : 'rgba(124,109,250,0.15)',
                  color: training ? 'var(--text-dim)' : '#a78bfa',
                  fontSize: '0.85rem', fontWeight: 600, cursor: training ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                }}>
                <RefreshCw size={14} strokeWidth={2} /> {training ? 'Entrenando…' : 'Entrenar con esta arquitectura'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Network Modal */}
      <AnimatePresence>
        {showNetFullscreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowNetFullscreen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 1100, gap: '0.5rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                background: '#08081a', border: '1px solid #7c6dfa44', borderRadius: '18px',
                padding: '1rem 1.5rem', maxWidth: '95vw', maxHeight: '92vh',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Maximize2 size={15} strokeWidth={2} color="#06b6d4" />
                  <span style={{ fontSize: '0.8rem', color: '#67e8f9', fontWeight: 700, fontFamily: 'monospace' }}>
                    RED NEURONAL {N_FEAT}→{hiddenLayers.join('→')}→{N_CLASS}
                  </span>
                  {ready && (
                    <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#22c55e', marginLeft: '0.5rem' }}>
                      {(acc * 100).toFixed(1)}% acc — Época {epoch}/{maxEpoch}
                    </span>
                  )}
                </div>
                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNetFullscreen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex' }}>
                  <Minimize2 size={18} strokeWidth={2} />
                </motion.button>
              </div>

              {/* Large Network Canvas */}
              <NetworkCanvas
                features={features} hiddenActs={hiddenActs}
                layerConfig={hiddenLayers}
                width={Math.min(1600, Math.round(window.innerWidth * 0.88))}
                height={Math.min(800, Math.round(window.innerHeight * 0.72))}
                modelRef={modelRef}
              />

              {/* Compact info bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                fontSize: '0.6rem', fontFamily: 'monospace', color: 'var(--text-dim)',
              }}>
                <span style={{ color: '#7c6dfa' }}>Capas: {hiddenLayers.join(', ')}</span>
                <span>•</span>
                <span>Hover sobre nodos para ver activaciones</span>
                <span>•</span>
                <span style={{ color: '#67e8f9', cursor: 'pointer' }} onClick={() => setShowNetFullscreen(false)}>ESC para cerrar</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daugman closure */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          width: '100%', maxWidth: '1150px',
          background: 'rgba(6,182,212,0.05)',
          border: '1px solid rgba(6,182,212,0.25)',
          borderLeft: '4px solid #06b6d4',
          borderRadius: '0 10px 10px 0',
          padding: '0.8rem 1.5rem',
        }}
      >
        <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: '#06b6d4' }}>Daugman (1992):</strong>{' '}
          Cada época interpreta el cerebro con su tecnología dominante. La red <em>funciona</em> — clasifica
          animales por rasgos — pero ¿<em>describe el mecanismo real</em> del cerebro, o es nuestra mejor herramienta
          actual para <STTooltip term="modelo">imitarlo</STTooltip>?
        </p>
      </motion.div>

      {/* Badges + floating */}
      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
        <STModalBadge symbol="O" content="EPISTEMOLOGICAL_GAP" title="Brecha Epistemológica" />
      </div>

      <STFloatingButton />

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1100px', width: '100%', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--yellow)' }}>Arquitectura:</strong>{' '}
          {N_FEAT} rasgos → {hiddenLayers.map(u => `${u} ReLU`).join(' → ')} → {N_CLASS} softmax. Adam lr=0.015, {totalEpochs} épocas, batch 32.
          Dato clave: la red clasifica animales por rasgos binarios, <em>no por imagen</em>.
          Eso es exactamente lo que Hinton defendía: representaciones distribuidas de propiedades,
          no patrones de píxeles. La pregunta ST: ¿una red que clasifica "gato" por 8 bits
          realmente <em>reconoce</em> un gato?
        </div>
      )}
    </div>
  )
}

function hexRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '124,109,250'
}
