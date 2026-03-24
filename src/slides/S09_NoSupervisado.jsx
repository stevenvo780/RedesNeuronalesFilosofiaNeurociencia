import STTooltip from "../components/st/STTooltip"
import STFloatingButton from "../components/st/STFloatingButton"
import { useEffect, useRef, useState, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'
import STDeriveCard from '../components/st/STDeriveCard'
import { ST_ONTOLOGIA } from '../data/st_results'

void motion

const PARADIGMS = [
  { label: 'Supervisado + Retroprop.', instructor: 'Sí',               repr: 'Distribuida',            uso: 'Clasificación, visión, voz',
    signal: 'Error explícito (δ)',       bio: 'Debatido — sin evidencia directa de backprop biológico',  limit: 'Requiere etiquetas masivas',    ref: 'Rumelhart 1986', color: '#7c6dfa' },
  { label: 'Componentes principales',  instructor: 'No',               repr: 'Distribuida cooperativa', uso: 'Reducción dimensionalidad',
    signal: 'Varianza máxima',           bio: 'Corteza visual V1 (Linsker 1988)',                        limit: 'Solo captura relaciones lineales', ref: 'Oja 1982',  color: '#06b6d4' },
  { label: 'Competitivo / Kohonen',    instructor: 'No',               repr: 'Local (una gana)',        uso: 'Mapas, clustering',
    signal: 'Distancia mínima (WTA)',    bio: 'Corteza somatosensorial, columnas corticales',            limit: 'No escala a alta dimensión',    ref: 'Kohonen 1982', color: '#22c55e' },
  { label: 'Hebb (1949) / Oja',        instructor: 'No',               repr: 'Local hebbiana',          uso: 'Biológicamente plausible, LTP',
    signal: 'Co-activación pre/post',    bio: 'LTP sináptica real (Bliss & Lømo 1973)',                  limit: 'Inestable sin normalización',   ref: 'Hebb 1949',   color: '#a78bfa' },
  { label: 'Barlow sparse coding',     instructor: 'No',               repr: 'Intermedia (sparse)',     uso: 'Codificación eficiente',
    signal: 'Independencia estadística', bio: 'Retina y V1 — campos receptivos sparse',                 limit: 'Computacionalmente costoso',    ref: 'Barlow 1961',  color: '#eab308' },
  { label: 'Refuerzo (RLHF)',          instructor: 'Señal recompensa', repr: 'Distribuida',             uso: 'LLMs actuales, robótica',
    signal: 'Recompensa escalar (r)',    bio: 'Sistema dopaminérgico (Schultz 1997)',                    limit: 'Alta varianza, sample-ineficiente', ref: 'Sutton 1988', color: '#f97316' },
]

const TAB_STYLES = {
  selected: { background: 'rgba(124,109,250,0.2)', border: '1px solid var(--accent)', color: 'var(--accent-2)' },
  default:  { background: 'var(--bg-3)',           border: '1px solid var(--border)', color: 'var(--text-dim)' },
}

const MODEL_TABS = [
  { id: 'pca',         label: '9a — PCA',         tooltip: 'pca',                      accent: '#06b6d4', stepLabel: 'Paso 1' },
  { id: 'competitive', label: '9b — Competitivo', tooltip: 'aprendizaje_competitivo', accent: '#22c55e', stepLabel: 'Paso 2' },
  { id: 'kohonen',     label: '9c — Kohonen',     tooltip: 'kohonen',                  accent: '#7c6dfa', stepLabel: 'Paso 3' },
  { id: 'hebb',        label: '9d — Hebb',        tooltip: 'aprendizaje_hebbiano',    accent: '#a78bfa', stepLabel: 'Paso 4' },
]

export default function S09_NoSupervisado({ profesorMode, ref }) {
  const [tab, setTab] = useState('pca')
  const [visitedTabs, setVisitedTabs] = useState(new Set(['pca']))
  const [showTable, setShowTable] = useState(false)
  const pcaRef    = useRef(null)
  const compRef   = useRef(null)
  const kohRef    = useRef(null)
  const hebbRef   = useRef(null)
  const kohMapRef = useRef(null)
  const stepRef   = useRef(0)

  const syncTab = (nextTab, stepIndex = MODEL_TABS.findIndex(t => t.id === nextTab)) => {
    if (!nextTab) return
    setTab(nextTab)
    setVisitedTabs(prev => {
      const next = new Set(prev)
      next.add(nextTab)
      return next
    })
    if (stepIndex >= 0) stepRef.current = stepIndex
  }

  useImperativeHandle(ref, () => ({
    advanceStep() {
      if (stepRef.current >= MODEL_TABS.length - 1) return false
      const nextIndex = stepRef.current + 1
      syncTab(MODEL_TABS[nextIndex].id, nextIndex)
      return true
    },
    retreatStep() {
      if (stepRef.current <= 0) return false
      const nextIndex = stepRef.current - 1
      syncTab(MODEL_TABS[nextIndex].id, nextIndex)
      return true
    },
  }))

  const currentStep = MODEL_TABS.findIndex(t => t.id === tab)
  const nextSuggestedTab = MODEL_TABS[currentStep + 1]?.id ?? null

  // ── PCA — animated drifting point cloud ─────────────────────────────────────
  useEffect(() => {
    if (tab !== 'pca' || !pcaRef.current) return
    const canvas = pcaRef.current
    let id

      // PCA Animation: Cloud with variance
      let pts = null
      let currentAngle = -Math.PI / 2; // start vertically
      const targetAngle = 25 * Math.PI / 180;

      function setup() {
        const W = canvas.offsetWidth || 900
        const H = canvas.offsetHeight || 350
        if (!W) { id = requestAnimationFrame(setup); return }
        canvas.width = W; canvas.height = H

        if (!pts) {
          const cosA = Math.cos(targetAngle), sinA = Math.sin(targetAngle);
          pts = Array.from({ length: 150 }, () => {
            // Box-Muller for Normal distribution
            const u = Math.max(Math.random(), 0.000001); // avoid 0
            const v = Math.random();
            const z1 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            const z2 = Math.sqrt(-2.0 * Math.log(u)) * Math.sin(2.0 * Math.PI * v);
            
            // Scaled for high variance in X, low in Y
            const rx = z1 * 120;
            const ry = z2 * 25;
            
            // Rotate by target angle
            const px = rx * cosA - ry * sinA;
            const py = rx * sinA + ry * cosA;
            
            return {
              baseX: px,
              baseY: py,
              ph: Math.random() * Math.PI * 2,
              speed: 0.3 + Math.random() * 0.6
            }
          })
        }

        // Only variable declaration, we don't need frame and i
        function draw(ts) {
          const t = ts * 0.001
          const ctx = canvas.getContext('2d')
          
          // slight clear for smooth motion tails or just solid
          ctx.fillStyle = '#04040e'
          ctx.fillRect(0, 0, W, H)

          const cx = W / 2, cy = H / 2

          // Slowly rotate PC1 line to find maximum variance
          currentAngle += (targetAngle - currentAngle) * 0.02
          const pcCos = Math.cos(currentAngle)
          const pcSin = Math.sin(currentAngle)

          // Draw and project points
          pts.forEach((p) => {
            // Slight organic drift
            const dx = p.baseX + Math.sin(t * p.speed + p.ph) * 4
            const dy = p.baseY + Math.cos(t * p.speed * 0.8 + p.ph) * 4
            const x = cx + dx
            const y = cy + dy

            // Projection onto PC1 (dot product)
            const dot = dx * pcCos + dy * pcSin
            const projX = cx + dot * pcCos
            const projY = cy + dot * pcSin

            // Projection lines (fade out if too far, just for visual neatness)
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(projX, projY)
            ctx.strokeStyle = 'rgba(167,139,250,0.15)'
            ctx.lineWidth = 1
            ctx.stroke()

            // Projected point on line
            ctx.beginPath()
            ctx.arc(projX, projY, 1.5, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(6,182,212,0.6)'
            ctx.fill()

            // Original point
            const pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + p.ph)
            ctx.beginPath()
            ctx.arc(x, y, 2.5 + pulse * 1.2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(124,109,250,${0.6 + pulse * 0.4})`
            ctx.fill()
          })

          // Draw PC1 axis
          const axLen = W * 0.4
          ctx.strokeStyle = '#06b6d4'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.moveTo(cx - pcCos * axLen, cy - pcSin * axLen)
          ctx.lineTo(cx + pcCos * axLen, cy + pcSin * axLen)
          ctx.stroke()

          ctx.fillStyle = '#06b6d4'
          ctx.font = 'bold 11px monospace'
          ctx.textAlign = 'left'
          ctx.fillText('PC1 (Varianza Máxima)', cx + pcCos * (axLen * 0.6) + 10, cy + pcSin * (axLen * 0.6))

          ctx.fillStyle = 'rgba(167,139,250,0.7)'
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('Las unidades hebbianas detectan la dirección que minimiza la pérdida de proyección', W / 2, H - 12)

          id = requestAnimationFrame(draw)
        }
        id = requestAnimationFrame(draw)
      }
      id = requestAnimationFrame(setup)
      return () => cancelAnimationFrame(id)
  }, [tab])

  // ── Competitive — animated cluster formation ─────────────────────────────────
  useEffect(() => {
    if (tab !== 'competitive' || !compRef.current) return
    const canvas = compRef.current
    let id

    function setup() {
      const W = canvas.offsetWidth || 900
      const H = canvas.offsetHeight || 350
      if (!W) { id = requestAnimationFrame(setup); return }
      canvas.width = W; canvas.height = H

      const CLUSTERS = [
        { cx: W * 0.3, cy: H * 0.35, color: 'rgba(34,197,94,', label: 'osos pardos' },
        { cx: W * 0.72, cy: H * 0.62, color: 'rgba(6,182,212,', label: 'osos polares' },
      ]
      const points = CLUSTERS.flatMap(c =>
        Array.from({ length: 35 }, () => ({
          x: c.cx + (Math.random() - 0.5) * W * 0.22,
          y: c.cy + (Math.random() - 0.5) * H * 0.22,
          tx: c.cx + (Math.random() - 0.5) * W * 0.20,
          ty: c.cy + (Math.random() - 0.5) * H * 0.20,
          color: c.color, ph: Math.random() * Math.PI * 2,
        }))
      )
      const weights = CLUSTERS.map(c => ({ x: W / 2, y: H / 2, tx: c.cx, ty: c.cy, color: c.color, label: c.label }))

      function draw(ts) {
        const t = ts * 0.001
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'rgba(13,13,30,0.4)'
        ctx.fillRect(0, 0, W, H)

        // Animate weight vectors toward cluster centers
        weights.forEach(w => {
          w.x += (w.tx - w.x) * 0.008
          w.y += (w.ty - w.y) * 0.008
        })

        // Points
        points.forEach(p => {
          const pulse = 0.5 + 0.5 * Math.sin(ts * 0.001 * 0.7 + p.ph)
          ctx.beginPath()
          ctx.arc(p.x + Math.sin(t * 0.3 + p.ph) * 3, p.y + Math.cos(t * 0.4 + p.ph) * 2, 3.5 + pulse, 0, Math.PI * 2)
          ctx.fillStyle = p.color + (0.35 + pulse * 0.4) + ')'
          ctx.fill()
        })

        // Weight vectors
        weights.forEach(w => {
          ctx.beginPath()
          ctx.arc(w.x, w.y, 14, 0, Math.PI * 2)
          ctx.fillStyle = w.color + '0.9)'
          ctx.fill()
          ctx.fillStyle = '#f0f0ff'
          ctx.font = 'bold 9px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('W', w.x, w.y + 3)
          ctx.fillStyle = w.color + '0.9)'
          ctx.font = '11px sans-serif'
          ctx.fillText(w.label, w.x, w.y + 28)
        })

        ctx.fillStyle = '#6b6b88'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('una unidad gana → sus pesos migran al patrón', W / 2, H - 8)
        id = requestAnimationFrame(draw)
      }
      id = requestAnimationFrame(draw)
    }
    id = requestAnimationFrame(setup)
    return () => cancelAnimationFrame(id)
  }, [tab])

  // ── Kohonen SOM — animated training ─────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'kohonen' || !kohRef.current) return
    const canvas = kohRef.current
    let id, frame = 0
    kohMapRef.current = null  // reset on tab switch

    function setup() {
      const W = canvas.offsetWidth || 900
      const H = canvas.offsetHeight || 350
      if (!W) { id = requestAnimationFrame(setup); return }
      canvas.width = W; canvas.height = H

      const GRID = 8
      const map = Array.from({ length: GRID }, () =>
        Array.from({ length: GRID }, () => ({ x: Math.random() * W, y: Math.random() * H }))
      )

      function animate() {
        frame++
        if (frame > 300) { frame = 0; map.forEach(row => row.forEach(n => { n.x = Math.random() * W; n.y = Math.random() * H })) }

        const inputX = Math.random() * W
        const inputY = Math.random() * H
        let bestI = 0, bestJ = 0, bestD = Infinity
        map.forEach((row, i) => row.forEach((n, j) => {
          const d = (n.x - inputX) ** 2 + (n.y - inputY) ** 2
          if (d < bestD) { bestD = d; bestI = i; bestJ = j }
        }))
        const lr = 0.12 * Math.exp(-frame / 180)
        const radius = 3.2 * Math.exp(-frame / 100)
        map.forEach((row, i) => row.forEach((n, j) => {
          const d = Math.sqrt((i - bestI) ** 2 + (j - bestJ) ** 2)
          if (d <= radius + 1) {
            const h = Math.exp(-(d ** 2) / (2 * (radius + 0.01) ** 2))
            n.x += lr * h * (inputX - n.x); n.y += lr * h * (inputY - n.y)
          }
        }))

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, W, H)
        ctx.fillStyle = '#04040e'; ctx.fillRect(0, 0, W, H)

        ctx.strokeStyle = 'rgba(124,109,250,0.4)'; ctx.lineWidth = 1
        map.forEach((row, i) => row.forEach((n, j) => {
          if (j + 1 < GRID) { const nb = map[i][j+1]; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nb.x, nb.y); ctx.stroke() }
          if (i + 1 < GRID) { const nb = map[i+1][j]; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nb.x, nb.y); ctx.stroke() }
        }))
        map.forEach((row, i) => row.forEach((n, j) => {
          const isBMU = i === bestI && j === bestJ
          ctx.beginPath(); ctx.arc(n.x, n.y, isBMU ? 7 : 4, 0, Math.PI * 2)
          ctx.fillStyle = isBMU ? '#22c55e' : 'rgba(124,109,250,0.75)'; ctx.fill()
        }))

        ctx.fillStyle = '#6b6b88'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
        ctx.fillText(`época ${frame}/300 — nodo ganador (verde) arrastra vecinos`, W / 2, H - 6)
        id = requestAnimationFrame(animate)
      }
      animate()
    }
    id = requestAnimationFrame(setup)
    return () => cancelAnimationFrame(id)
  }, [tab])

  // ── Hebb — synapse strengthening animation ───────────────────────────────────
  useEffect(() => {
    if (tab !== 'hebb' || !hebbRef.current) return
    const canvas = hebbRef.current
    let id, weight = 0.05, phase = 0, phaseFrame = 0, eventCount = 0

    function setup() {
      const W = canvas.offsetWidth || 900
      const H = canvas.offsetHeight || 350
      if (!W) { id = requestAnimationFrame(setup); return }
      canvas.width = W; canvas.height = H

      const preX = W * 0.22, preY = H * 0.5
      const postX = W * 0.78, postY = H * 0.5
      const r = Math.min(W, H) * 0.12

      function animate() {
        phaseFrame++
        if (phaseFrame > 45) {
          phaseFrame = 0; phase = (phase + 1) % 4
          if (phase === 0) { eventCount++; weight = Math.min(weight + 0.18, 1.0) }
        }
        const preActive  = phase === 1 || phase === 2
        const postActive = phase === 2

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, W, H)
        ctx.fillStyle = '#04040e'; ctx.fillRect(0, 0, W, H)

        // Signal pulse along synapse when co-active
        if (postActive) {
          const prog = phaseFrame / 45
          const px = preX + r + (postX - preX - r * 2) * prog
          const py = preY
          const grd = ctx.createRadialGradient(px, py, 0, px, py, 10)
          grd.addColorStop(0, 'rgba(167,139,250,0.9)')
          grd.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2)
          ctx.fillStyle = grd; ctx.fill()
        }

        // Synapse line
        ctx.beginPath()
        ctx.moveTo(preX + r, preY); ctx.lineTo(postX - r, postY)
        ctx.strokeStyle = `rgba(167,139,250,${0.15 + weight * 0.85})`
        ctx.lineWidth = 2 + weight * 10; ctx.stroke()

        // Weight label
        ctx.fillStyle = '#a78bfa'
        ctx.font = `bold ${Math.round(13 + weight * 5)}px monospace`
        ctx.textAlign = 'center'
        ctx.fillText(`w = ${weight.toFixed(2)}`, W / 2, H / 2 - r - 14)

        if (postActive) {
          ctx.fillStyle = '#a78bfa'; ctx.font = '11px monospace'
          ctx.fillText('co-activación → potenciación!', W / 2, H / 2 + r + 22)
        }

        // PRE
        ctx.beginPath(); ctx.arc(preX, preY, r, 0, Math.PI * 2)
        ctx.fillStyle = preActive ? 'rgba(6,182,212,0.75)' : 'rgba(6,182,212,0.14)'; ctx.fill()
        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'
        ctx.fillText('PRE', preX, preY + 4)

        // POST
        ctx.beginPath(); ctx.arc(postX, postY, r, 0, Math.PI * 2)
        ctx.fillStyle = postActive ? 'rgba(34,197,94,0.75)' : 'rgba(34,197,94,0.14)'; ctx.fill()
        ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'
        ctx.fillText('POST', postX, postY + 4)

        ctx.fillStyle = '#6b6b88'; ctx.font = '9px monospace'; ctx.textAlign = 'right'
        ctx.fillText(`co-activaciones: ${eventCount}`, W - 8, H - 8)
        ctx.textAlign = 'center'
        ctx.fillText('"neuronas que se disparan juntas, se conectan juntas" — Hebb 1949', W / 2, H - 8)

        id = requestAnimationFrame(animate)
      }
      animate()
    }
    id = requestAnimationFrame(setup)
    return () => cancelAnimationFrame(id)
  }, [tab])

  const TAB_DESCS = {
    pca:         <><STTooltip term="aprendizaje_hebbiano">Cálculo de Componentes Principales</STTooltip> — Las unidades extraen correlaciones estadísticas dominantes (Linsker y Oja). Altamente <STTooltip term="plausibilidad_biologica">plausible biológicamente</STTooltip>. Los puntos derivan lentamente mostrando la varianza capturada por PC1.</>,
    competitive: <>Redes de Competición Mutua (Winner-Takes-All). Las neuronas no colaboran, compiten. Actúa como un mecanismo implacable de <STTooltip term="representacion">categorización discreta</STTooltip>. El vector ganador (W) migra hacia el patrón de entrada.</>,
    kohonen:     <>Mapas Auto-organizados (SOM). La <STTooltip term="arquitectura">geometría topológica</STTooltip> importa. Obliga a neuronas vecinas a codificar <STTooltip term="vector_de_estado">vectores similares</STTooltip>, imitando la corteza cerebral real. El nodo verde es la Best Matching Unit.</>,
    hebb:        <><STTooltip term="aprendizaje_hebbiano">Regla de Hebb (1949)</STTooltip> — la sinapsis se fortalece con cada co-activación. Sin señal de error externa. Oja (1982): PCA implementable con reglas hebbianas. Alternativa <STTooltip term="plausibilidad_biologica">biológicamente plausible</STTooltip> a la retropropagación.</>,
  }

  return (
    <div className="section-slide" style={{ gap: '1.2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Aprendizaje No Supervisado</div>
        <div className="section-subtitle">El Ecosistema Topológico Computacional</div>
      </div>

      <div className="quote" style={{ maxWidth: '850px', fontSize: '1.05rem' }}>
        "¿Cómo logra un sistema desarrollar una <STTooltip term="representacion">representación isomórfica</STTooltip> del mundo, sin que un instructor omnisciente asigne etiquetas externas sobre qué es lo que observa?"
      </div>

      {/* Criterio universal */}
      <div className="st-card" style={{ maxWidth: '900px', width: '100%' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.6rem' }}>
          EL CRITERIO UNIVERSAL DE COMPRESIÓN ACTIVA
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.6 }}>
          Cualquier <STTooltip term="representacion">modelo representacional autónomo</STTooltip> obedece una tensión dialéctica:{' '}
          <strong style={{ color: 'var(--green)' }}>Eficiencia Ontológica</strong> (reducir dimensionalidad exprimiendo redundancias en vectores de <STTooltip term="peso">pesos</STTooltip>) y{' '}
          <strong style={{ color: 'var(--cyan)' }}>Fidelidad Generativa</strong> (garantizar que la señal de entrada pueda ser reconstruida a partir del código comprimido).
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem',
        maxWidth: '1000px', width: '100%',
      }}>
        <div style={{
          fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace',
          letterSpacing: '0.06em',
        }}>
          RECORRIDO GUIADO · {currentStep + 1}/4 modelos · ← → para avanzar
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {MODEL_TABS.map((t, idx) => {
            const isCurrent = tab === t.id
            const isVisited = visitedTabs.has(t.id)
            return (
              <div
                key={t.id}
                style={{
                  width: isCurrent ? '22px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: isCurrent ? t.accent : isVisited ? `${t.accent}cc` : 'var(--border)',
                  boxShadow: isCurrent ? `0 0 10px ${t.accent}66` : 'none',
                  opacity: isCurrent || isVisited ? 1 : 0.8,
                  transition: 'all 0.2s ease',
                }}
                aria-hidden="true"
              />
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '1000px', width: '100%' }}>
        {MODEL_TABS.map(t => (
          <motion.button
            key={t.id}
            onClick={() => syncTab(t.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '8px',
              fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
              ...(tab === t.id ? TAB_STYLES.selected : TAB_STYLES.default),
              boxShadow: tab === t.id ? `0 0 0 1px ${t.accent}22 inset` : 'none',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
              <STTooltip term={t.tooltip}>{t.label}</STTooltip>
              <span style={{
                fontSize: '0.65rem', fontFamily: 'monospace', opacity: 0.78,
                color: tab === t.id ? t.accent : visitedTabs.has(t.id) ? 'var(--text)' : 'var(--text-dim)',
              }}>
                {t.stepLabel}{visitedTabs.has(t.id) ? ' · visto' : nextSuggestedTab === t.id ? ' · siguiente' : ''}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Canvas area — always same height, canvas drawn per tab */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        style={{
          width: '100%', maxWidth: '1000px', height: '320px',
          background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
        }}
      >
        {tab === 'pca'         && <canvas ref={pcaRef}   style={{ width: '100%', height: '100%' }} />}
        {tab === 'competitive' && <canvas ref={compRef}  style={{ width: '100%', height: '100%' }} />}
        {tab === 'kohonen'     && <canvas ref={kohRef}   style={{ width: '100%', height: '100%' }} />}
        {tab === 'hebb'        && <canvas ref={hebbRef}  style={{ width: '100%', height: '100%' }} />}
      </motion.div>

      {/* Tab description */}
      <motion.div
        key={tab + '_desc'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ fontSize: '0.95rem', color: 'var(--text-dim)', textAlign: 'center', maxWidth: '900px', lineHeight: 1.6 }}
      >
        {TAB_DESCS[tab]}
      </motion.div>

      {/* ST Deriva */}
      {profesorMode && (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}><STDeriveCard derive={ST_ONTOLOGIA.derives[0]} /></div>
          <div style={{ flex: 1 }}><STDeriveCard derive={ST_ONTOLOGIA.derives[1]} /></div>
        </div>
      )}

      {/* Botón para abrir Modal de Comparativa */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', width: '100%' }}>
        <motion.button 
          onClick={() => setShowTable(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(124,109,250,0.2))',
            border: '1px solid rgba(124,109,250,0.4)',
            padding: '0.75rem 2rem',
            borderRadius: '25px',
            color: 'var(--accent-2)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            transition: 'all 0.2s',
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Comparativa de Paradigmas
        </motion.button>
      </div>

      {/* Modal de Tabla comparativa */}
      {showTable && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(4,4,14,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', padding: '2rem'
        }}>
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{
              background: 'var(--bg-2)', border: '1px solid rgba(124,109,250,0.3)',
              borderRadius: '16px', padding: '2rem', maxWidth: '1100px', width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <button 
              onClick={() => setShowTable(false)}
              style={{
                position: 'absolute', top: '1.2rem', right: '1.2rem',
                background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text)',
                width: '32px', height: '32px', borderRadius: '50%',
                fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >✕</button>
            
            <h3 style={{ marginTop: 0, color: 'var(--accent-2)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Ecosistema de Redes Neuronales
            </h3>
            
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr>
                    {['Paradigma', 'Instructor', 'Representación', 'Uso hoy', 'Señal de Aprendizaje', 'Inspiración Biológica'].map(h => (
                      <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARADIGMS.map(p => (
                    <motion.tr
                      key={p.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <td style={{ padding: '0.8rem 1rem', color: p.color, fontWeight: 600 }}>{p.label}</td>
                      <td style={{ padding: '0.8rem 1rem', color: 'var(--text)' }}>
                        <span style={{ 
                          background: p.instructor === 'Sí' ? 'rgba(239,68,68,0.2)' : p.instructor === 'No' ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)',
                          color: p.instructor === 'Sí' ? '#fca5a5' : p.instructor === 'No' ? '#86efac' : '#fdba74',
                          padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600
                        }}>
                          {p.instructor}
                        </span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: 'rgba(255,255,255,0.8)' }}>{p.repr}</td>
                      <td style={{ padding: '0.8rem 1rem', color: 'rgba(255,255,255,0.8)' }}>{p.uso}</td>
                      <td style={{ padding: '0.8rem 1rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>{p.signal}</td>
                      <td style={{ padding: '0.8rem 1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{p.bio}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      <STFloatingButton slideId="S09" />
    </div>
  )
}
