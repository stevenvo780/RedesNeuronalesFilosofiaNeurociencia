import { useEffect, useRef, useState } from 'react'
import STDeriveCard from '../components/st/STDeriveCard'
import { ST_ONTOLOGIA } from '../data/st_results'

const PARADIGMS = [
  { label: 'Supervisado + Retroprop.', instructor: 'Sí', repr: 'Distribuida', uso: 'Clasificación, visión, voz', color: '#7c6dfa' },
  { label: 'Componentes principales', instructor: 'No', repr: 'Distribuida cooperativa', uso: 'Reducción dimensionalidad', color: '#06b6d4' },
  { label: 'Competitivo / Kohonen', instructor: 'No', repr: 'Local (una gana)', uso: 'Mapas, clustering', color: '#22c55e' },
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

  return (
    <div className="section-slide" style={{ gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Aprendizaje no supervisado</div>
        <div className="section-subtitle">La mitad más filosófica</div>
      </div>

      <div className="quote" style={{ maxWidth: '640px' }}>
        "¿Cómo puede una red aprender a representar el mundo si nadie le dice qué es el mundo?"
      </div>

      {/* Criterio de buena representación */}
      <div className="st-card" style={{ maxWidth: '640px', width: '100%' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.4rem' }}>
          CRITERIO COMPARTIDO — todos los procedimientos lo usan
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.6 }}>
          Una buena representación es:{' '}
          <strong style={{ color: 'var(--green)' }}>económica</strong> (pocos bits para las unidades ocultas) +{' '}
          <strong style={{ color: 'var(--cyan)' }}>reconstructiva</strong> (la entrada se puede recuperar).
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', maxWidth: '640px', width: '100%' }}>
        {[
          { id: 'pca', label: '9a — PCA' },
          { id: 'competitive', label: '9b — Competitivo' },
          { id: 'kohonen', label: '9c — Kohonen' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1,
              padding: '0.4rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
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
        maxWidth: '640px',
        height: '200px',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        {tab === 'pca' && <canvas ref={pcaRef} style={{ width: '100%', height: '100%' }} />}
        {tab === 'competitive' && <canvas ref={compRef} style={{ width: '100%', height: '100%' }} />}
        {tab === 'kohonen' && <canvas ref={kohRef} style={{ width: '100%', height: '100%' }} />}
      </div>

      {/* Tab descriptions */}
      <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', maxWidth: '580px' }}>
        {tab === 'pca' && 'Algoritmos de Linsker y Oja — solo correlaciones, sin retropropagación. Biológicamente plausibles.'}
        {tab === 'competitive' && 'Las unidades compiten: una gana, sus pesos migran hacia el patrón. Contraste con PCA: cooperan vs. compiten.'}
        {tab === 'kohonen' && 'Unidades físicamente cercanas aprenden patrones similares → mapas topográficos como en la corteza visual.'}
      </div>

      {/* ST Deriva */}
      {profesorMode && (
        <div style={{ width: '100%', maxWidth: '640px' }}>
          <STDeriveCard derive={ST_ONTOLOGIA.derives[0]} />
          <STDeriveCard derive={ST_ONTOLOGIA.derives[1]} />
        </div>
      )}

      {/* Tabla comparativa */}
      <div style={{ width: '100%', maxWidth: '640px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['Paradigma', 'Instructor', 'Representación', 'Uso hoy'].map(h => (
                <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--text-dim)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PARADIGMS.map(p => (
              <tr key={p.label} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.35rem 0.6rem', color: p.color, fontWeight: 500 }}>{p.label}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: 'var(--text)' }}>{p.instructor}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: 'var(--text-dim)' }}>{p.repr}</td>
                <td style={{ padding: '0.35rem 0.6rem', color: 'var(--text-dim)' }}>{p.uso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
