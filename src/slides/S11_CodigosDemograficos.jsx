import STFloatingButton from '../components/st/STFloatingButton'
import STTooltip from '../components/st/STTooltip'
import STDeriveCard from '../components/st/STDeriveCard'
import { ST_ONTOLOGIA } from '../data/st_results'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play } from 'lucide-react'

const N_UNITS = 20

// Deterministic star field (stable between renders)
const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 7919 + 13)  % 97)  / 97,
  y: ((i * 6271 + 31)  % 89)  / 89,
  r: 0.3 + ((i * 4637) % 7)   / 7 * 1.4,
  a: 0.25 + ((i * 3571) % 11) / 11 * 0.75,
}))

function gaussian(i, center, sigma = 3) {
  return Math.exp(-((i - center) ** 2) / (2 * sigma ** 2))
}

// ── Cosmic Eye Canvas ──────────────────────────────────────────────────────────
function CosmicEye({ targetX, anesthetized }) {
  const canvasRef    = useRef(null)
  const animRef      = useRef(null)
  const irisXRef     = useRef(null)   // smooth iris X (absolute px, set on first frame)
  const targetXRef   = useRef(targetX)
  const prevAnesth   = useRef(anesthetized.size)
  const flashRef     = useRef(0)
  const startTimeRef = useRef(null)

  // Keep targetX in a ref so the animation loop always has latest value
  useEffect(() => { targetXRef.current = targetX }, [targetX])

  // Flash on anesthesia change
  useEffect(() => {
    if (anesthetized.size !== prevAnesth.current) {
      flashRef.current = 1
      prevAnesth.current = anesthetized.size
    }
  }, [anesthetized])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cW = 0, cH = 0

    const setSize = () => {
      const nw = canvas.offsetWidth, nh = canvas.offsetHeight
      if (nw !== cW || nh !== cH) { cW = nw; cH = nh; canvas.width = cW; canvas.height = cH }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    function draw(timestamp) {
      if (!cW || !cH) { requestAnimationFrame(draw); return }
      const W = cW, H = cH
      const ctx = canvas.getContext('2d')
      const t = timestamp * 0.001

      // Entry animation (fade + scale in over 1.4 s)
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = (timestamp - startTimeRef.current) * 0.001
      const entry   = Math.min(1, elapsed / 1.4)

      // ── Fixed eye center (sclera never moves) ──
      const eyeCX = W * 0.5
      const eyeCY = H * 0.5

      // ── Iris tracking (only iris/pupil move inside the sclera) ──
      const scleraW  = W * 0.44
      const maxTravel = scleraW * 0.30          // how far iris center can travel from eye center
      const targetIrisX = eyeCX + (targetXRef.current / N_UNITS - 0.5) * 2 * maxTravel
      if (irisXRef.current === null) irisXRef.current = targetIrisX
      irisXRef.current += (targetIrisX - irisXRef.current) * 0.06
      const irisX = irisXRef.current
      const irisY = eyeCY

      // Decay flash
      if (flashRef.current > 0) flashRef.current = Math.max(0, flashRef.current - 0.04)

      // Apply entry scale/opacity from center
      ctx.save()
      ctx.globalAlpha = entry
      ctx.translate(eyeCX, eyeCY)
      ctx.scale(0.72 + entry * 0.28, 0.72 + entry * 0.28)
      ctx.translate(-eyeCX, -eyeCY)

      // ── Background ──
      ctx.fillStyle = '#01010a'
      ctx.fillRect(eyeCX - W, eyeCY - H, W * 3, H * 3) // fill more than canvas to cover scale

      // Stars
      STARS.forEach(s => {
        const twinkle = s.a * (0.7 + 0.3 * Math.sin(t * 1.5 + s.x * 10))
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,210,255,${twinkle})`
        ctx.fill()
      })

      const scleraH = H * 0.38

      // ── Outer sclera glow (fixed at eye center) ──
      const outerGlow = ctx.createRadialGradient(eyeCX, eyeCY, scleraH * 0.6, eyeCX, eyeCY, scleraH * 2)
      outerGlow.addColorStop(0, `rgba(140,160,255,${0.12 + flashRef.current * 0.15})`)
      outerGlow.addColorStop(1, 'rgba(140,160,255,0)')
      ctx.beginPath()
      ctx.ellipse(eyeCX, eyeCY, scleraW * 1.6, scleraH * 1.6, 0, 0, Math.PI * 2)
      ctx.fillStyle = outerGlow
      ctx.fill()

      // ── Sclera (fixed) ──
      const scleraGrad = ctx.createRadialGradient(eyeCX, eyeCY - scleraH * 0.3, scleraH * 0.1, eyeCX, eyeCY, scleraH)
      scleraGrad.addColorStop(0,   'rgba(240,242,255,0.95)')
      scleraGrad.addColorStop(0.8, 'rgba(210,215,245,0.92)')
      scleraGrad.addColorStop(1,   'rgba(160,165,210,0.85)')
      ctx.beginPath()
      ctx.ellipse(eyeCX, eyeCY, scleraW, scleraH, 0, 0, Math.PI * 2)
      ctx.fillStyle = scleraGrad
      ctx.fill()

      // Clip everything below to the sclera ellipse
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(eyeCX, eyeCY, scleraW, scleraH, 0, 0, Math.PI * 2)
      ctx.clip()

        // ── Iris base (follows irisX) ──
        const irisR = H * 0.27
        const irisGrad = ctx.createRadialGradient(irisX, irisY, 0, irisX, irisY, irisR)
        irisGrad.addColorStop(0,    '#0d0825')
        irisGrad.addColorStop(0.25, '#1a1060')
        irisGrad.addColorStop(0.55, '#1e3a8a')
        irisGrad.addColorStop(0.78, '#7c3aed')
        irisGrad.addColorStop(0.92, '#4f1d96')
        irisGrad.addColorStop(1,    '#1e1b4b')
        ctx.beginPath()
        ctx.arc(irisX, irisY, irisR, 0, Math.PI * 2)
        ctx.fillStyle = irisGrad
        ctx.fill()

        // ── Iris radial fibers ──
        const nFibers = 32
        for (let k = 0; k < nFibers; k++) {
          const angle = (k / nFibers) * Math.PI * 2 + t * 0.08
          const brightness = 0.08 + 0.06 * Math.sin(k * 2.3 + t * 0.4)
          ctx.beginPath()
          ctx.moveTo(irisX + Math.cos(angle) * irisR * 0.28, irisY + Math.sin(angle) * irisR * 0.28)
          ctx.lineTo(irisX + Math.cos(angle) * irisR * 0.96, irisY + Math.sin(angle) * irisR * 0.96)
          ctx.strokeStyle = `rgba(147,112,219,${brightness})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        // ── Iris ring highlights ──
        ctx.beginPath()
        ctx.arc(irisX, irisY, irisR * 0.88, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(99,102,241,0.25)'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(irisX, irisY, irisR * 0.55, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(139,92,246,0.18)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // ── Nebula wisps ──
        for (let k = 0; k < 4; k++) {
          const a  = (k / 4) * Math.PI * 2 + t * 0.12
          const rx = irisX + Math.cos(a) * irisR * 0.45
          const ry = irisY + Math.sin(a) * irisR * 0.45
          const wisp = ctx.createRadialGradient(rx, ry, 0, rx, ry, irisR * 0.4)
          wisp.addColorStop(0, `rgba(139,92,246,${0.12 + 0.05 * Math.sin(t + k)})`)
          wisp.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath()
          ctx.arc(rx, ry, irisR * 0.4, 0, Math.PI * 2)
          ctx.fillStyle = wisp
          ctx.fill()
        }

        // ── Pupil (follows irisX) ──
        const pupilR = irisR * (0.44 + 0.06 * Math.sin(t * 1.2))
        const pupilGrad = ctx.createRadialGradient(irisX, irisY, 0, irisX, irisY, pupilR)
        pupilGrad.addColorStop(0,   '#000005')
        pupilGrad.addColorStop(0.7, '#05020f')
        pupilGrad.addColorStop(1,   '#0a0520')
        ctx.beginPath()
        ctx.arc(irisX, irisY, pupilR, 0, Math.PI * 2)
        ctx.fillStyle = pupilGrad
        ctx.fill()

        // Pupil depth ring
        ctx.beginPath()
        ctx.arc(irisX, irisY, pupilR * 0.7, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(80,0,120,0.3)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Specular highlights
        ctx.beginPath()
        ctx.arc(irisX - pupilR * 0.35, irisY - pupilR * 0.35, pupilR * 0.22, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.18)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(irisX + pupilR * 0.22, irisY - pupilR * 0.18, pupilR * 0.09, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(200,180,255,0.12)'
        ctx.fill()

        // ── Flash on anesthesia ──
        if (flashRef.current > 0) {
          ctx.beginPath()
          ctx.arc(irisX, irisY, irisR * 1.4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(239,68,68,${flashRef.current * 0.15})`
          ctx.fill()
        }

        // ── Eyelid top shadow ──
        const topShadow = ctx.createLinearGradient(eyeCX, eyeCY - scleraH, eyeCX, eyeCY - scleraH * 0.2)
        topShadow.addColorStop(0, 'rgba(1,1,10,0.7)')
        topShadow.addColorStop(0.7, 'rgba(1,1,10,0.1)')
        topShadow.addColorStop(1, 'rgba(1,1,10,0)')
        ctx.fillStyle = topShadow
        ctx.fillRect(eyeCX - scleraW, eyeCY - scleraH, scleraW * 2, scleraH)

      ctx.restore()  // end sclera clip

      // ── Label ──
      ctx.fillStyle = 'rgba(147,112,219,0.7)'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(
        `posición = promedio de la población (unidad ${targetXRef.current.toFixed(1)})`,
        W / 2, H - 5
      )

      ctx.restore()  // end entry scale
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current); ro.disconnect() }
  }, []) // single persistent loop — targetX is read via ref

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}

// ── Population Bar Chart ───────────────────────────────────────────────────────
function PopulationChart({ activations, anesthetized, populationCenter }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width  = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#04040e'
    ctx.fillRect(0, 0, W, H)

    const barW = W / N_UNITS

    activations.forEach((act, i) => {
      const barH = act * (H - 32)
      const x = i * barW
      const y = H - 32 - barH
      const isAn = anesthetized.has(i)

      // Bar fill
      if (isAn) {
        ctx.fillStyle = 'rgba(239,68,68,0.25)'
      } else {
        const grad = ctx.createLinearGradient(x, y + barH, x, y)
        grad.addColorStop(0, `rgba(124,109,250,${0.25 + act * 0.5})`)
        grad.addColorStop(1, `rgba(167,139,250,${0.5 + act * 0.5})`)
        ctx.fillStyle = grad
      }
      ctx.fillRect(x + 1, y, barW - 2, barH)

      // Border
      ctx.strokeStyle = isAn ? 'rgba(239,68,68,0.7)' : `rgba(167,139,250,${0.3 + act * 0.5})`
      ctx.lineWidth = isAn ? 1.5 : 0.8
      ctx.strokeRect(x + 1, y, barW - 2, barH)

      // Unit index
      if (barW > 14) {
        ctx.fillStyle = isAn ? '#ef4444' : `rgba(167,139,250,${0.4 + act * 0.4})`
        ctx.font = '7px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(i, x + barW / 2, H - 20)
      }
    })

    // Population center line
    const cX = (populationCenter / N_UNITS) * W
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(cX, 0)
    ctx.lineTo(cX, H - 32)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#22c55e'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('⟨pop⟩', cX, H - 8)

    // Axis
    ctx.fillStyle = '#3a3a55'
    ctx.font = '8px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('activación →', 4, 12)

  }, [activations, anesthetized, populationCenter])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
}

// ── Slide ──────────────────────────────────────────────────────────────────────
export default function S11_CodigosDemograficos({ profesorMode }) {
  const [center, setCenter]           = useState(10)
  const [anesthetized, setAnesthetized] = useState(new Set())
  const [showInfo, setShowInfo]        = useState(false)
  const [isPlaying, setIsPlaying]     = useState(true)
  const scanRafRef  = useRef(null)
  const scanTimeRef = useRef(0)
  const lastTsRef   = useRef(null)

  // Auto-scan: oscillate center from side to side
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(scanRafRef.current)
      lastTsRef.current = null
      return
    }
    const MIN = 2, MAX = N_UNITS - 3
    function tick(ts) {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) * 0.001
      lastTsRef.current = ts
      scanTimeRef.current += dt * 0.45
      const newCenter = Math.round(MIN + (MAX - MIN) * (0.5 + 0.5 * Math.sin(scanTimeRef.current)))
      setCenter(newCenter)
      scanRafRef.current = requestAnimationFrame(tick)
    }
    scanRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(scanRafRef.current)
  }, [isPlaying])

  const activations = Array.from({ length: N_UNITS }, (_, i) =>
    anesthetized.has(i) ? 0 : gaussian(i, center)
  )

  // Correct weighted average
  let weightedSum = 0, totalWeight = 0
  activations.forEach((act, i) => {
    if (!anesthetized.has(i)) {
      weightedSum += act * i
      totalWeight += act
    }
  })
  const populationCenter = totalWeight > 0 ? weightedSum / totalWeight : center
  const displacement     = Math.abs(populationCenter - center).toFixed(2)

  function toggleAnesthetize(i) {
    setAnesthetized(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="section-slide" style={{ gap: '1.6rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Evidencia Biológica: Códigos Demográficos</div>
        <div className="section-subtitle">¿Cómo procesa la corteza las representaciones continuas del espacio?</div>
      </div>

      <div className="quote" style={{ maxWidth: '940px', fontSize: '1.05rem' }}>
        "El experimento de Sparks con monos destruyó el <STTooltip term="idealizacion">localismo</STTooltip>. Al anular neuronas específicas que controlan el movimiento ocular (colículo superior), el ojo no se paralizó ni erró catastróficamente — <em>promedió las fuerzas restantes</em>. Cálculo poblacional de <STTooltip term="pesos">vectores demográficos</STTooltip>."
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', width: '100%', maxWidth: '1100px', alignItems: 'flex-start' }}>

        {/* Left: population chart + controls */}
        <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Slider + play/pause */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
              <span>centro del bump de activación</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent-2)' }}>unidad {center}</span>
                <button
                  onClick={() => setIsPlaying(p => !p)}
                  title={isPlaying ? 'Pausar escaneo' : 'Iniciar escaneo'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
                    border: `1px solid ${isPlaying ? 'rgba(124,109,250,0.5)' : 'var(--border)'}`,
                    background: isPlaying ? 'rgba(124,109,250,0.12)' : 'var(--bg-3)',
                    color: isPlaying ? '#a78bfa' : 'var(--text-dim)',
                    fontSize: '0.65rem', fontFamily: 'monospace',
                  }}
                >
                  {isPlaying ? <><Pause size={10} strokeWidth={2} /> auto</> : <><Play size={10} strokeWidth={2} /> auto</>}
                </button>
              </div>
            </div>
            <input
              type="range" min="2" max={N_UNITS - 3} value={center}
              onChange={e => { setIsPlaying(false); setCenter(parseInt(e.target.value)) }}
              style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: '0.4rem' }}
            />
          </div>

          {/* Bump chart */}
          <div style={{ height: '180px', background: '#04040e', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <PopulationChart activations={activations} anesthetized={anesthetized} populationCenter={populationCenter} />
          </div>

          {/* Anesthesia buttons */}
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
              clic para <span style={{ color: '#ef4444' }}>anestesiar</span> neuronas — el ojo se desplaza al nuevo promedio
            </div>
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {Array.from({ length: N_UNITS }, (_, i) => (
                <motion.button
                  key={i}
                  onClick={() => toggleAnesthetize(i)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '38px', height: '38px',
                    borderRadius: '6px',
                    border: `1px solid ${anesthetized.has(i) ? '#ef4444' : 'var(--border)'}`,
                    background: anesthetized.has(i) ? 'rgba(239,68,68,0.25)' : 'var(--bg-3)',
                    color: anesthetized.has(i) ? '#ef4444' : 'var(--text-dim)',
                    fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', padding: 0,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >{i}</motion.button>
              ))}
            </div>

            {/* Info panel on anesthesia */}
            <AnimatePresence>
              {anesthetized.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  style={{
                    marginTop: '0.6rem',
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderLeft: '3px solid #ef4444',
                    borderRadius: '0 8px 8px 0',
                    padding: '0.6rem 0.9rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#ef4444', fontFamily: 'monospace', marginBottom: '0.15rem' }}>
                      {anesthetized.size} neurona{anesthetized.size > 1 ? 's' : ''} anestesiada{anesthetized.size > 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                      Centro promedio: <span style={{ color: '#22c55e', fontFamily: 'monospace' }}>{populationCenter.toFixed(2)}</span>{' '}
                      (desplazado {displacement} unidades)
                    </div>
                  </div>
                  <button
                    onClick={() => setAnesthetized(new Set())}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-dim)', fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    restablecer
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Philosophical note */}
          <div
            onClick={() => setShowInfo(v => !v)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span style={{ fontSize: '0.68rem', color: 'var(--accent-2)', fontFamily: 'monospace' }}>
              ◇ ¿por qué importa esto filosóficamente?
            </span>
            <motion.span
              animate={{ rotate: showInfo ? 180 : 0 }}
              style={{ fontSize: '0.6rem', color: 'var(--accent-2)' }}
            >▼</motion.span>
          </div>
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ maxHeight: 0, opacity: 0 }}
                animate={{ maxHeight: 120, opacity: 1 }}
                exit={{ maxHeight: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6, borderLeft: '3px solid var(--accent)', paddingLeft: '0.8rem' }}>
                  Un concepto no existe en una neurona — existe distribuido en la población. Esto refuta el
                  "localismo" (la hipótesis de la "neurona abuela") y confirma que la representación es una
                  propiedad emergente del conjunto, no de unidades individuales.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: cosmic eye */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', fontFamily: 'monospace' }}>
            posición ocular resultante — calculada por el promedio poblacional
          </div>
          <div style={{
            height: '260px',
            background: '#01010a',
            border: '1px solid rgba(124,109,250,0.3)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(99,102,241,0.15), inset 0 0 40px rgba(0,0,0,0.8)',
          }}>
            <CosmicEye targetX={populationCenter} anesthetized={anesthetized} />
          </div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(147,112,219,0.5)', textAlign: 'center', fontFamily: 'monospace' }}>
            la posición del iris = promedio ponderado de activaciones activas
          </div>

          {/* Young & Yamane note */}
          <div style={{
            background: 'rgba(124,109,250,0.06)',
            border: '1px solid rgba(124,109,250,0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginTop: '0.3rem',
          }}>
            <div style={{ fontSize: '0.68rem', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '0.3rem' }}>REPLICACIÓN — YOUNG & YAMANE (RIKEN)</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              Confirmaron códigos demográficos para <strong style={{ color: 'var(--text)' }}>rostros</strong> en la corteza
              temporal inferior de mono. El "detector de caras" no es una célula — es una población.
            </p>
          </div>
        </div>
      </div>

      <STFloatingButton />

      {profesorMode && (
        <div style={{ width: '100%', maxWidth: '1100px' }}>
          <STDeriveCard derive={ST_ONTOLOGIA.derives[2]} />
          <STDeriveCard derive={ST_ONTOLOGIA.derives[3]} />
        </div>
      )}

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%', fontSize: '1rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Punto filosófico central:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            La localización modular estricta del cerebro queda cuestionada. La propiedad representacional
            es holográfica: dañar parte de la red degrada graciosamente, no catastrófica. Esto
            apoya la <em>realizabilidad múltiple</em> — la función persiste con distintas implementaciones.
          </span>
        </div>
      )}
    </div>
  )
}
