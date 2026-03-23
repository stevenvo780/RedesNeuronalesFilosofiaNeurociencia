import { useRef, useEffect, useState, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'
import STTensionPanel from '../components/st/STTensionPanel'

// ── Digit patterns 5×5 (0..9) ─────────────────────────────────────────────────
const DIGIT_PATTERNS = [
  [0,1,1,1,0, 1,0,0,0,1, 1,0,0,0,1, 1,0,0,0,1, 0,1,1,1,0], // 0
  [0,0,1,0,0, 0,1,1,0,0, 0,0,1,0,0, 0,0,1,0,0, 0,1,1,1,0], // 1
  [0,1,1,1,0, 0,0,0,0,1, 0,0,1,1,0, 0,1,0,0,0, 1,1,1,1,1], // 2
  [1,1,1,1,0, 0,0,0,0,1, 0,1,1,1,0, 0,0,0,0,1, 1,1,1,1,0], // 3
  [1,0,0,0,1, 1,0,0,0,1, 1,1,1,1,1, 0,0,0,0,1, 0,0,0,0,1], // 4
  [1,1,1,1,1, 1,0,0,0,0, 1,1,1,1,0, 0,0,0,0,1, 1,1,1,1,0], // 5
  [0,1,1,1,0, 1,0,0,0,0, 1,1,1,1,0, 1,0,0,0,1, 0,1,1,1,0], // 6
  [1,1,1,1,1, 0,0,0,0,1, 0,0,0,1,0, 0,0,1,0,0, 0,1,0,0,0], // 7
  [0,1,1,1,0, 1,0,0,0,1, 0,1,1,1,0, 1,0,0,0,1, 0,1,1,1,0], // 8
  [0,1,1,1,0, 1,0,0,0,1, 0,1,1,1,1, 0,0,0,0,1, 0,1,1,1,0], // 9
]
const GRID = 5
const N_IN = GRID * GRID // 25

// Add noise to a pattern (flip bits randomly)
function addNoise(pattern, p = 0.12) {
  return pattern.map(v => Math.random() < p ? 1 - v : v)
}

// Generate training dataset
function buildDataset(repeats = 60) {
  const X = [], y = []
  for (let d = 0; d < 10; d++) {
    for (let r = 0; r < repeats; r++) {
      X.push(addNoise(DIGIT_PATTERNS[d], 0.10))
      y.push(d)
    }
  }
  return { X, y }
}

// ── Digit Network (trained locally) ──────────────────────────────────────────
function useDigitNet() {
  const modelRef    = useRef(null)
  const [ready,     setReady]     = useState(false)
  const [trainAcc,  setTrainAcc]  = useState(0)
  const [trainEpoch,setTrainEpoch]= useState(0)

  useEffect(() => {
    tf.ready().then(async () => {
      const model = tf.sequential()
      model.add(tf.layers.dense({ units: 32, activation: 'relu', inputShape: [N_IN] }))
      model.add(tf.layers.dense({ units: 24, activation: 'relu' }))
      model.add(tf.layers.dense({ units: 10, activation: 'softmax' }))
      model.compile({ optimizer: tf.train.adam(0.01), loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] })

      const { X, y } = buildDataset(60)
      const xs = tf.tensor2d(X)
      const ys = tf.tensor1d(y, 'int32')

      // Train in chunks to allow React to breathe
      const EPOCHS = 120
      const CHUNK  = 20
      for (let e = 0; e < EPOCHS; e += CHUNK) {
        const res = await model.fit(xs, ys, {
          epochs: Math.min(CHUNK, EPOCHS - e),
          batchSize: 64,
          shuffle: true,
          validationSplit: 0.1,
        })
        const acc = res.history.acc?.slice(-1)[0] ?? res.history.accuracy?.slice(-1)[0] ?? 0
        setTrainAcc(acc)
        setTrainEpoch(e + Math.min(CHUNK, EPOCHS - e))
        await new Promise(r => setTimeout(r, 0))
      }

      xs.dispose(); ys.dispose()
      modelRef.current = model
      setReady(true)
    })

    return () => { try { modelRef.current?.dispose() } catch (_) {} }
  }, [])

  const predict = useCallback((pattern) => {
    const model = modelRef.current
    if (!model || !ready) return null
    return tf.tidy(() => {
      const xs = tf.tensor2d([pattern])
      const probs = model.predict(xs).dataSync()
      return Array.from(probs)
    })
  }, [ready])

  return { ready, trainAcc, trainEpoch, predict }
}

// ── Draw pad ─────────────────────────────────────────────────────────────────
function DrawPad({ pixels, setPixels }) {
  const CELL = 38
  const isDrawingRef = useRef(false)
  const [drawMode, setDrawMode] = useState(1) // 1=draw, 0=erase

  const handleCell = (i, erase = false) => {
    setPixels(prev => {
      const next = [...prev]
      next[i] = erase ? 0 : drawMode
      return next
    })
  }

  const onMouseDown = (i, e) => {
    e.preventDefault()
    isDrawingRef.current = true
    const erasing = e.button === 2
    setDrawMode(erasing ? 0 : 1)
    handleCell(i, erasing)
  }
  const onMouseEnter = (i, e) => {
    if (!isDrawingRef.current) return
    handleCell(i, drawMode === 0)
  }

  useEffect(() => {
    const up = () => { isDrawingRef.current = false }
    window.addEventListener('mouseup', up)
    return () => window.removeEventListener('mouseup', up)
  }, [])

  return (
    <div>
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID}, ${CELL}px)`, gap: '2px', userSelect: 'none' }}
        onContextMenu={e => e.preventDefault()}
      >
        {pixels.map((v, i) => (
          <div
            key={i}
            onMouseDown={e => onMouseDown(i, e)}
            onMouseEnter={e => onMouseEnter(i, e)}
            style={{
              width: CELL, height: CELL,
              borderRadius: '4px',
              background: v ? `rgba(124,109,250,${0.4 + v * 0.6})` : '#1a1a2a',
              border: `1px solid ${v ? '#7c6dfa55' : '#2a2a3a'}`,
              cursor: 'crosshair',
              transition: 'background 0.05s',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        <button
          onClick={() => setPixels(Array(N_IN).fill(0))}
          style={{ padding: '0.3rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-dim)', fontSize: '0.72rem', cursor: 'pointer' }}
        >
          ↺ Limpiar
        </button>
        {[0,1,2,3,4,5,6,7,8,9].map(d => (
          <button
            key={d}
            onClick={() => setPixels([...DIGIT_PATTERNS[d]])}
            style={{ width: '24px', height: '24px', borderRadius: '3px', border: '1px solid var(--border)', background: 'var(--bg-3)', color: 'var(--text-dim)', fontSize: '0.7rem', cursor: 'pointer' }}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Probability bars ─────────────────────────────────────────────────────────
function ProbBars({ probs }) {
  if (!probs) return (
    <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', padding: '1rem', textAlign: 'center' }}>
      Dibuja un dígito para clasificar
    </div>
  )
  const maxIdx = probs.indexOf(Math.max(...probs))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {probs.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.72rem', color: i === maxIdx ? 'var(--accent-2)' : 'var(--text-dim)', fontWeight: i === maxIdx ? 700 : 400, fontFamily: 'monospace', width: '14px', textAlign: 'center' }}>{i}</span>
          <div style={{ flex: 1, height: '12px', background: '#1a1a2a', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${p * 100}%`,
              background: i === maxIdx ? 'linear-gradient(90deg,#7c6dfa,#a78bfa)' : '#333355',
              borderRadius: '3px',
              transition: 'width 0.2s',
            }} />
          </div>
          <span style={{ fontSize: '0.65rem', color: i === maxIdx ? '#a78bfa' : '#555', fontFamily: 'monospace', width: '38px' }}>
            {(p * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Slide ─────────────────────────────────────────────────────────────────────
const APPS = [
  { label: 'Reconocimiento de dígitos', icon: '🔢', desc: 'MNIST — escrito a mano' },
  { label: 'Tasas cambiarias',           icon: '📈', desc: 'Predicción de mercados' },
  { label: 'Células precancerosas',      icon: '🔬', desc: 'Detección en Papanicolau' },
  { label: 'Espejos de telescopio',      icon: '🔭', desc: 'Optimización óptica' },
]

export default function S07_AlcancesYCritica({ profesorMode }) {
  const { ready, trainAcc, trainEpoch, predict } = useDigitNet()
  const [pixels, setPixels]   = useState(Array(N_IN).fill(0))
  const [probs, setProbs]     = useState(null)

  // Run inference whenever pixels change
  useEffect(() => {
    if (!ready) return
    const p = predict(pixels)
    if (p) setProbs(p)
  }, [pixels, ready, predict])

  const predictedDigit = probs ? probs.indexOf(Math.max(...probs)) : null
  const confidence     = probs ? Math.max(...probs) : 0

  return (
    <div className="section-slide" style={{ gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Alcances + Primera crítica</div>
        <div className="section-subtitle">Funciona. Pero ¿explica?</div>
      </div>

      <div className="quote" style={{ maxWidth: '600px' }}>
        "Funciona. Reconoce dígitos, predice tasas cambiarias, detecta células precancerosas.
        Pero ¿está <em>explicando</em> cómo aprende el cerebro, o simplemente funciona?"
      </div>

      {/* Apps */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '680px', width: '100%' }}>
        {APPS.map(a => (
          <div key={a.label} style={{ flex: '1 1 130px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.55rem 0.7rem' }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{a.icon}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-h)', fontWeight: 600 }}>{a.label}</div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-dim)' }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {/* Live digit classifier */}
      <div style={{
        display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center',
        width: '100%', maxWidth: '720px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '1rem',
      }}>
        {/* Training status */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            Red TF.js local — {ready ? `entrenada · acc: ${(trainAcc * 100).toFixed(1)}%` : `entrenando... época ${trainEpoch}/120`}
          </span>
          <div style={{ width: '100px', height: '5px', background: '#1a1a2a', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(trainEpoch / 120) * 100}%`, background: ready ? '#22c55e' : '#7c6dfa', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* DrawPad */}
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
            Dibuja un dígito (clic + arrastre) · botón derecho = borrar
          </div>
          <DrawPad pixels={pixels} setPixels={setPixels} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '200px', flex: 1 }}>
          {/* Prediction */}
          <div style={{
            background: ready ? 'rgba(124,109,250,0.12)' : 'rgba(255,255,255,0.04)',
            border: `2px solid ${ready ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '8px', padding: '0.6rem 1rem', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.2rem' }}>clasificación</div>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-2)', lineHeight: 1 }}>
              {ready && predictedDigit !== null ? predictedDigit : '?'}
            </div>
            {ready && (
              <div style={{ fontSize: '0.65rem', color: confidence > 0.7 ? '#22c55e' : '#eab308', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                confianza: {(confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>

          {/* Probability bars */}
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '0.15rem', fontFamily: 'monospace' }}>
            distribución de probabilidades:
          </div>
          <ProbBars probs={ready ? probs : null} />
        </div>
      </div>

      {/* ST Tension Panel */}
      <div style={{ width: '100%', maxWidth: '760px' }}>
        <STTensionPanel />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '760px', width: '100%', fontSize: '0.78rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--yellow)' }}>Punto de quiebre:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            La red que clasificó tu dígito fue entrenada completamente en tu navegador — TF.js real.
            Arquitectura: 25→32→24→10, softmax, Adam lr=0.01, 120 épocas, 600 ejemplos ruidosos.
            La pregunta filosófica: ¿esta red <em>reconoce</em> dígitos o sólo <em>clasifica</em> patrones de píxeles?
          </span>
        </div>
      )}
    </div>
  )
}
