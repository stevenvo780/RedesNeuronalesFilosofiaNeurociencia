import STTooltip from "../components/st/STTooltip"
import STFloatingButton from "../components/st/STFloatingButton"
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import STDeriveCard from '../components/st/STDeriveCard'
import { ST_ONTOLOGIA } from '../data/st_results'

const PARADIGMS = [
  { label: 'Supervisado + Retroprop.', instructor: 'Sí',            repr: 'Distribuida',          uso: 'Clasificación, visión, voz',     color: '#7c6dfa' },
  { label: 'Componentes principales', instructor: 'No',            repr: 'Distribuida cooperativa', uso: 'Reducción dimensionalidad',     color: '#06b6d4' },
  { label: 'Competitivo / Kohonen',   instructor: 'No',            repr: 'Local (una gana)',       uso: 'Mapas, clustering',              color: '#22c55e' },
  { label: 'Hebb (1949) / Oja',       instructor: 'No',            repr: 'Local hebbiana',         uso: 'Biológicamente plausible, LTP',  color: '#a78bfa' },
  { label: 'Barlow sparse coding',    instructor: 'No',            repr: 'Intermedia (sparse)',    uso: 'Codificación eficiente',         color: '#eab308' },
  { label: 'Refuerzo (RLHF)',         instructor: 'Señal recompensa', repr: 'Distribuida',         uso: 'LLMs actuales',                  color: '#f97316' },
]

const TAB_STYLES = {
  selected: { background: 'rgba(124,109,250,0.2)', border: '1px solid var(--accent)', color: 'var(--accent-2)' },
  default:  { background: 'var(--bg-3)',           border: '1px solid var(--border)', color: 'var(--text-dim)' },
}

export default function S09_NoSupervisado({ profesorMode }) {
  const [tab, setTab] = useState('pca')
  const pcaRef    = useRef(null)
  const compRef   = useRef(null)
  const kohRef    = useRef(null)
  const hebbRef   = useRef(null)
  const kohMapRef = useRef(null)

  // ── PCA — animated drifting point cloud ─────────────────────────────────────
  useEffect(() => {
    if (tab !== 'pca' || !pcaRef.current) return
    const canvas = pcaRef.current
    let id

    // Generate points once
    let pts = null

    function setup() {
      const W = canvas.offsetWidth || 900
      const H = canvas.offsetHeight || 350
      if (!W) { id = requestAnimationFrame(setup); return }
      canvas.width = W; canvas.height = H

      if (!pts) {
        pts = Array.from({ length: 120 }, () => {
          const ang = Math.random() * 2 * Math.PI
          const r = 0.3 + Math.random() * 0.5
          return {
            bx: W / 2 + Math.cos(ang) * r * W * 0.38,
            by: H / 2 + Math.sin(ang * 0.4) * r * H * 0.33,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.15,
            ph: Math.random() * Math.PI * 2,
          }
        })
      }

      let frame = 0
      function draw(ts) {
        frame++
        const t = ts * 0.001
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = 'rgba(13,13,30,0.35)'
        ctx.fillRect(0, 0, W, H)

        // PCA axis (slowly breathing)
        const ax = W * (0.12 + 0.03 * Math.sin(t * 0.3))
        ctx.strokeStyle = '#06b6d4'
        ctx.lineWidth = 2.5
        ctx.beginPath()
        ctx.moveTo(ax, H * 0.6)
        ctx.lineTo(W - ax, H * 0.4)
        ctx.stroke()
        ctx.fillStyle = '#06b6d4'
        ctx.font = '10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText('PC1', W - ax + 4, H * 0.39)

        // Points
        pts.forEach((p, i) => {
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + p.ph)
          const px = p.bx + Math.sin(t * 0.4 + p.ph) * 5
          const py = p.by + Math.cos(t * 0.5 + p.ph) * 3
          ctx.beginPath()
          ctx.arc(px, py, 2.5 + pulse * 1.2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(124,109,250,${0.35 + pulse * 0.35})`
          ctx.fill()
        })

        ctx.fillStyle = 'rgba(167,139,250,0.6)'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Cara de elipses: 1M píxeles → 5 parámetros', W / 2, H - 8)

        id = requestAnimationFrame(draw)
      }
      ctx => ctx  // appease linter
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
      <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '1000px', width: '100%' }}>
        {[
          { id: 'pca',         label: '9a — PCA',        tooltip: 'pca' },
          { id: 'competitive', label: '9b — Competitivo', tooltip: 'aprendizaje_competitivo' },
          { id: 'kohonen',     label: '9c — Kohonen',     tooltip: 'kohonen' },
          { id: 'hebb',        label: '9d — Hebb',        tooltip: 'aprendizaje_hebbiano' },
        ].map(t => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: '0.65rem', borderRadius: '8px',
              fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
              ...(tab === t.id ? TAB_STYLES.selected : TAB_STYLES.default),
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <STTooltip term={t.tooltip}>{t.label}</STTooltip>
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

      {/* Tabla comparativa */}
      <div style={{ width: '100%', maxWidth: '1000px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {['Paradigma', 'Instructor', 'Representación', 'Uso hoy'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
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
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <td style={{ padding: '0.55rem 1rem', color: p.color, fontWeight: 500 }}>{p.label}</td>
                <td style={{ padding: '0.55rem 1rem', color: 'var(--text)' }}>{p.instructor}</td>
                <td style={{ padding: '0.55rem 1rem', color: 'var(--text-dim)' }}>{p.repr}</td>
                <td style={{ padding: '0.55rem 1rem', color: 'var(--text-dim)' }}>{p.uso}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <STFloatingButton />
    </div>
  )
}
