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
  const modelRef   = useRef(null)
  const dataRef    = useRef(null)
  const xsRef      = useRef(null)
  const ysRef      = useRef(null)
  const runningRef = useRef(false)
  const speedRef   = useRef(60)

  const [epoch,       setEpoch]       = useState(0)
  const [loss,        setLoss]        = useState(1.0)
  const [accuracy,    setAccuracy]    = useState(0.5)
  const [weights,     setWeights]     = useState([])  // [{matrix, shape}]
  const [gridPreds,   setGridPreds]   = useState([])  // flat, gridRes² values ∈ [0,1]
  const [activations, setActivations] = useState([])  // [inputVec, l1Acts, ..., outputActs]
  const [gradMags,    setGradMags]    = useState([])  // [{flat, rms, shape}]
  const [training,    setTraining]    = useState(false)
  const [speed,       setSpeed]       = useState(60)

  // ── Internal helpers ─────────────────────────────────────────────────────────
  function snapWeights(model) {
    const ws = []
    model.layers.forEach(l => {
      const wts = l.getWeights()
      if (wts.length) ws.push({ matrix: wts[0].arraySync(), shape: wts[0].shape })
    })
    setWeights(ws)
  }

  function computeGrid(model) {
    tf.tidy(() => {
      const pts = []
      for (let row = 0; row < gridRes; row++)
        for (let col = 0; col < gridRes; col++)
          pts.push([(col / (gridRes - 1)) * 2 - 1, (row / (gridRes - 1)) * 2 - 1])
      const preds = model.predict(tf.tensor2d(pts))
      setGridPreds(Array.from(preds.dataSync()))
    })
  }

  function computeActivations(model, sample) {
    tf.tidy(() => {
      let x = tf.tensor2d([sample])
      const acts = [sample]
      for (const layer of model.layers) {
        x = layer.apply(x)
        acts.push(Array.from(x.dataSync()))
      }
      setActivations(acts)
    })
  }

  function computeGrads(model) {
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
    } catch (_) { /* gradient computation may fail before model is ready */ }
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    tf.ready().then(() => {
      const data = generateSpiral(nPoints)
      dataRef.current = data
      xsRef.current   = tf.tensor2d(data.X)
      ysRef.current   = tf.tensor2d(data.y, [data.y.length, 1])

      const model = tf.sequential()
      model.add(tf.layers.dense({ units: hiddenSizes[0], activation: 'relu', inputShape: [2] }))
      hiddenSizes.slice(1).forEach(u =>
        model.add(tf.layers.dense({ units: u, activation: 'relu' }))
      )
      model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }))
      model.compile({
        optimizer: tf.train.adam(lr),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      })
      modelRef.current = model

      snapWeights(model)
      computeGrid(model)
      computeActivations(model, data.X[0])
    })

    return () => {
      runningRef.current = false
      try { modelRef.current?.dispose() } catch (_) {}
      try { xsRef.current?.dispose() } catch (_) {}
      try { ysRef.current?.dispose() } catch (_) {}
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Train step ────────────────────────────────────────────────────────────────
  const doStep = useCallback(async () => {
    const model = modelRef.current
    const xs = xsRef.current
    const ys = ysRef.current
    if (!model || !xs || !ys) return

    const res = await model.fit(xs, ys, { epochs: 1, batchSize: 64, shuffle: true })
    const l = res.history.loss[0]
    const a = (res.history.acc ?? res.history.accuracy)?.[0] ?? 0

    setLoss(l)
    setAccuracy(a)
    setEpoch(e => {
      const ne = e + 1
      if (ne % 5  === 0) computeGrid(model)
      if (ne % 3  === 0) snapWeights(model)
      if (ne % 10 === 0) computeGrads(model)
      if (ne % 5  === 0 && dataRef.current)
        computeActivations(model, dataRef.current.X[Math.floor(Math.random() * 10)])
      return ne
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setEpoch(0); setLoss(1.0); setAccuracy(0.5)
    snapWeights(model)
    computeGrid(model)
    setGradMags([])
    if (dataRef.current) computeActivations(model, dataRef.current.X[0])
  }, [stop]) // eslint-disable-line react-hooks/exhaustive-deps

  const getActivationsFor = useCallback((sample) => {
    const model = modelRef.current
    if (model && sample) computeActivations(model, sample)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const updateSpeed = useCallback((ms) => {
    speedRef.current = ms
    setSpeed(ms)
  }, [])

  return {
    epoch, loss, accuracy, weights, gridPreds, activations, gradMags, training,
    data: dataRef.current,
    gridRes,
    speed, updateSpeed,
    start, stop, step, reset, getActivationsFor,
  }
}
