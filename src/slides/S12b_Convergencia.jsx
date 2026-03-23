import STTooltip from '../components/st/STTooltip'
import STFloatingButton from '../components/st/STFloatingButton'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// ── Pre-compute deterministic dendrite branches ───────────────────────────────
function buildBranches(cx, cy, W, H) {
  const branches = []
  const rootAngles = [
    -Math.PI * 0.5, -Math.PI * 0.72, -Math.PI * 0.28,
    Math.PI * 0.78, Math.PI * 0.55, Math.PI,
    -Math.PI * 0.1, Math.PI * 0.1,
  ]
  function addBranch(x, y, angle, len, depth, seed) {
    if (depth === 0 || len < 4) return
    const ex = x + Math.cos(angle) * len
    const ey = y + Math.sin(angle) * len
    branches.push({ x1: x, y1: y, x2: ex, y2: ey, depth, angle, seed })
    const spread = 0.38 + ((seed * 7919) % 100) / 100 * 0.3
    addBranch(ex, ey, angle - spread, len * 0.62, depth - 1, (seed * 31 + 17) % 997)
    addBranch(ex, ey, angle + spread, len * 0.62, depth - 1, (seed * 53 + 29) % 997)
  }
  const baseLen = Math.min(W, H) * 0.18
  rootAngles.forEach((a, i) => addBranch(cx, cy, a, baseLen, 3, i * 13 + 7))
  return branches
}

// ── Biological neuron canvas ───────────────────────────────────────────────────
function BioNeuronCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    let id, branches = null
    let W = 0, H = 0

    const setSize = () => {
      const nw = canvas.offsetWidth || 300
      const nh = canvas.offsetHeight || 220
      if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H; branches = null }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    function draw(ts) {
      if (!W || !H) { id = requestAnimationFrame(draw); return }
      const t = ts * 0.001
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = '#04040e'; ctx.fillRect(0, 0, W, H)

      const cx = W * 0.5, cy = H * 0.42
      if (!branches) branches = buildBranches(cx, cy, W, H)

      // ── Dendrites ──
      branches.forEach(b => {
        const wave = 0.07 * Math.sin(t * 0.9 + b.seed * 0.4)
        const mx = (b.x1 + b.x2) / 2 + Math.sin(b.angle + Math.PI / 2) * wave * 30
        const my = (b.y1 + b.y2) / 2 + Math.cos(b.angle + Math.PI / 2) * wave * 30
        const glow = 0.5 + 0.35 * Math.sin(t * 1.1 + b.seed * 0.3)
        const alpha = (0.15 + b.depth * 0.12) * glow
        ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.quadraticCurveTo(mx, my, b.x2, b.y2)
        ctx.strokeStyle = `rgba(34,197,94,${alpha})`
        ctx.lineWidth = b.depth * 0.9; ctx.stroke()
        // synaptic knob at leaf
        if (b.depth === 1) {
          const kPulse = 0.5 + 0.5 * Math.sin(t * 1.8 + b.seed)
          ctx.beginPath(); ctx.arc(b.x2, b.y2, 2.8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(34,197,94,${0.5 + kPulse * 0.5})`
          ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 7 * kPulse; ctx.fill(); ctx.shadowBlur = 0
        }
      })

      // ── Soma outer glow ──
      const somaPulse = 0.7 + 0.3 * Math.sin(t * 1.4)
      const somaR = Math.min(W, H) * 0.095
      const grd0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, somaR * 2.8)
      grd0.addColorStop(0, `rgba(34,197,94,${0.18 * somaPulse})`); grd0.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath(); ctx.arc(cx, cy, somaR * 2.8, 0, Math.PI * 2); ctx.fillStyle = grd0; ctx.fill()

      // ── Soma ──
      ctx.beginPath(); ctx.arc(cx, cy, somaR, 0, Math.PI * 2)
      const sGrd = ctx.createRadialGradient(cx - somaR * 0.3, cy - somaR * 0.3, 0, cx, cy, somaR)
      sGrd.addColorStop(0, `rgba(120,255,160,${somaPulse})`)
      sGrd.addColorStop(0.5, `rgba(34,197,94,${0.75 * somaPulse})`)
      sGrd.addColorStop(1, 'rgba(8,55,28,0.6)')
      ctx.fillStyle = sGrd; ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 18 * somaPulse
      ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5; ctx.stroke()
      // nucleus
      ctx.beginPath(); ctx.arc(cx, cy, somaR * 0.42, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(10,80,40,0.7)'; ctx.fill()

      // ── Axon ──
      const axY0 = cy + somaR, axY1 = H - 22
      ctx.beginPath(); ctx.moveTo(cx, axY0); ctx.lineTo(cx, axY1)
      ctx.strokeStyle = 'rgba(34,197,94,0.5)'; ctx.lineWidth = 3.5; ctx.stroke()

      // Myelin sheaths
      for (let m = 0; m < 4; m++) {
        const my = axY0 + (axY1 - axY0) * (m + 0.5) / 4.5
        ctx.beginPath(); ctx.ellipse(cx, my, 8, 16, 0, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200,230,215,0.14)'; ctx.fill()
        ctx.strokeStyle = 'rgba(200,230,215,0.1)'; ctx.lineWidth = 0.8; ctx.stroke()
      }

      // Action potential
      const apP = (t * 0.38) % 1
      const apY = axY0 + (axY1 - axY0) * apP
      const apA = Math.sin(apP * Math.PI) * 0.95
      if (apA > 0.05) {
        const apG = ctx.createRadialGradient(cx, apY, 0, cx, apY, 14)
        apG.addColorStop(0, `rgba(140,255,160,${apA})`); apG.addColorStop(0.4, `rgba(34,197,94,${apA * 0.5})`); apG.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(cx, apY, 14, 0, Math.PI * 2); ctx.fillStyle = apG; ctx.fill()
      }

      // Axon terminals
      for (let k = -1; k <= 1; k++) {
        const tx = cx + k * 20, ty = axY1 + 14
        ctx.beginPath(); ctx.moveTo(cx, axY1); ctx.lineTo(tx, ty)
        ctx.strokeStyle = 'rgba(34,197,94,0.45)'; ctx.lineWidth = 2; ctx.stroke()
        const tP = 0.5 + 0.45 * Math.sin(t * 2 + k * 1.2)
        ctx.beginPath(); ctx.arc(tx, ty, 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34,197,94,${tP})`
        ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 8 * tP; ctx.fill(); ctx.shadowBlur = 0
      }

      ctx.fillStyle = '#22c55e'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
      ctx.fillText('neurona biológica · área 7a', W / 2, H - 5)
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
}

// ── Artificial unit canvas ─────────────────────────────────────────────────────
function ArtNeuronCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    let id
    let W = 0, H = 0
    const W_VALS = [0.8, -0.45, 0.6, -0.3, 0.9]

    const setSize = () => {
      const nw = canvas.offsetWidth || 300
      const nh = canvas.offsetHeight || 220
      if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    function draw(ts) {
      if (!W || !H) { id = requestAnimationFrame(draw); return }
      const t = ts * 0.001
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#04040e'; ctx.fillRect(0, 0, W, H)

      const iX = W * 0.18, sX = W * 0.54, oX = W * 0.86
      const n = 5
      const iYs = Array.from({ length: n }, (_, i) => H * 0.15 + i * (H * 0.7 / (n - 1)))
      const cY = H * 0.5

      // ── Input→Σ connections + pulses ──
      iYs.forEach((iy, i) => {
        const w = W_VALS[i]
        const wc = w > 0 ? '#7c6dfa' : '#ef4444'
        ctx.beginPath(); ctx.moveTo(iX + 13, iy); ctx.lineTo(sX - 22, cY)
        ctx.strokeStyle = w > 0 ? `rgba(124,109,250,${0.1 + Math.abs(w) * 0.25})` : `rgba(239,68,68,${0.1 + Math.abs(w) * 0.25})`
        ctx.lineWidth = Math.max(0.5, Math.abs(w) * 3); ctx.stroke()

        const pOff = i * 0.2, pT = ((t * 0.45) + pOff) % 1
        const pA = Math.sin(pT * Math.PI) * 0.9
        if (pA > 0.06) {
          const px = (iX + 13) + ((sX - 22) - (iX + 13)) * pT
          const py = iy + (cY - iy) * pT
          const g = ctx.createRadialGradient(px, py, 0, px, py, 8)
          g.addColorStop(0, `${w > 0 ? 'rgba(167,139,250,' : 'rgba(255,90,90,'}${pA})`)
          g.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
        }

        // input node
        ctx.beginPath(); ctx.arc(iX, iy, 13, 0, Math.PI * 2)
        ctx.fillStyle = '#080818'; ctx.strokeStyle = `${wc}66`; ctx.lineWidth = 1.5; ctx.fill(); ctx.stroke()
        ctx.fillStyle = wc; ctx.font = `bold ${Math.round(W * 0.028)}px monospace`; ctx.textAlign = 'center'
        ctx.fillText(`x${i + 1}`, iX, iy + 4)

        // weight label
        const mlx = ((iX + 13) + (sX - 22)) * 0.5
        const mly = iy + (cY - iy) * 0.5
        ctx.fillStyle = `${wc}bb`; ctx.font = `${Math.round(W * 0.024)}px monospace`
        ctx.fillText((w > 0 ? '+' : '') + w.toFixed(1), mlx + (i % 2 === 0 ? -8 : 8), mly - 2)
      })

      // ── Σ → output connection ──
      const opT = ((t * 0.45) + 0.65) % 1
      const opA = Math.sin(opT * Math.PI) * 0.9
      ctx.beginPath(); ctx.moveTo(sX + 22, cY); ctx.lineTo(oX - 16, cY)
      ctx.strokeStyle = 'rgba(124,109,250,0.45)'; ctx.lineWidth = 2.8; ctx.stroke()
      if (opA > 0.06) {
        const px = (sX + 22) + ((oX - 16) - (sX + 22)) * opT
        const g = ctx.createRadialGradient(px, cY, 0, px, cY, 9)
        g.addColorStop(0, `rgba(190,170,255,${opA})`); g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(px, cY, 9, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
      }

      // ── Σ node (central unit) ──
      const uP = 0.6 + 0.4 * Math.sin(t * 1.4)
      const hG = ctx.createRadialGradient(sX, cY, 0, sX, cY, 34)
      hG.addColorStop(0, `rgba(124,109,250,${0.35 * uP})`); hG.addColorStop(1, 'rgba(124,109,250,0.02)')
      ctx.beginPath(); ctx.arc(sX, cY, 34, 0, Math.PI * 2); ctx.fillStyle = hG; ctx.fill()
      ctx.beginPath(); ctx.arc(sX, cY, 22, 0, Math.PI * 2)
      ctx.fillStyle = '#0d0d28'
      ctx.strokeStyle = `rgba(124,109,250,${0.5 + uP * 0.5})`; ctx.lineWidth = 2.5
      ctx.shadowColor = '#7c6dfa'; ctx.shadowBlur = 16 * uP; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
      ctx.fillStyle = `rgba(167,139,250,${0.7 + uP * 0.3})`
      ctx.font = `bold ${Math.round(W * 0.055)}px monospace`; ctx.textAlign = 'center'
      ctx.fillText('Σ', sX, cY - 2)
      ctx.fillStyle = '#7c6dfa'; ctx.font = `${Math.round(W * 0.028)}px monospace`
      ctx.fillText('f(·)', sX, cY + 13)

      // ── Output node ──
      const oP = 0.5 + 0.5 * Math.sin(t * 1.4 + 0.9)
      ctx.beginPath(); ctx.arc(oX, cY, 16, 0, Math.PI * 2)
      ctx.fillStyle = '#0b0b1f'
      ctx.strokeStyle = `rgba(124,109,250,${0.4 + oP * 0.6})`; ctx.lineWidth = 2
      ctx.shadowColor = '#7c6dfa'; ctx.shadowBlur = 12 * oP; ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0
      ctx.fillStyle = '#a78bfa'; ctx.font = `bold ${Math.round(W * 0.038)}px monospace`; ctx.textAlign = 'center'
      ctx.fillText('ŷ', oX, cY + 4)

      ctx.fillStyle = '#7c6dfa'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
      ctx.fillText('unidad entrenada (red)', W / 2, H - 5)
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(id); ro.disconnect() }
  }, [])
  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
}

function ReceptiveFieldCanvas({ type }) {
  return type === 'bio' ? <BioNeuronCanvas /> : <ArtNeuronCanvas />
}

export default function S12b_Convergencia({ profesorMode }) {
  // Stagger variants
  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.18 } } }
  const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } } }
  const fadeScale = (delay = 0) => ({
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    transition: { delay, duration: 0.5, ease: 'easeOut' },
  })

  return (
    <motion.div
      className="section-slide"
      style={{ gap: '1.8rem' }}
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Title */}
      <motion.div variants={fadeUp} style={{ textAlign: 'center' }}>
        <div className="section-title">Convergencia Empírica: Andersen & Zipser</div>
        <div className="section-subtitle">La apuesta de Hinton ante la evidencia</div>
      </motion.div>

      {/* Quote */}
      <motion.div
        variants={fadeUp}
        className="quote"
        style={{ maxWidth: '950px', fontSize: '1.1rem' }}
      >
        "Andersen y Zipser entrenaron una red con <STTooltip term="retropropagación">retropropagación</STTooltip> para transformar coordenadas espaciales entre marcos de referencia. Las <STTooltip term="unidades ocultas">unidades ocultas</STTooltip> desarrollaron propiedades similares a las neuronas reales de la corteza parietal de mono (área 7a). La red no fue diseñada para imitarlas — emergió sola."
      </motion.div>

      {/* Visual comparison — receptive fields */}
      <motion.div
        variants={fadeUp}
        style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1000px' }}
      >
        {[
          { type: 'bio', label: 'Neurona biológica', sublabel: 'Corteza parietal de mono, área 7a', color: '#22c55e' },
          { type: 'net', label: 'Unidad artificial entrenada', sublabel: 'Red entrenada con retropropagación', color: '#7c6dfa' },
        ].map((item, idx) => (
          <motion.div
            key={item.type}
            {...fadeScale(0.35 + idx * 0.25)}
            whileHover={{ scale: 1.02, boxShadow: `0 0 28px ${item.color}33` }}
            style={{
              flex: '1 1 300px',
              background: 'var(--bg-3)',
              border: `1px solid ${item.color}44`,
              borderTop: `4px solid ${item.color}`,
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.75rem 1.2rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: item.color }}>{item.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{item.sublabel}</div>
            </div>
            <div style={{ height: '220px', background: '#04040e' }}>
              <ReceptiveFieldCanvas type={item.type} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* What it proves / doesn't prove */}
      <motion.div
        variants={fadeUp}
        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '1100px' }}
      >
        {[
          {
            color: '#22c55e',
            titulo: 'Lo que SÍ prueba',
            items: [
              'Las redes entrenadas con retropropagación pueden desarrollar representaciones funcionalmente similares a las biológicas',
              'La organización jerárquica y distribución de campos receptivos converge en ambos sistemas',
              'El tipo de representaciones que emergen es compatible con la arquitectura neural real',
            ],
          },
          {
            color: '#ef4444',
            titulo: 'Lo que NO prueba',
            items: [
              'No prueba que el cerebro use retropropagación (sigue siendo biológicamente implausible)',
              'No prueba que el mecanismo de aprendizaje sea el mismo',
              'No resuelve la brecha explicativa: convergencia funcional ≠ convergencia mecanística',
            ],
          },
        ].map((col, colIdx) => (
          <motion.div
            key={col.titulo}
            initial={{ opacity: 0, x: colIdx === 0 ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + colIdx * 0.2, duration: 0.5, ease: 'easeOut' }}
            style={{
              flex: '1 1 280px',
              background: 'var(--bg-3)',
              borderLeft: `4px solid ${col.color}`,
              borderRadius: '0 10px 10px 0',
              padding: '1rem 1.25rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: col.color, marginBottom: '0.6rem', fontFamily: 'monospace' }}>
              {col.titulo}
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {col.items.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + colIdx * 0.2 + i * 0.12 }}
                  style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: '0.3rem' }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      {/* Key tension badge — small inline reference */}
      <motion.div
        variants={fadeUp}
        style={{
          display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap',
          width: '100%', maxWidth: '800px',
        }}
      >
        {[
          { label: 'Convergencia funcional', status: 'yes', code: 'CONV_FUNC' },
          { label: 'Convergencia mecanística', status: 'no', code: 'CONV_MECH' },
        ].map((b, i) => (
          <motion.div
            key={b.code}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 + i * 0.15 }}
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: '8px',
              background: 'var(--bg-3)',
              border: `1px solid ${b.status === 'yes' ? 'var(--green)' : 'var(--red)'}`,
              cursor: 'default',
            }}
          >
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '20px', height: '20px', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 700,
              background: b.status === 'yes' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
              color: b.status === 'yes' ? 'var(--green)' : 'var(--red)',
            }}>
              {b.status === 'yes' ? '✓' : '✗'}
            </span>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-h)' }}>{b.label}</div>
              <code style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{b.code}</code>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Profesor-mode philosophical card */}
      {profesorMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="st-card"
          style={{ maxWidth: '1100px', width: '100%', fontSize: '1rem', lineHeight: 1.65 }}
        >
          <strong style={{ color: 'var(--accent-2)' }}>Implicación filosófica clave:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            La convergencia de Andersen-Zipser es el argumento más fuerte del paper de Hinton, pero también el más acotado.
            Muestra que la <em>organización funcional</em> puede converger aunque el <em>mecanismo</em> sea diferente.
            Esto es compatible con la realizabilidad múltiple de Putnam: la misma función, implementada distinto.
            Pero también abre la pregunta de Bechtel: ¿qué hace que esas <STTooltip term="representación">representaciones</STTooltip> sean <em>las mismas</em>
            si el mecanismo que las produce es diferente?
          </span>
        </motion.div>
      )}

      {/* ST FloatingButton — consistent with other slides */}
      <STFloatingButton />
    </motion.div>
  )
}
