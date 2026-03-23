import STTooltip from "../components/st/STTooltip"
import STTensionPanel from "../components/st/STTensionPanel"
import { useEffect, useRef } from 'react'

const REPR_TYPES = [
  {
    id: 'distributed',
    label: 'Distribuida',
    desc: 'Muchas unidades activas juntas representan un patrón (PCA, backprop)',
    color: '#7c6dfa',
    pattern: [0.9, 0.7, 0.8, 0.6, 0.8, 0.7, 0.9, 0.5],
  },
  {
    id: 'local',
    label: 'Local',
    desc: 'Una sola unidad activa representa un patrón (competitivo extremo)',
    color: '#22c55e',
    pattern: [0.05, 0.05, 0.95, 0.05, 0.05, 0.05, 0.05, 0.05],
  },
  {
    id: 'sparse',
    label: 'Sparse (Barlow)',
    desc: 'Un subconjunto pequeño activo — economía + calidad (caso más interesante)',
    color: '#eab308',
    pattern: [0.08, 0.85, 0.06, 0.07, 0.78, 0.06, 0.07, 0.06],
  },
]

function ReprDiagram({ type }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    const n = type.pattern.length
    const r = Math.min(W / (n * 2.5), 20)
    const spacing = W / (n + 1)

    type.pattern.forEach((act, i) => {
      const x = spacing * (i + 1)
      const y = H / 2
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${hexToRgb(type.color)},${act})`
      ctx.fill()
      ctx.strokeStyle = type.color
      ctx.lineWidth = 1.5
      ctx.stroke()
    })
  }, [type])

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '60px' }} />
  )
}

export default function S10_ReprDistribuidas({ profesorMode }) {
  const recCanvasRef = useRef(null)

  useEffect(() => {
    const canvas = recCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    // 3 layers recurrentes
    const nodes = [
      { x: W * 0.2, y: H * 0.5, label: 'A' },
      { x: W * 0.5, y: H * 0.35, label: 'B' },
      { x: W * 0.8, y: H * 0.5, label: 'C' },
      { x: W * 0.5, y: H * 0.65, label: 'D' },
    ]

    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // forward + recurrent
      [0, 3], [2, 1], // cross
    ]

    edges.forEach(([a, b]) => {
      const na = nodes[a], nb = nodes[b]
      ctx.strokeStyle = 'rgba(124,109,250,0.5)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(na.x, na.y)

      // Curved arrow for recurrent
      const mx = (na.x + nb.x) / 2
      const my = (na.y + nb.y) / 2 - 20
      ctx.quadraticCurveTo(mx, my, nb.x, nb.y)
      ctx.stroke()
    })

    nodes.forEach(n => {
      ctx.beginPath()
      ctx.arc(n.x, n.y, 18, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(124,109,250,0.25)'
      ctx.fill()
      ctx.strokeStyle = '#7c6dfa'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#a78bfa'
      ctx.font = '12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(n.label, n.x, n.y + 4)
    })

    ctx.fillStyle = '#6b6b88'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('la actividad vuelve → estado estable o dinámica temporal', W / 2, H - 6)
  }, [])

  return (
    <div className="section-slide" style={{ gap: '1.8rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Ontología de las Representaciones</div>
        <div className="section-subtitle">Del Localismo al Sparse Coding Recurrente</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px', fontSize: '1.1rem' }}>
        "¿Dónde reside el concepto de 'abuela' en la red? ¿En una sola neurona (célula de la abuela) o distribuida holográficamente en mil sinapsis? Hinton y Barlow buscaban el punto medio ontológico."
      </div>
      
      <STTensionPanel 
        title="El Debate Representacional"
        items={[
          { label: "Postura Localista", status: "no", desc: "Aislar conceptos empíricos en unidades individuales. Frágil ante la muerte celular, incapaz de generalizar." },
          { label: "Postura Distribuida (Sparse)", status: "yes", desc: "La identidad es un vector de activación esparcido. Robusto, combinatorio, topológicamente denso." }
        ]}
      />

      {/* Tres tipos de representación */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: '1100px', justifyContent: 'center' }}>
        {REPR_TYPES.map(t => (
          <div key={t.id} style={{
            flex: '1 1 200px',
            background: 'var(--bg-3)',
            border: `1px solid ${t.color}44`,
            borderTop: `3px solid ${t.color}`,
            borderRadius: '8px',
            padding: '0.75rem',
          }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: t.color, marginBottom: '0.6rem' }}>{t.label}</div>
            <ReprDiagram type={t} />
            <div style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginTop: '0.8rem', lineHeight: 1.5 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '1.05rem', color: 'var(--text)', textAlign: 'center', maxWidth: '900px', lineHeight: 1.6 }}>
        Hinton subraya que: <span style={{ color: 'var(--accent-2)' }}>"los casos más interesantes ocurren en la frontera entre la extrema economía (localismo) y la extrema densidad"</span> — El <STTooltip term="representacion">Sparse Coding</STTooltip> de Barlow soluciona esto garantizando que el estado sea decodificable pero empleando fracciones mínimas de neuronas activas.
      </div>

      {/* Redes recurrentes */}
      <div style={{ width: '100%', maxWidth: '900px', alignSelf: 'center' }}>
        <div style={{ fontSize: '1.05rem', color: 'var(--text-h)', fontWeight: 600, marginBottom: '0.8rem', textAlign: 'center' }}>
          Topología No Lineal: <STTooltip term="arquitectura">Redes Recurrentes (RNN)</STTooltip>
        </div>
        <div style={{
          height: '240px',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <canvas ref={recCanvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%', fontSize: '1rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Vínculo con hoy:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            Las LSTM y los transformers son descendientes directos de las redes recurrentes de Hinton.
            La atención (attention) es un mecanismo de recuperación de representaciones distribuidas
            que operacionaliza el criterio de "buena representación" de forma masivamente paralela.
          </span>
        </div>
      )}
    </div>
  )
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
    : '124,109,250'
}
