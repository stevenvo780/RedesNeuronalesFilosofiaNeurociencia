import STTooltip from '../components/st/STTooltip'
import STTensionPanel from '../components/st/STTensionPanel'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

// Visualización: campos receptivos sintéticos — red vs. biológico
function ReceptiveFieldCanvas({ type }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#04040e'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const cells = 6

    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < cells; j++) {
        const x = (W * 0.15) + (i / (cells - 1)) * (W * 0.7)
        const y = (H * 0.18) + (j / (cells - 1)) * (H * 0.65)
        const dx = (x - cx) / (W * 0.4)
        const dy = (y - cy) / (H * 0.4)

        let val
        if (type === 'bio') {
          // Gaussian-like receptive field with slight elongation (oriented)
          const angle = Math.PI / 4
          const rx = dx * Math.cos(angle) + dy * Math.sin(angle)
          const ry = -dx * Math.sin(angle) + dy * Math.cos(angle)
          val = Math.exp(-(rx * rx / 0.08 + ry * ry / 0.25))
        } else {
          // Trained network — very similar Gaussian-oriented field
          const angle = Math.PI / 4 + 0.12
          const rx = dx * Math.cos(angle) + dy * Math.sin(angle)
          const ry = -dx * Math.sin(angle) + dy * Math.cos(angle)
          val = Math.exp(-(rx * rx / 0.09 + ry * ry / 0.26)) * 0.92
        }

        const size = Math.max(2, (W / cells) * 0.35)
        const r = Math.round(val * (type === 'bio' ? 34 : 124))
        const g = Math.round(val * (type === 'bio' ? 197 : 109))
        const b = Math.round(val * (type === 'bio' ? 94 : 250))
        ctx.fillStyle = `rgba(${r},${g},${b},${0.15 + val * 0.85})`
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.fillStyle = type === 'bio' ? '#22c55e' : '#7c6dfa'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(type === 'bio' ? 'neurona real (área 7a)' : 'unidad entrenada (red)', W / 2, H - 6)
  }, [type])

  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />
}

export default function S12b_Convergencia({ profesorMode }) {
  return (
    <div className="section-slide" style={{ gap: '1.8rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Convergencia Empírica: Andersen & Zipser</div>
        <div className="section-subtitle">La apuesta de Hinton ante la evidencia</div>
      </div>

      <div className="quote" style={{ maxWidth: '950px', fontSize: '1.1rem' }}>
        "Andersen y Zipser entrenaron una red con retropropagación para transformar coordenadas espaciales entre marcos de referencia. Las unidades ocultas desarrollaron propiedades similares a las neuronas reales de la corteza parietal de mono (área 7a). La red no fue diseñada para imitarlas — emergió sola."
      </div>

      {/* Comparación visual */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '1000px' }}>
        {[
          { type: 'bio', label: 'Neurona biológica', sublabel: 'Corteza parietal de mono, área 7a', color: '#22c55e' },
          { type: 'net', label: 'Unidad artificial entrenada', sublabel: 'Red entrenada con retropropagación', color: '#7c6dfa' },
        ].map(item => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: item.type === 'bio' ? 0.2 : 0.45 }}
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
      </div>

      {/* Qué significa y qué no significa */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '1100px' }}>
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
        ].map(col => (
          <div key={col.titulo} style={{
            flex: '1 1 280px',
            background: 'var(--bg-3)',
            borderLeft: `4px solid ${col.color}`,
            borderRadius: '0 10px 10px 0',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: col.color, marginBottom: '0.6rem', fontFamily: 'monospace' }}>
              {col.titulo}
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {col.items.map((item, i) => (
                <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: '0.3rem' }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Tensión filosófica */}
      <STTensionPanel
        title="Convergencia Funcional vs. Convergencia Mecanística"
        items={[
          {
            label: 'Convergencia funcional',
            status: 'yes',
            desc: 'Las representaciones que emergen en la red son similares a las biológicas. El tipo de organización es compatible.',
          },
          {
            label: 'Convergencia mecanística',
            status: 'no',
            desc: 'El mecanismo de aprendizaje (retropropagación) sigue siendo biológicamente implausible. Misma salida, mecanismo distinto.',
          },
        ]}
      />

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1100px', width: '100%', fontSize: '1rem', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Implicación filosófica clave:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            La convergencia de Andersen-Zipser es el argumento más fuerte del paper de Hinton, pero también el más acotado.
            Muestra que la <em>organización funcional</em> puede converger aunque el <em>mecanismo</em> sea diferente.
            Esto es compatible con la realizabilidad múltiple de Putnam: la misma función, implementada distinto.
            Pero también abre la pregunta de Bechtel: ¿qué hace que esas representaciones sean <em>las mismas</em>
            si el mecanismo que las produce es diferente?
          </span>
        </div>
      )}
    </div>
  )
}
