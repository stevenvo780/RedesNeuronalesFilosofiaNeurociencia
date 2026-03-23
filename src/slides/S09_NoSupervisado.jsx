import STTooltip from "../components/st/STTooltip"
import STFloatingButton from "../components/st/STFloatingButton"
import { useEffect, useRef, useState } from 'react'
import STDeriveCard from '../components/st/STDeriveCard'
import { ST_ONTOLOGIA } from '../data/st_results'

const PARADIGMS = [
  { label: 'Supervisado + Retroprop.', instructor: 'Sí', repr: 'Distribuida', uso: 'Clasificación, visión, voz', color: '#7c6dfa' },
  { label: 'Componentes principales', instructor: 'No', repr: 'Distribuida cooperativa', uso: 'Reducción dimensionalidad', color: '#06b6d4' },
  { label: 'Competitivo / Kohonen', instructor: 'No', repr: 'Local (una gana)', uso: 'Mapas, clustering', color: '#22c55e' },
  { label: 'Hebb (1949) / Oja', instructor: 'No', repr: 'Local hebbiana', uso: 'Biológicamente plausible, LTP', color: '#a78bfa' },
  { label: 'Barlow sparse coding', instructor: 'No', repr: 'Intermedia (sparse)', uso: 'Codificación eficiente', color: '#eab308' },
  { label: 'Refuerzo (RLHF)', instructor: 'Señal recompensa', repr: 'Distribuida', uso: 'LLMs actuales', color: '#f97316' },
]

const TAB_STYLES = {
  selected: { background: 'rgba(124,109,250,0.2)', border: '1px solid var(--accent)', color: 'var(--accent-2)' },
  default: { background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-dim)' },
}

export default function S09_NoSupervisado({ profesorMode }) {
  const [tab, setTab] = useState('pca')
  const kohRef = useRef(null)
  const pcaRef = useRef(null)
  const compRef = useRef(null)
  const hebbRef = useRef(null)
  const animFrameRef = useRef(null)
  const kohMapRef = useRef(null)

  // PCA — point cloud
  useEffect(() => {
    if (tab !== 'pca' || !pcaRef.current) return
    const canvas = pcaRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    // Generate correlated 2D cloud
    const points = Array.from({ length: 120 }, () => {
      const t = Math.random() * 2 * Math.PI
      const r = 0.3 + Math.random() * 0.5
      return { x: W / 2 + Math.cos(t) * r * W * 0.4, y: H / 2 + Math.sin(t * 0.4) * r * H * 0.35 }
    })

    points.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(124,109,250,0.6)'
      ctx.fill()
    })

    // PCA axis (first component)
    ctx.strokeStyle = '#06b6d4'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(W * 0.15, H * 0.6)
    ctx.lineTo(W * 0.85, H * 0.4)
    ctx.stroke()

    ctx.fillStyle = '#06b6d4'
    ctx.font = '10px monospace'
    ctx.fillText('PC1', W * 0.86, H * 0.38)

    ctx.fillStyle = '#a78bfa'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Cara de elipses: 1M píxeles → 5 parámetros', W / 2, H - 8)
  }, [tab])

  // Competitive — forming clusters
  useEffect(() => {
    if (tab !== 'competitive' || !compRef.current) return
    const canvas = compRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    const CLUSTERS = [
      { cx: W * 0.3, cy: H * 0.3, color: 'rgba(34,197,94,', label: 'osos pardos' },
      { cx: W * 0.7, cy: H * 0.65, color: 'rgba(6,182,212,', label: 'osos polares' },
    ]

    ctx.clearRect(0, 0, W, H)
    CLUSTERS.forEach(c => {
      for (let i = 0; i < 35; i++) {
        const x = c.cx + (Math.random() - 0.5) * W * 0.25
        const y = c.cy + (Math.random() - 0.5) * H * 0.25
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = c.color + '0.7)'
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(c.cx, c.cy, 16, 0, Math.PI * 2)
      ctx.fillStyle = c.color + '0.9)'
      ctx.fill()
      ctx.fillStyle = '#f0f0ff'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('W', c.cx, c.cy + 3)

      ctx.fillStyle = c.color + '0.9)'
      ctx.font = '10px sans-serif'
      ctx.fillText(c.label, c.cx, c.cy + 30)
    })

    ctx.fillStyle = '#6b6b88'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('una unidad gana → sus pesos migran al patrón', W / 2, H - 8)
  }, [tab])

  // Kohonen SOM — animate training
  useEffect(() => {
    if (tab !== 'kohonen' || !kohRef.current) return
    const canvas = kohRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    const GRID = 8
    if (!kohMapRef.current) {
      kohMapRef.current = Array.from({ length: GRID }, (_, i) =>
        Array.from({ length: GRID }, (_, j) => ({
          x: Math.random() * W,
          y: Math.random() * H,
        }))
      )
    }

    let frame = 0
    function animate() {
      frame++
      if (frame > 200) { cancelAnimationFrame(animFrameRef.current); return }

      // Random input
      const inputX = Math.random() * W
      const inputY = Math.random() * H

      // Find BMU
      let bestI = 0, bestJ = 0, bestD = Infinity
      kohMapRef.current.forEach((row, i) => row.forEach((node, j) => {
        const d = (node.x - inputX) ** 2 + (node.y - inputY) ** 2
        if (d < bestD) { bestD = d; bestI = i; bestJ = j }
      }))

      const lr = 0.1 * Math.exp(-frame / 150)
      const radius = 3 * Math.exp(-frame / 100)

      kohMapRef.current.forEach((row, i) => row.forEach((node, j) => {
        const dist = Math.sqrt((i - bestI) ** 2 + (j - bestJ) ** 2)
        if (dist <= radius + 1) {
          const h = Math.exp(-(dist ** 2) / (2 * (radius + 0.01) ** 2))
          node.x += lr * h * (inputX - node.x)
          node.y += lr * h * (inputY - node.y)
        }
      }))

      ctx.clearRect(0, 0, W, H)

      // Draw grid connections
      ctx.strokeStyle = 'rgba(124,109,250,0.4)'
      ctx.lineWidth = 1
      kohMapRef.current.forEach((row, i) => row.forEach((node, j) => {
        if (j + 1 < GRID) {
          const next = kohMapRef.current[i][j + 1]
          ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(next.x, next.y); ctx.stroke()
        }
        if (i + 1 < GRID) {
          const next = kohMapRef.current[i + 1][j]
          ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(next.x, next.y); ctx.stroke()
        }
      }))

      // Draw nodes
      kohMapRef.current.forEach((row, i) => row.forEach((node, j) => {
        const isBMU = i === bestI && j === bestJ
        ctx.beginPath()
        ctx.arc(node.x, node.y, isBMU ? 6 : 4, 0, Math.PI * 2)
        ctx.fillStyle = isBMU ? '#22c55e' : 'rgba(124,109,250,0.7)'
        ctx.fill()
      }))

      ctx.fillStyle = '#6b6b88'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(`época ${frame}/200`, W / 2, H - 6)

      animFrameRef.current = requestAnimationFrame(animate)
    }
    kohMapRef.current = null
    animate()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [tab])

  // Hebb — synapse strengthening animation
  useEffect(() => {
    if (tab !== 'hebb' || !hebbRef.current) return
    const canvas = hebbRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    let weight = 0.05
    let phase = 0     // 0=idle, 1=pre fires, 2=post fires, 3=weight update
    let phaseFrame = 0
    let eventCount = 0

    function animate() {
      phaseFrame++
      if (phaseFrame > 45) {
        phaseFrame = 0
        phase = (phase + 1) % 4
        if (phase === 0) {
          eventCount++
          weight = Math.min(weight + 0.18, 1.0)
        }
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#04040e'
      ctx.fillRect(0, 0, W, H)

      const preX = W * 0.22, preY = H * 0.5
      const postX = W * 0.78, postY = H * 0.5
      const r = Math.min(W, H) * 0.1

      const preActive = phase === 1 || phase === 2
      const postActive = phase === 2

      // Synapse line — thickness = weight
      const lineW = 1.5 + weight * 10
      ctx.beginPath()
      ctx.moveTo(preX + r, preY)
      ctx.lineTo(postX - r, postY)
      ctx.strokeStyle = `rgba(167,139,250,${0.15 + weight * 0.85})`
      ctx.lineWidth = lineW
      ctx.stroke()

      // Weight label
      ctx.fillStyle = '#a78bfa'
      ctx.font = `bold ${Math.round(11 + weight * 4)}px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(`w = ${weight.toFixed(2)}`, W / 2, H / 2 - r - 14)

      // Co-activation flash
      if (postActive) {
        ctx.beginPath()
        ctx.arc(W / 2, H / 2, r * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(167,139,250,0.2)'
        ctx.fill()
        ctx.fillStyle = '#a78bfa'
        ctx.font = '10px monospace'
        ctx.fillText('co-activación!', W / 2, H - r - 24)
      }

      // PRE neuron
      ctx.beginPath()
      ctx.arc(preX, preY, r, 0, Math.PI * 2)
      ctx.fillStyle = preActive ? 'rgba(6,182,212,0.75)' : 'rgba(6,182,212,0.15)'
      ctx.fill()
      ctx.strokeStyle = '#06b6d4'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('PRE', preX, preY + 4)

      // POST neuron
      ctx.beginPath()
      ctx.arc(postX, postY, r, 0, Math.PI * 2)
      ctx.fillStyle = postActive ? 'rgba(34,197,94,0.75)' : 'rgba(34,197,94,0.15)'
      ctx.fill()
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = '11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('POST', postX, postY + 4)

      // Event counter
      ctx.fillStyle = '#6b6b88'
      ctx.font = '10px monospace'
      ctx.textAlign = 'right'
      ctx.fillText(`co-activaciones: ${eventCount}`, W - 8, H - 8)

      // Rule
      ctx.fillStyle = '#6b6b88'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('"neuronas que se disparan juntas, se conectan juntas" — Hebb 1949', W / 2, H - 8)

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [tab])

  return (
    <div className="section-slide" style={{ gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Aprendizaje No Supervisado</div>
        <div className="section-subtitle">El Ecosistema Topológico Computacional</div>
      </div>

      <div className="quote" style={{ maxWidth: '850px', fontSize: '1.1rem' }}>
        "¿Cómo logra un sistema desarrollar una <STTooltip term="representacion">representación isomórfica</STTooltip> del mundo, sin que un instructor omnisciente asigne etiquetas externas sobre qué es lo que observa?"
      </div>

      {/* Criterio de buena representación */}
      <div className="st-card" style={{ maxWidth: '900px', width: '100%' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.6rem' }}>
          EL CRITERIO UNIVERSAL DE COMPRESIÓN ACTIVA
        </div>
        <p style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.6 }}>
          Cualquier <STTooltip term="representacion">modelo representacional autónomo</STTooltip> obedece una tensión dialéctica:{' '}
          <strong style={{ color: 'var(--green)' }}>Eficiencia Ontológica</strong> (reducir dimensionalidad exprimiendo redundancias en vectores de <STTooltip term="peso">pesos</STTooltip>) y{' '}
          <strong style={{ color: 'var(--cyan)' }}>Fidelidad Generativa</strong> (garantizar que la señal de entrada pueda ser inferida/reconstruida a partir del código comprimido).
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', maxWidth: '1000px', width: '100%' }}>
        {[
          { id: 'pca', label: '9a — PCA' },
          { id: 'competitive', label: '9b — Competitivo' },
          { id: 'kohonen', label: '9c — Kohonen' },
          { id: 'hebb', label: '9d — Hebb' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '0.65rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: 'pointer',
              ...(tab === t.id ? TAB_STYLES.selected : TAB_STYLES.default),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        height: '350px',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {tab === 'pca' && <canvas ref={pcaRef} style={{ width: '100%', height: '100%' }} />}
        {tab === 'competitive' && <canvas ref={compRef} style={{ width: '100%', height: '100%' }} />}
        {tab === 'kohonen' && <canvas ref={kohRef} style={{ width: '100%', height: '100%' }} />}
        {tab === 'hebb' && <canvas ref={hebbRef} style={{ width: '100%', height: '100%' }} />}
      </div>

      {/* Tab descriptions */}
      <div style={{ fontSize: '1rem', color: 'var(--text-dim)', textAlign: 'center', maxWidth: '900px' }}>
        {tab === 'pca' && <><STTooltip term="aprendizaje_hebbiano">Cálculo de Componentes Principales</STTooltip> — Las unidades extraen correlaciones estadísticas dominantes (Linsker y Oja). Altamente <STTooltip term="plausibilidad_biologica">plausible biológicamente</STTooltip>.</>}
        {tab === 'competitive' && <>Redes de Competición Mutua (Winner-Takes-All). Las neuronas no colaboran, compiten. Actúa como un mecanismo implacable de <STTooltip term="representacion">categorización discreta</STTooltip>.</>}
        {tab === 'kohonen' && <>Mapas Auto-organizados (SOM). La geometría topológica importa. Obliga a neuronas vecinas en el perceptrón a codificar <STTooltip term="vector_de_estado">vectores de estado</STTooltip> estructuralmente similares, imitando la corteza cerebral real.</>}
        {tab === 'hebb' && <><STTooltip term="aprendizaje_hebbiano">Regla de Hebb (1949)</STTooltip> — la sinapsis se fortalece con cada co-activación. Sin señal de error externa. Oja (1982): PCA implementable con reglas hebbianas. La alternativa <STTooltip term="plausibilidad_biologica">biológicamente plausible</STTooltip> a la retropropagación.</>}
      </div>

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
              <tr key={p.label} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.55rem 1rem', color: p.color, fontWeight: 500 }}>{p.label}</td>
                <td style={{ padding: '0.55rem 1rem', color: 'var(--text)' }}>{p.instructor}</td>
                <td style={{ padding: '0.55rem 1rem', color: 'var(--text-dim)' }}>{p.repr}</td>
                <td style={{ padding: '0.55rem 1rem', color: 'var(--text-dim)' }}>{p.uso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
