import { useRef, useEffect, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash, TrendingUp, Microscope, Telescope,
  Layers, Wind, Footprints, Leaf, Droplets, Thermometer, Moon,
  HelpCircle, LoaderCircle, CheckCircle2, RefreshCw, ChevronDown,
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
function useAnimalNet() {
  const modelRef = useRef(null)
  const stopRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [epoch, setEpoch] = useState(0)
  const [maxEpoch] = useState(100)
  const [acc, setAcc] = useState(0)
  const [lossHist, setLossHist] = useState([])
  const [accHist, setAccHist] = useState([])
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

    // Dispose previous model
    if (modelRef.current) { try { modelRef.current.dispose() } catch (_) {} }

    const model = tf.sequential()
    model.add(tf.layers.dense({ units: 12, activation: 'relu', inputShape: [N_FEAT] }))
    model.add(tf.layers.dense({ units: 8, activation: 'relu' }))
    model.add(tf.layers.dense({ units: N_CLASS, activation: 'softmax' }))
    model.compile({
      optimizer: tf.train.adam(0.015),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy'],
    })

    const { X, y } = buildDataset(80)
    const xs = tf.tensor2d(X)
    const ys = tf.tensor2d(y)

    const TOTAL = 100
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

      // Extract hidden activations for visualization every 5 epochs
      if ((e + 1) % 3 === 0 || e === TOTAL - 1) {
        tf.tidy(() => {
          const sampleIn = tf.tensor2d([ANIMALS[0].features])
          // Get activations from each layer
          const h1Model = tf.model({ inputs: model.input, outputs: model.layers[0].output })
          const h2Model = tf.model({ inputs: model.input, outputs: model.layers[1].output })
          const h1 = h1Model.predict(sampleIn).dataSync()
          const h2 = h2Model.predict(sampleIn).dataSync()
          const out = model.predict(sampleIn).dataSync()
          setHiddenActs({ h1: Array.from(h1), h2: Array.from(h2), out: Array.from(out) })
        })
      }

      // Let React breathe
      await new Promise(r => setTimeout(r, 30))
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
    return tf.tidy(() => {
      const inp = tf.tensor2d([features])
      // Also get hidden acts for live viz
      const h1Model = tf.model({ inputs: model.input, outputs: model.layers[0].output })
      const h2Model = tf.model({ inputs: model.input, outputs: model.layers[1].output })
      const h1 = Array.from(h1Model.predict(inp).dataSync())
      const h2 = Array.from(h2Model.predict(inp).dataSync())
      const probs = Array.from(model.predict(inp).dataSync())
      setHiddenActs({ h1, h2, out: probs })
      return probs
    })
  }, [ready])

  const restart = useCallback(() => {
    stopRef.current = true
    setTimeout(() => train(), 100)
  }, [train])

  return { ready, epoch, maxEpoch, acc, lossHist, accHist, hiddenActs, predict, restart, training }
}

// ── Animated Network Canvas ────────────────────────────────────────────────────
function NetworkCanvas({ features, hiddenActs, width = 340, height = 280 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = width
    const H = canvas.height = height
    ctx.clearRect(0, 0, W, H)

    // Layer positions
    const layers = [
      { n: 8,  x: 35,  vals: features, color: '#7c6dfa', label: 'entrada' },
      { n: 12, x: 125, vals: hiddenActs?.h1, color: '#06b6d4', label: 'oculta 1' },
      { n: 8,  x: 215, vals: hiddenActs?.h2, color: '#a78bfa', label: 'oculta 2' },
      { n: 6,  x: 305, vals: hiddenActs?.out, color: '#22c55e', label: 'salida' },
    ]

    // Compute node Y positions
    const nodePositions = layers.map(l => {
      const spacing = Math.min(28, (H - 40) / (l.n + 1))
      const startY = (H - (l.n - 1) * spacing) / 2
      return Array.from({ length: l.n }, (_, i) => ({ x: l.x, y: startY + i * spacing }))
    })

    // Draw connections (lighter)
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
          ctx.strokeStyle = `rgba(124,109,250,${strength * 0.18})`
          ctx.lineWidth = 0.3 + strength * 1.2
          ctx.stroke()
        }
      }
    }

    // Draw nodes
    layers.forEach((l, li) => {
      nodePositions[li].forEach((pos, ni) => {
        const val = l.vals ? Math.min(1, Math.abs(l.vals[ni])) : 0
        const r = 5 + val * 5

        // Glow
        if (val > 0.3) {
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, r + 4, 0, Math.PI * 2)
          ctx.fillStyle = `${l.color}22`
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
        ctx.fillStyle = val > 0.01 ? l.color + (Math.round(40 + val * 215).toString(16).padStart(2, '0')) : '#1a1a2e'
        ctx.fill()
        ctx.strokeStyle = l.color + '66'
        ctx.lineWidth = 1
        ctx.stroke()
      })
    })

    // Labels
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    layers.forEach((l, li) => {
      ctx.fillStyle = l.color + 'aa'
      ctx.fillText(l.label, l.x, H - 4)
    })

  }, [features, hiddenActs, width, height])

  return <canvas ref={ref} width={width} height={height} style={{ width, height }} />
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
  const { ready, epoch, maxEpoch, acc, lossHist, accHist, hiddenActs, predict, restart, training } = useAnimalNet()
  const [features, setFeatures] = useState([1,0,0,1,0,0,1,1]) // default: gato
  const [probs, setProbs] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [activeApp, setActiveApp] = useState(null)

  // Predict when features change or model ready
  useEffect(() => {
    if (!ready) return
    const p = predict(features)
    if (p) setProbs(p)
  }, [features, ready, predict])

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

        {/* CENTER: Animated network */}
        <div style={{
          flex: '1 1 340px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minWidth: '280px',
        }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.3rem' }}>
            RED NEURONAL 8→12→8→6
          </div>
          <motion.div
            animate={{ opacity: training ? [0.6, 1, 0.6] : 1 }}
            transition={{ repeat: training ? Infinity : 0, duration: 1.5 }}
          >
            <NetworkCanvas features={features} hiddenActs={hiddenActs} width={340} height={260} />
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
          8 rasgos → 12 ReLU → 8 ReLU → 6 softmax. Adam lr=0.015, 100 épocas, batch 32.
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
