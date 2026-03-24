import { useState, useEffect, useRef, useCallback } from 'react'
import * as tf from '@tensorflow/tfjs'

// ── Spiral dataset ────────────────────────────────────────────────────────────
export function generateSpiral(n = 100, noise = 0.12) {
  const X = [], y = []
  for (let c = 0; c < 2; c++) {
    for (let i = 0; i < n; i++) {
      const r = i / n
      const t = (i / n) * 2.6 * Math.PI + c * Math.PI
      X.push([
        r * Math.sin(t) + (Math.random() - 0.5) * noise,
        r * Math.cos(t) + (Math.random() - 0.5) * noise,
      ])
      y.push(c)
    }
  }
  return { X, y }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useNeuralNet({ hiddenSizes = [8, 8], lr = 0.04, gridRes = 48, nPoints = 100 } = {}) {
  const modelRef      = useRef(null)
  const dataRef       = useRef(null)
  const xsRef         = useRef(null)
  const ysRef         = useRef(null)
  const runningRef    = useRef(false)
  const isFittingRef = useRef(false)
  const speedRef      = useRef(60)
  const gridResRef    = useRef(gridRes)
  const initConfigRef = useRef({ hiddenSizes, lr, gridRes, nPoints })

  const [epoch, setEpoch] = useState(0)
  const [loss, setLoss] = useState(1.0)
  const [accuracy, setAccuracy] = useState(0.5)
  const [lossHistory, setLossHistory] = useState([1.0])
  const [accuracyHistory, setAccuracyHistory] = useState([0.5])
  const [weights, setWeights] = useState([])  // [{matrix, shape}]
  const [gridPreds, setGridPreds] = useState([])  // flat, gridRes² values ∈ [0,1]
  const [activations, setActivations] = useState([])  // [inputVec, l1Acts, ..., outputActs]
  const [gradMags, setGradMags] = useState([])  // [{flat, rms, shape}]
  const [training, setTraining] = useState(false)
  const [speed, setSpeed] = useState(60)

  useEffect(() => {
    gridResRef.current = gridRes
  }, [gridRes])

  // ── Internal helpers ─────────────────────────────────────────────────────────
  const snapWeights = useCallback((model) => {
    const ws = []
    model.layers.forEach(l => {
      const wts = l.getWeights()
      if (wts.length) ws.push({ matrix: wts[0].arraySync(), shape: wts[0].shape })
    })
    setWeights(ws)
  }, [])

  const computeGrid = useCallback((model) => {
    tf.tidy(() => {
      const resolution = gridResRef.current
      const pts = []
      for (let row = 0; row < resolution; row++) {
        for (let col = 0; col < resolution; col++) {
          const span = Math.max(resolution - 1, 1)
          pts.push([(col / span) * 2 - 1, (row / span) * 2 - 1])
        }
      }
      const preds = model.predict(tf.tensor2d(pts))
      setGridPreds(Array.from(preds.dataSync()))
    })
  }, [])

  const computeActivations = useCallback((model, sample) => {
    tf.tidy(() => {
      let x = tf.tensor2d([sample])
      const acts = [sample]
      for (const layer of model.layers) {
        x = layer.apply(x)
        acts.push(Array.from(x.dataSync()))
      }
      setActivations(acts)
    })
  }, [])

  const computeGrads = useCallback((model) => {
    const xs = xsRef.current
    const ys = ysRef.current
    if (!xs || !ys) return
    try {
      tf.tidy(() => {
        const { grads } = tf.variableGrads(() => {
          const pred = model.predict(xs)
          return tf.losses.sigmoidCrossEntropy(ys, pred).mean()
        })
        const result = []
        Object.values(grads).forEach(g => {
          const data = Array.from(g.abs().dataSync())
          const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length)
          result.push({ flat: data, rms, shape: g.shape })
        })
        setGradMags(result)
      })
    } catch (error) {
      void error
    }
  }, [])

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    tf.ready().then(() => {
      if (cancelled) return
      const { hiddenSizes: sizes, lr: learningRate, nPoints: totalPoints } = initConfigRef.current
      const data = generateSpiral(totalPoints)
      dataRef.current = data
      xsRef.current = tf.tensor2d(data.X)
      ysRef.current = tf.tensor2d(data.y, [data.y.length, 1])

      const model = tf.sequential()
      model.add(tf.layers.dense({ units: sizes[0], activation: 'relu', inputShape: [2] }))
      sizes.slice(1).forEach(u =>
        model.add(tf.layers.dense({ units: u, activation: 'relu' }))
      )
      model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
      model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      })
      modelRef.current = model

      snapWeights(model)
      computeGrid(model)
      computeActivations(model, data.X[0])
    })

    return () => {
      cancelled = true
      runningRef.current = false
      try { modelRef.current?.dispose() } catch (error) { void error }
      try { xsRef.current?.dispose() } catch (error) { void error }
      try { ysRef.current?.dispose() } catch (error) { void error }
    }
  }, [computeActivations, computeGrid, snapWeights])

  // ── Train step ────────────────────────────────────────────────────────────────
  const doStep = useCallback(async () => {
    const model = modelRef.current
    const xs = xsRef.current
    const ys = ysRef.current
    if (!model || !xs || !ys || isFittingRef.current) return

    isFittingRef.current = true
    try {
      const res = await model.fit(xs, ys, { epochs: 1, batchSize: 64, shuffle: true })
      const l = res.history.loss[0]
      const a = (res.history.acc ?? res.history.accuracy)?.[0] ?? 0

      setLoss(l)
      setAccuracy(a)
      setLossHistory(h => [...h.slice(-79), l])
      setAccuracyHistory(h => [...h.slice(-79), a])
      setEpoch(e => {
        const ne = e + 1
        if (ne % 5  === 0) computeGrid(model)
        if (ne % 3  === 0) snapWeights(model)
        if (ne % 10 === 0) computeGrads(model)
        if (ne % 5  === 0 && dataRef.current)
          computeActivations(model, dataRef.current.X[Math.floor(Math.random() * dataRef.current.X.length)])
        return ne
      })
    } finally {
      isFittingRef.current = false
    }
  }, [computeActivations, computeGrads, computeGrid, snapWeights])

  const start = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setTraining(true)
    while (runningRef.current) {
      await doStep()
      await new Promise(r => setTimeout(r, speedRef.current))
    }
    setTraining(false)
  }, [doStep])

  const stop = useCallback(() => {
    runningRef.current = false
    setTraining(false)
  }, [])

  const step = useCallback(async () => {
    stop()
    await new Promise(r => setTimeout(r, 20))
    await doStep()
  }, [doStep, stop])

  const reset = useCallback(() => {
    stop()
    const model = modelRef.current
    if (!model) return
    model.layers.forEach(l => {
      const wts = l.getWeights()
      if (wts.length) {
        const newW = wts.map(w => tf.randomNormal(w.shape, 0, 0.3))
        l.setWeights(newW)
        newW.forEach(w => w.dispose())
      }
    })
    setEpoch(0)
    setLoss(1.0)
    setAccuracy(0.5)
    setLossHistory([1.0])
    setAccuracyHistory([0.5])
    snapWeights(model)
    computeGrid(model)
    setGradMags([])
    if (dataRef.current) computeActivations(model, dataRef.current.X[0])
  }, [computeActivations, computeGrid, snapWeights, stop])

  const getActivationsFor = useCallback((sample) => {
    const model = modelRef.current
    if (model && sample) computeActivations(model, sample)
  }, [computeActivations])

  const updateSpeed = useCallback((ms) => {
    speedRef.current = ms
    setSpeed(ms)
  }, [])

  return {
    epoch, loss, accuracy, lossHistory, accuracyHistory, weights, gridPreds, activations, gradMags, training,
    data: dataRef.current,
    gridRes,
    speed, updateSpeed,
    start, stop, step, reset, getActivationsFor,
  }
}
