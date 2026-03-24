import { useState, useRef, useEffect, useImperativeHandle } from 'react'
import { Play, Pause, ArrowRight, ArrowLeft } from 'lucide-react'
import { useNeuralNet } from '../hooks/useNeuralNet'
import STTooltip from '../components/st/STTooltip'
import STFloatingButton from '../components/st/STFloatingButton'

const HISTORY = [
  { year: 1974, label: 'Werbos 1974', color: '#6b6b88', desc: 'Descubierto. Ignorado por una década.' },
  { year: 1982, label: '1982 (×2)',   color: '#eab308', desc: 'Redescubierto independientemente.' },
  { year: 1986, label: 'Hinton 1986', color: '#7c6dfa', desc: 'Publicado. El mundo lo escucha.' },
]

const STEPS = [
  { id: 'ea',      label: 'Error de activación',  color: '#ef4444', formula: 'EA_j = y_j - d_j',                  desc: 'Diferencia entre salida real y deseada.' },
  { id: 'ei',      label: 'Error de entrada',      color: '#eab308', formula: 'EI_j = EA_j \\cdot y_j(1-y_j)',    desc: 'Ponderado por la derivada de la sigmoide.' },
  { id: 'ew',      label: 'Error del peso',        color: '#7c6dfa', formula: 'EW_{ij} = EI_j \\cdot y_i',        desc: 'Responsabilidad de cada conexión en el error.' },
  { id: 'ea_prev', label: 'Propagar atrás',        color: '#a78bfa', formula: 'EA_i = \\sum_j EI_j \\cdot w_{ij}', desc: 'El error fluye hacia la capa anterior.' },
]

// ── Gradient flow network canvas ──────────────────────────────────────────────
function GradNetCanvas({ gradMags, activations, weights, mode, activeStep }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])

  // Initialize/reset particles when mode changes
  useEffect(() => {
    if (mode !== 'backward') { particlesRef.current = []; return }
    const layers = [2, 8, 8, 1]
    const newP = []
    layers.slice(0, -1).forEach((fromSize, l) => {
      for (let k = 0; k < 3; k++) {
        newP.push({
          layer: l,
          fromNode: Math.floor(Math.random() * fromSize),
          toNode: Math.floor(Math.random() * layers[l + 1]),
          t: Math.random(),
          speed: 0.008 + Math.random() * 0.012,
        })
      }
    })
    particlesRef.current = newP
  }, [mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf
    let W = 0, H = 0

    const setSize = () => {
      const nw = canvas.offsetWidth
      const nh = canvas.offsetHeight
      if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    const draw = () => {
      if (!W || !H) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      const layers = [2, 8, 8, 1]
      const lx = layers.map((_, l) => (W / (layers.length + 1)) * (l + 1))
      const nodeR = 22

      // ── Connections ──
      layers.slice(0, -1).forEach((fromSize, l) => {
        const toSize = layers[l + 1]

        for (let i = 0; i < fromSize; i++) {
          for (let j = 0; j < toSize; j++) {
            const x1f = mode === 'forward' ? lx[l] : lx[l + 1]
            const y1f = mode === 'forward' ? getY(H, fromSize, i) : getY(H, toSize, j)
            const x2f = mode === 'forward' ? lx[l + 1] : lx[l]
            const y2f = mode === 'forward' ? getY(H, toSize, j) : getY(H, fromSize, i)

            let alpha = 0.1
            let strokeColor = '#555577'

            if (mode === 'backward') {
              // Color by gradient magnitude for this specific weight if available
              const flatIdx = i * toSize + j
              const mag = gradMags[l]?.flat?.[flatIdx] ?? 0
              const maxMag = Math.max(...(gradMags[l]?.flat ?? [0.001]), 0.001)
              alpha = 0.15 + (mag / maxMag) * 0.7
              const rVal = Math.round(180 + 75 * (mag / maxMag))
              strokeColor = `rgba(${rVal}, 60, 60, ${alpha})`
            } else {
              const w = weights[l]?.matrix?.[i]?.[j] ?? 0
              alpha = Math.min(Math.abs(w) * 0.8, 0.6)
              strokeColor = w > 0 ? `rgba(124,109,250,${alpha})` : `rgba(239,68,68,${alpha})`
            }

            ctx.strokeStyle = strokeColor
            ctx.lineWidth = mode === 'backward' ? 1.5 : 1
            ctx.setLineDash(mode === 'backward' ? [4, 3] : [])
            ctx.beginPath()
            ctx.moveTo(x1f, y1f)
            ctx.lineTo(x2f, y2f)
            ctx.stroke()
          }
        }
        ctx.setLineDash([])
      })

      // ── Particles (backward mode) ──
      if (mode === 'backward') {
        particlesRef.current.forEach(p => {
          const l = p.layer
          const fromSize = layers[l]
          const toSize   = layers[l + 1]
          const x1 = lx[l + 1]; const y1 = getY(H, toSize, p.toNode)
          const x2 = lx[l];     const y2 = getY(H, fromSize, p.fromNode)
          const px = x1 + (x2 - x1) * p.t
          const py = y1 + (y2 - y1) * p.t
          const mag = gradMags[l]?.rms ?? 0.1
          const intensity = Math.min(mag * 5, 1)

          ctx.beginPath()
          ctx.arc(px, py, 3.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255,${Math.round(100 + 155 * (1 - intensity))},60,0.9)`
          ctx.fill()

          p.t = (p.t + p.speed) % 1
        })
      }

      // ── Nodes ──
      layers.forEach((size, l) => {
        const color = ['#06b6d4', '#7c6dfa', '#a78bfa', '#22c55e'][l]
        for (let i = 0; i < size; i++) {
          const x = lx[l]; const y = getY(H, size, i)
          const act = Array.isArray(activations[l]) ? activations[l][i] : (activations[l] ?? 0)
          const norm = Math.max(0, Math.min(1, act))
          const isOutput = l === layers.length - 1

          ctx.beginPath(); ctx.arc(x, y, nodeR, 0, Math.PI * 2)
          const g = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, nodeR)
          const alpha = mode === 'backward' && isOutput ? 0.9 : 0.25 + norm * 0.6
          g.addColorStop(0, `rgba(${hexRgb(color)},${Math.min(alpha + 0.15, 1)})`)
          g.addColorStop(1, `rgba(${hexRgb(color)},${alpha * 0.25})`)
          ctx.fillStyle = g; ctx.fill()

          if (mode === 'backward' && isOutput) {
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2.5
          } else {
            ctx.strokeStyle = color; ctx.lineWidth = 1.5
          }
          ctx.stroke()

          ctx.fillStyle = '#eee'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'
          ctx.fillText(norm.toFixed(2), x, y + 4)
        }
      })

      // ── Arrow label ──
      ctx.fillStyle = mode === 'forward' ? 'rgba(34,197,94,0.6)' : 'rgba(239,68,68,0.6)'
      ctx.font = '10px monospace'; ctx.textAlign = 'center'
      ctx.fillText(mode === 'forward' ? '→ forward pass' : '← error propagation', W / 2, H - 6)

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [gradMags, activations, weights, mode, activeStep])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}

function hexRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '124,109,250'
}
function getY(H, size, i) {
  const spacing = Math.min(60, (H - 60) / Math.max(size - 1, 1))
  return H / 2 - ((size - 1) * spacing) / 2 + i * spacing
}

// ── Per-equation animated canvas ──────────────────────────────────────────────
// Each step gets its OWN canvas with CYCLIC pulse animation showing recurrence
// HiDPI-aware rendering + interactive tooltips on hover

const CYCLE_PERIOD = 2200 // ms for one full pulse cycle
const REVEAL_DURATION = 900 // ms for initial staggered reveal
const EQ_MAX_WIDTH = '100%' // max width of equation containers (controls visual size)
const EQ_BW = 900  // virtual width of equation canvas
const EQ_BH = 300  // virtual height of equation canvas

// ── Radios centralizados para Nodos de Ecuaciones ──
const R_VAR = 35
const R_OP = 25
const R_RES = 45
const R_WIDE = 35

const EQ_CONFIGS = [
  // Step 0: EA_j = y_j − d_j
  {
    BW: EQ_BW, BH: EQ_BH,
    nodes: [
      { x: 105,  y: 120,  label: 'y_j',  sub: 'salida real', color: '#22c55e', r: R_VAR,
        tip: 'Salida real de la neurona j. Es el valor que la red produjo tras el forward pass.' },
      { x: 300, y: 120,  label: '−',     sub: '',            color: '#ef4444', r: R_OP, isOp: true,
        tip: 'Resta: se calcula la diferencia entre la salida real y la deseada.' },
      { x: 105,  y: 180,  label: 'd_j',   sub: 'deseada',     color: '#06b6d4', r: R_VAR,
        tip: 'Valor deseado (target). Lo que el profesor le dice a la red que debería haber producido.' },
      { x: 525, y: 120,  label: '=',     sub: '',            color: '#888',    r: R_OP, isOp: true,
        tip: 'Resultado de la operación.' },
      { x: 765, y: 120,  label: 'EA_j',  sub: 'error de activación', color: '#ef4444', r: R_RES, isResult: true,
        tip: 'Error de activación: cuánto se equivocó la neurona j. Es la señal que inicia todo el backprop.' },
    ],
    edges: [[0, 1], [2, 1], [1, 3], [3, 4]],
    title: 'Paso 1: Error de activación',
    desc: 'Diferencia entre lo que la red produjo y lo que debería haber producido',
  },
  // Step 1: EI_j = EA_j · y_j(1−y_j)
  {
    BW: EQ_BW, BH: EQ_BH,
    nodes: [
      { x: 90,  y: 120,  label: 'EA_j',      sub: 'error activación', color: '#ef4444', r: R_VAR,
        tip: 'Error de activación del paso anterior. Cuánto se equivocó la neurona.' },
      { x: 285, y: 120,  label: '×',          sub: '',                 color: '#eab308', r: R_OP, isOp: true,
        tip: 'Multiplicación: el error se pondera por la derivada de la sigmoide.' },
      { x: 90,  y: 180,  label: "y_j(1−y_j)", sub: "derivada σ'",     color: '#22c55e', r: R_WIDE, wide: true,
        tip: "Derivada de la sigmoide evaluada en y_j. Mide la 'pendiente' de la activación: si es plana, el error no pasa." },
      { x: 525, y: 120,  label: '=',          sub: '',                 color: '#888',    r: R_OP, isOp: true,
        tip: 'Resultado de la operación.' },
      { x: 765, y: 120,  label: 'EI_j',       sub: 'error de entrada', color: '#eab308', r: R_RES, isResult: true,
        tip: 'Error de entrada: cuánto debe cambiar la entrada total de la neurona j para reducir el error.' },
    ],
    edges: [[0, 1], [2, 1], [1, 3], [3, 4]],
    title: 'Paso 2: Error de entrada',
    desc: 'Pondera el error por la pendiente de la función de activación',
  },
  // Step 2: EW_ij = EI_j · y_i
  {
    BW: EQ_BW, BH: EQ_BH,
    nodes: [
      { x: 105,  y: 120,  label: 'EI_j', sub: 'error entrada',     color: '#eab308', r: R_VAR,
        tip: 'Error de entrada de la neurona j. Viene del paso anterior.' },
      { x: 300, y: 120,  label: '×',     sub: '',                   color: '#7c6dfa', r: R_OP, isOp: true,
        tip: 'Multiplicación: el error de entrada se multiplica por la activación que llegó por esa conexión.' },
      { x: 105,  y: 180,  label: 'y_i',   sub: 'activación origen',  color: '#22c55e', r: R_VAR,
        tip: 'Activación de la neurona i (capa anterior). Si fue alta, esa conexión tuvo más responsabilidad en el error.' },
      { x: 525, y: 120,  label: '=',     sub: '',                   color: '#888',    r: R_OP, isOp: true,
        tip: 'Resultado de la operación.' },
      { x: 765, y: 120,  label: 'EW_ij', sub: 'error del peso',    color: '#7c6dfa', r: R_RES, isResult: true,
        tip: 'Error del peso w_ij: cuánto y en qué dirección debe cambiar esta conexión específica. Es el gradiente.' },
    ],
    edges: [[0, 1], [2, 1], [1, 3], [3, 4]],
    title: 'Paso 3: Error del peso',
    desc: 'Cuánto debe cambiar cada conexión para reducir el error',
  },
  // Step 3: EA_i = Σ_j EI_j · w_ij
  {
    BW: EQ_BW, BH: EQ_BH,
    nodes: [
      { x: 90,  y: 120,  label: 'EI_j',  sub: 'error entrada', color: '#eab308', r: R_VAR,
        tip: 'Error de entrada de la neurona j. Puede haber varios j que se suman.' },
      { x: 90,  y: 180,  label: 'w_ij',   sub: 'peso',          color: '#7c6dfa', r: R_VAR,
        tip: 'Peso de la conexión entre i y j. Las conexiones más fuertes transmiten más error hacia atrás.' },
      { x: 285, y: 120,  label: '×',      sub: '',               color: '#a78bfa', r: R_OP, isOp: true,
        tip: 'Multiplicación: cada error de entrada se pondera por el peso de esa conexión.' },
      { x: 465, y: 120,  label: 'Σ_j',    sub: 'sumar',          color: '#a78bfa', r: R_VAR, isOp: true,
        tip: 'Sumatoria sobre todas las neuronas j de la capa siguiente. Se acumula la culpa de todas las conexiones salientes.' },
      { x: 600, y: 120,  label: '=',      sub: '',               color: '#888',    r: R_OP, isOp: true,
        tip: 'Resultado de la operación.' },
      { x: 780, y: 120,  label: 'EA_i',   sub: 'error → anterior', color: '#a78bfa', r: R_RES, isResult: true,
        tip: 'Error de activación de la neurona i (capa anterior). Este valor vuelve al Paso 1 para esa capa — es la recurrencia del backprop.' },
    ],
    edges: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5]],
    title: 'Paso 4: Propagar atrás',
    desc: 'El error se transmite a la capa anterior — el ciclo se repite',
  },
]

function SingleEquationCanvas({ config, isActive }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const mountRef = useRef(0)
  const [tooltip, setTooltip] = useState(null) // { x, y, text, color }

  useEffect(() => {
    mountRef.current = performance.now()
    // Avoid setting state here, instead clear it in the dependency effect if needed
  }, [isActive])

  // Mouse hit-test for tooltips
  useEffect(() => {
    let active = true;
    if (active) setTimeout(() => setTooltip(null), 0) // defer resetting state

    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const { BW, nodes } = config

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const scaleX = BW / rect.width
      // Convert mouse to BW-space coordinates
      const mx = (e.clientX - rect.left) * scaleX
      const my = (e.clientY - rect.top) * scaleX // uniform scale since aspect preserved

      let hit = null
      for (const node of nodes) {
        const hitR = (node.r || 14) + 8 // generous hit area
        const dx = mx - node.x, dy = my - node.y
        if (dx * dx + dy * dy < hitR * hitR) {
          hit = node
          break
        }
      }

      if (hit && hit.tip) {
        const wrapWidth = wrap.offsetWidth || rect.width || 400
        const tooltipLeft = Math.max(0, Math.min(e.clientX - rect.left, wrapWidth - 220))
        setTooltip({
          x: tooltipLeft,
          y: e.clientY - rect.top,
          text: hit.tip,
          color: hit.color,
          label: hit.label,
        })
      } else {
        setTooltip(null)
      }
    }
    const onLeave = () => setTooltip(null)

    wrap.addEventListener('mousemove', onMove)
    wrap.addEventListener('mouseleave', onLeave)
    return () => {
      wrap.removeEventListener('mousemove', onMove)
      wrap.removeEventListener('mouseleave', onLeave)
    }
  }, [config])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let raf
    let W = 0, H = 0
    const { BW, BH, nodes, edges } = config
    const dpr = window.devicePixelRatio || 1

    const setSize = () => {
      const logicalW = canvas.offsetWidth || BW
      const logicalH = Math.round(logicalW * BH / BW)
      const pixelW = Math.round(logicalW * dpr)
      const pixelH = Math.round(logicalH * dpr)
      if (pixelW !== W || pixelH !== H) {
        W = pixelW; H = pixelH
        canvas.width = W; canvas.height = H
        canvas.style.height = logicalH + 'px'
      }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    function draw(ts) {
      if (!W || !H) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      // Scale factor: maps BW virtual coords → physical pixels
      const s = W / BW
      ctx.clearRect(0, 0, W, H)

      const elapsed = ts - mountRef.current
      const revealPerNode = REVEAL_DURATION / nodes.length
      const getNodeAlpha = (ni) => {
        if (!isActive) return 0.15
        const nodeStart = ni * revealPerNode
        return Math.min(Math.max((elapsed - nodeStart) / 350, 0), 1)
      }

      const allRevealed = elapsed > REVEAL_DURATION + 400
      const cycleT = allRevealed ? ((elapsed - REVEAL_DURATION) % CYCLE_PERIOD) / CYCLE_PERIOD : -1

      // ── Edges ──
      edges.forEach(([from, to], ei) => {
        const n1 = nodes[from], n2 = nodes[to]
        const alphaFrom = getNodeAlpha(from)
        const alphaTo = getNodeAlpha(to)
        const edgeAlpha = Math.min(alphaFrom, alphaTo)

        if (edgeAlpha > 0.01) {
          ctx.beginPath()
          ctx.moveTo(n1.x * s, n1.y * s)
          ctx.lineTo(n2.x * s, n2.y * s)
          ctx.strokeStyle = n2.color || '#555'
          ctx.globalAlpha = edgeAlpha * 0.45
          ctx.lineWidth = 2 * s
          ctx.stroke()
          ctx.globalAlpha = 1

          // Arrow head
          const dx = n2.x - n1.x, dy = n2.y - n1.y
          const len = Math.sqrt(dx * dx + dy * dy)
          if (len > 0) {
            const ux = dx / len, uy = dy / len
            const tipX = (n2.x - ux * ((n2.r || 14) + 5)) * s
            const tipY = (n2.y - uy * ((n2.r || 14) + 5)) * s
            const as = 5 * s
            ctx.beginPath()
            ctx.moveTo(tipX + ux * as, tipY + uy * as)
            ctx.lineTo(tipX - uy * as * 0.55, tipY + ux * as * 0.55)
            ctx.lineTo(tipX + uy * as * 0.55, tipY - ux * as * 0.55)
            ctx.closePath()
            ctx.fillStyle = n2.color || '#555'
            ctx.globalAlpha = edgeAlpha * 0.6
            ctx.fill()
            ctx.globalAlpha = 1
          }

          // ── Cyclic pulse traveling along each edge ──
          if (isActive && cycleT >= 0) {
            const edgeFrac = ei / edges.length
            const localT = (cycleT - edgeFrac + 1) % 1
            const pulseWindow = 0.4
            if (localT < pulseWindow) {
              const t = localT / pulseWindow
              const px = (n1.x + (n2.x - n1.x) * t) * s
              const py = (n1.y + (n2.y - n1.y) * t) * s
              const pulseAlpha = Math.sin(t * Math.PI) * 0.9
              const pulseR = (4 + Math.sin(t * Math.PI) * 2) * s
              ctx.beginPath()
              ctx.arc(px, py, pulseR, 0, Math.PI * 2)
              ctx.fillStyle = n2.color
              ctx.globalAlpha = pulseAlpha
              ctx.shadowColor = n2.color
              ctx.shadowBlur = 14 * s
              ctx.fill()
              ctx.shadowBlur = 0
              ctx.globalAlpha = 1
            }
          }

          // Pulse during initial reveal
          if (isActive && !allRevealed && edgeAlpha > 0.05 && edgeAlpha < 0.95) {
            const t = edgeAlpha
            const px = (n1.x + (n2.x - n1.x) * t) * s
            const py = (n1.y + (n2.y - n1.y) * t) * s
            ctx.beginPath()
            ctx.arc(px, py, 5 * s, 0, Math.PI * 2)
            ctx.fillStyle = n2.color
            ctx.globalAlpha = Math.sin(t * Math.PI) * 0.85
            ctx.shadowColor = n2.color
            ctx.shadowBlur = 12 * s
            ctx.fill()
            ctx.shadowBlur = 0
            ctx.globalAlpha = 1
          }
        }
      })

      // ── Nodes ──
      nodes.forEach((node, ni) => {
        const alpha = getNodeAlpha(ni)
        const p = node
        const r = (p.r || 14) * s
        const isResult = p.isResult
        const isOp = p.isOp
        const wide = p.wide

        // Cyclic glow for result node
        if (isResult && isActive && allRevealed) {
          const arrivalT = ((cycleT - 0.85 + 1) % 1)
          const glowI = arrivalT < 0.3 ? Math.sin((arrivalT / 0.3) * Math.PI) : 0
          const baseGlow = 0.15 + Math.sin(ts * 0.003) * 0.08
          const glow = baseGlow + glowI * 0.35
          ctx.beginPath()
          ctx.arc(p.x * s, p.y * s, r + 10 * s, 0, Math.PI * 2)
          ctx.fillStyle = node.color
          ctx.globalAlpha = glow
          ctx.fill()
          ctx.globalAlpha = 1
        }

        // Glow during reveal
        if (isResult && alpha >= 0.95 && isActive && !allRevealed) {
          const gp = 0.3 + Math.sin(ts * 0.004) * 0.2
          ctx.beginPath()
          ctx.arc(p.x * s, p.y * s, r + 8 * s, 0, Math.PI * 2)
          ctx.fillStyle = node.color
          ctx.globalAlpha = gp * 0.2
          ctx.fill()
          ctx.globalAlpha = 1
        }

        // Non-result nodes: subtle pulse when cycle passes
        if (!isResult && !isOp && isActive && allRevealed) {
          const niFrac = ni / nodes.length
          const dist = Math.abs(((cycleT - niFrac + 1) % 1))
          if (dist < 0.15) {
            const hit = 1 - dist / 0.15
            ctx.beginPath()
            ctx.arc(p.x * s, p.y * s, r + 5 * s, 0, Math.PI * 2)
            ctx.fillStyle = node.color
            ctx.globalAlpha = hit * 0.2
            ctx.fill()
            ctx.globalAlpha = 1
          }
        }

        // Node shape
        if (wide) {
          const rw = 80 * s, rh = 28 * s, rx = p.x * s - rw / 2, ry = p.y * s - rh / 2, br = 7 * s
          ctx.beginPath()
          ctx.moveTo(rx + br, ry)
          ctx.lineTo(rx + rw - br, ry)
          ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + br)
          ctx.lineTo(rx + rw, ry + rh - br)
          ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - br, ry + rh)
          ctx.lineTo(rx + br, ry + rh)
          ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - br)
          ctx.lineTo(rx, ry + br)
          ctx.quadraticCurveTo(rx, ry, rx + br, ry)
          ctx.closePath()
        } else {
          ctx.beginPath()
          ctx.arc(p.x * s, p.y * s, r, 0, Math.PI * 2)
        }

        ctx.fillStyle = '#0c0c20'
        ctx.globalAlpha = Math.max(alpha, 0.08)
        ctx.fill()
        ctx.strokeStyle = node.color
        ctx.lineWidth = (isResult ? 2.5 : isOp ? 1.2 : 1.8) * s
        ctx.globalAlpha = Math.max(alpha, 0.12)
        ctx.stroke()
        ctx.globalAlpha = 1

        // Label
        const fontSize = isResult ? 28 : isOp ? 24 : 22
        ctx.fillStyle = node.color
        ctx.globalAlpha = Math.max(alpha, 0.1)
        ctx.font = `${isResult ? 'bold ' : ''}${fontSize * s}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.label, p.x * s, p.y * s + (isOp ? 0 : 1 * s))
        ctx.globalAlpha = 1

        // Sub label
        if (node.sub && alpha > 0.5) {
          ctx.fillStyle = '#666'
          ctx.globalAlpha = alpha * 0.85
          ctx.font = `${14 * s}px monospace`
          ctx.textBaseline = 'top'
          ctx.fillText(node.sub, p.x * s, (p.y + (p.r || 35) + 20) * s)
          ctx.globalAlpha = 1
        }
      })

      // ── Cycle indicator ──
      if (isActive && allRevealed) {
        const cx = (BW - 25) * s, cy = (BH - 18) * s, cr = 8 * s
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 1.5 * s
        ctx.globalAlpha = 0.4
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.beginPath()
        ctx.arc(cx, cy, cr, -Math.PI / 2, -Math.PI / 2 + cycleT * Math.PI * 2)
        ctx.strokeStyle = nodes[nodes.length - 1].color
        ctx.lineWidth = 2 * s
        ctx.globalAlpha = 0.7
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.fillStyle = '#888'
        ctx.globalAlpha = 0.5
        ctx.font = `${14 * s}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('↻', cx, cy + 0.5 * s)
        ctx.globalAlpha = 1
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [config, isActive])

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', cursor: 'crosshair' }}>
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y,
          maxWidth: '220px', padding: '0.5rem 0.65rem',
          background: 'rgba(10,10,30,0.95)', backdropFilter: 'blur(8px)',
          border: `1px solid ${tooltip.color}55`, borderRadius: '8px',
          pointerEvents: 'none', zIndex: 10,
          boxShadow: `0 4px 16px rgba(0,0,0,0.4), 0 0 8px ${tooltip.color}22`,
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: tooltip.color, marginBottom: '0.2rem', fontFamily: 'monospace' }}>
            {tooltip.label}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#ccc', lineHeight: 1.4 }}>
            {tooltip.text}
          </div>
        </div>
      )}
    </div>
  )
}

// Forward pass equation config — shown on initial entry
const FORWARD_CONFIG = {
  BW: EQ_BW, BH: EQ_BH,
  nodes: [
    { x: 90,  y: 120,  label: 'x_i',  sub: 'entradas',       color: '#06b6d4', r: R_VAR,
      tip: 'Valores de entrada a la neurona. Pueden ser datos crudos o activaciones de la capa anterior.' },
    { x: 90,  y: 180,  label: 'w_ij',  sub: 'pesos',          color: '#a78bfa', r: R_VAR,
      tip: 'Pesos sinápticos: la fuerza de cada conexión. Son los parámetros que el backprop va a ajustar.' },
    { x: 210, y: 120,  label: '×',     sub: '',                color: '#eab308', r: R_OP, isOp: true,
      tip: 'Cada entrada se multiplica por su peso correspondiente.' },
    { x: 345, y: 120,  label: 'Σ',     sub: 'suma',           color: '#eab308', r: R_OP + 4, isOp: true,
      tip: 'Suma ponderada: se suman todos los productos x_i · w_ij más el sesgo b_j.' },
    { x: 480, y: 120,  label: '+ b_j', sub: 'sesgo',          color: '#94a3b8', r: R_OP + 2, isOp: true,
      tip: 'Sesgo (bias): un valor que desplaza la activación. Permite que la neurona se active incluso sin entrada.' },
    { x: 630, y: 120,  label: 'f(·)',  sub: 'activación',     color: '#22c55e', r: R_WIDE + 1, wide: true,
      tip: 'Función de activación (sigmoide, ReLU, etc.). Introduce no-linealidad: sin ella, la red sería una simple regresión lineal.' },
    { x: 810, y: 120,  label: 'y_j',   sub: 'salida',         color: '#22c55e', r: R_RES, isResult: true,
      tip: 'Salida de la neurona j. Este valor se propaga a la siguiente capa o es la predicción final de la red.' },
  ],
  edges: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
  title: 'Forward Pass',
  desc: 'La señal fluye de entrada a salida — cada neurona computa su activación',
}

function BackpropEquationLine({ activeStep, mode }) {
  if (mode === 'forward') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#22c55e', fontWeight: 700 }}>
            {FORWARD_CONFIG.title}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>— {FORWARD_CONFIG.desc}</span>
        </div>
        <div style={{
          borderRadius: '8px', overflow: 'hidden',
          background: '#0a0a1e', border: '1px solid #22c55e44',
          maxWidth: EQ_MAX_WIDTH, margin: '0 auto',
        }}>
          <SingleEquationCanvas config={FORWARD_CONFIG} isActive={true} key="forward" />
        </div>
      </div>
    )
  }

  if (activeStep === null) {
    return (
      <div style={{
        height: '350px', maxWidth: EQ_MAX_WIDTH, margin: '0 auto',
        borderRadius: '8px', overflow: 'hidden',
        background: '#0a0a1e', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.8rem',
      }}>
        ← Selecciona un paso para ver la ecuación animada
      </div>
    )
  }

  const eq = EQ_CONFIGS[activeStep]
  if (!eq) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.78rem', color: STEPS[activeStep]?.color || '#888', fontWeight: 700 }}>
          {eq.title}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>— {eq.desc}</span>
      </div>
      <div style={{
        borderRadius: '8px', overflow: 'hidden',
        background: '#0a0a1e', border: `1px solid ${STEPS[activeStep]?.color || 'var(--border)'}44`,
        maxWidth: EQ_MAX_WIDTH, margin: '0 auto',
      }}>
        <SingleEquationCanvas config={eq} isActive={true} key={activeStep} />
      </div>
    </div>
  )
}

// ── Main slide ────────────────────────────────────────────────────────────────
export default function S06_Retropropagacion({ profesorMode, ref }) {
  const { gradMags, activations, weights, epoch, training, start, stop } = useNeuralNet({ hiddenSizes: [8, 8] })
  
  // Seq state: 0 = Forward, 1 = Backprop Inicio, 2 = Paso 1, 3 = Paso 2, 4 = Paso 3, 5 = Paso 4
  const [seqIndex, setSeqIndex] = useState(0)
  const seqRef = useRef(0)

  // Omitimos dependencias o usamos ref para evitar stale closures en imperative_handle
  useImperativeHandle(ref, () => ({
    advanceStep() {
      if (seqRef.current >= 5) return false
      seqRef.current++
      setSeqIndex(seqRef.current)
      return true
    },
    retreatStep() {
      if (seqRef.current <= 0) return false
      seqRef.current--
      setSeqIndex(seqRef.current)
      return true
    }
  }))

  const setStepIdx = (idx) => {
    seqRef.current = idx
    setSeqIndex(idx)
  }

  // Derived state
  const mode = seqIndex === 0 ? 'forward' : 'backward'
  const activeStep = seqIndex >= 2 ? seqIndex - 2 : null

  // Auto-start on slide mount, run indefinitely
  useEffect(() => {
    start()
    return () => stop()
  }, [start, stop])

  return (
    <div className="section-slide" style={{ gap: '0.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title"><STTooltip term="backpropagacion">Retropropagación</STTooltip></div>
        <div className="section-subtitle">Gradientes reales fluyendo — TF.js en vivo</div>
      </div>

      <div className="quote" style={{ maxWidth: '95%' }}>
        "En 1974 Werbos lo descubrió. Nadie lo escuchó.
        En 1986 Hinton lo popularizó. ¿Por qué costó 12 años?"
      </div>

      {/* ── Main layout: sidebar timeline + content ── */}
      <div style={{ display: 'flex', gap: '0.8rem', width: '100%', maxWidth: '100%', padding: '0 0.6rem', flex: 1, minHeight: 0 }}>

        {/* ── Vertical Timeline Sidebar ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
          width: '110px', minWidth: '110px', flexShrink: 0,
        }}>
          {HISTORY.map((h, i) => (
            <div key={h.year} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{
                width: '100%', background: 'var(--bg-3)',
                border: `1px solid ${h.color}33`, borderLeft: `3px solid ${h.color}`,
                borderRadius: '6px', padding: '0.35rem 0.5rem',
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: h.color }}>{h.label}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', lineHeight: 1.3 }}>{h.desc}</div>
              </div>
              {i < HISTORY.length - 1 && <div style={{ color: 'var(--border)', fontSize: '0.7rem' }}>↓</div>}
            </div>
          ))}
        </div>

        {/* ── Main content area ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Forward / Backprop toggle + Canvas */}
          <div style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '0.6rem 0.8rem',
          }}>
            {/* Sequential Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button onClick={() => setStepIdx(0)} style={{
                flex: 1, padding: '0.35rem', borderRadius: '8px',
                border: `1px solid ${mode === 'forward' ? '#22c55e' : 'var(--border)'}`,
                background: mode === 'forward' ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: mode === 'forward' ? '#22c55e' : 'var(--text-dim)',
                fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center',
              }}>
                <ArrowRight size={12} strokeWidth={2} style={{ flexShrink: 0 }} /> Forward
              </button>
              <button onClick={() => setStepIdx(1)} style={{
                flex: 1, padding: '0.35rem', borderRadius: '8px',
                border: `1px solid ${mode === 'backward' ? '#ef4444' : 'var(--border)'}`,
                background: mode === 'backward' ? 'rgba(239,68,68,0.12)' : 'transparent',
                color: mode === 'backward' ? '#ef4444' : 'var(--text-dim)',
                fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center',
              }}>
                <ArrowLeft size={12} strokeWidth={2} style={{ flexShrink: 0 }} /> Backprop
              </button>
            </div>

            {/* Network Canvas */}
            <div style={{ padding: 1, height: '420px', borderRadius: '8px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
              <GradNetCanvas gradMags={gradMags} activations={activations} weights={weights} mode={mode} activeStep={activeStep} />
              <div style={{ position: 'absolute', top: 6, right: 8, fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                época {epoch}
              </div>
              <button onClick={() => training ? stop() : start()} style={{
                position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
                padding: '0.25rem 0.8rem', borderRadius: '20px',
                border: `1px solid ${training ? 'rgba(239,68,68,0.5)' : 'rgba(124,109,250,0.5)'}`,
                background: training ? 'rgba(239,68,68,0.15)' : 'rgba(124,109,250,0.15)',
                backdropFilter: 'blur(8px)',
                color: training ? '#ef4444' : 'var(--accent-2)',
                fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.3rem', zIndex: 2,
              }}>
                {training
                  ? <><Pause size={10} strokeWidth={2} style={{ flexShrink: 0 }} /> Pausar</>
                  : <><Play  size={10} strokeWidth={2} style={{ flexShrink: 0 }} /> Entrenar</>}
              </button>
            </div>

            {/* Per-equation animated canvas */}
            <div style={{ marginTop: '0.5rem' }}>
              <BackpropEquationLine activeStep={activeStep} mode={mode} />
            </div>
          </div>

          {/* ── 4 step selector cards ── */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setStepIdx(i + 2)}
                style={{
                  flex: '1 1 120px',
                  background: activeStep === i ? `${s.color}14` : 'var(--bg-3)',
                  border: `1px solid ${activeStep === i ? s.color : 'var(--border)'}`,
                  borderTop: `3px solid ${s.color}`,
                  borderRadius: '6px', padding: '0.4rem 0.6rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: s.color, fontWeight: 600, marginBottom: '0.15rem' }}>
                  Paso {i + 1}: {s.label}
                </div>
                {profesorMode && (
                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--text-h)', marginBottom: '0.15rem' }}>
                    <code>{s.formula}</code>
                  </div>
                )}
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <STFloatingButton slideId="S06" />

      {profesorMode && (
        <div className="st-card" style={{ width: '100%', fontSize: '0.85rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Lo que ves:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            En modo Backprop, las conexiones se colorean según la magnitud real del gradiente (rojo brillante = mayor responsabilidad de <STTooltip term="error">error</STTooltip>).
            Las partículas animadas muestran el flujo de la <STTooltip term="derivada_del_error">derivada</STTooltip> de derecha a izquierda.
          </span>
          <br /><br />
          <strong style={{ color: '#eab308' }}>El problema de la <STTooltip term="plausibilidad_biologica">Plausibilidad Biológica</STTooltip>:</strong>{' '}
          <span style={{ color: 'var(--text-dim)' }}>
            El cerebro no envía señales de error hacia atrás por las mismas conexiones.
            Ningún mecanismo simétrico biológico conocido hace eso. Hinton reconoce este abismo ontológico: el algoritmo es efectivo computacionalmente pero una ficción biológica.
          </span>
        </div>
      )}
    </div>
  )
}
