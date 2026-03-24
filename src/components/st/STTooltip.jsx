import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

void motion

const DICT = {
  dendrita: 'Extensión ramificada del soma neuronal que recibe señales de otras neuronas y las transmite al cuerpo celular.',
  axón: 'Prolongación larga del soma que conduce el potencial de acción hacia las terminales sinápticas.',
  sinapsis: 'Unión funcional entre dos neuronas donde se transmite la señal, ya sea por vía química (neurotransmisores) o eléctrica.',
  aprendizaje: 'En el marco de Hinton: cambio en la eficacia sináptica (pesos) que modifica la respuesta futura de la red ante patrones similares.',
  representación: 'Patrón de actividad distribuida sobre múltiples unidades que codifica información sobre el mundo externo o interno.',
  'código poblacional': 'Representación en la que la información se extrae del patrón de actividad de una población completa de neuronas, no de unidades individuales.',
  'retropropagación': 'Algoritmo que calcula el gradiente del error respecto a cada peso propagando señales de error desde la capa de salida hacia la entrada.',
  'unidades ocultas': 'Capas intermedias de una red neuronal cuya actividad no está directamente especificada por el entrenador; aprenden representaciones autónomamente.',
}

export default function STTooltip({ term, children }) {
  const [visible, setVisible] = useState(false)
  const def = DICT[term?.toLowerCase()]

  if (!def) return <span>{children || term}</span>

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        borderBottom: '1px dashed var(--accent)',
        cursor: 'help',
        color: 'var(--accent-2)',
        fontWeight: 'bold'
      }}>
        {children || term}
      </span>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 5, x: '-50%' }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: '120%',
              left: '50%',
              background: 'rgba(26, 26, 36, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--accent)',
              borderRadius: '8px',
              padding: '0.8rem 1rem',
              fontSize: '1rem',
              color: 'var(--text)',
              width: 'max(300px, 20vw)',
              zIndex: 100,
              lineHeight: 1.5,
              boxShadow: '0 8px 32px rgba(124, 109, 250, 0.2)',
              pointerEvents: 'none',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-2)', marginBottom: '0.4rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>
              ST · 04_Diccionario
            </div>
            <strong style={{ color: 'var(--text-h)', fontSize: '1.1rem', display: 'block', marginBottom: '0.2rem' }}>{term}</strong>
            <span style={{ fontSize: '0.95em' }}>{def}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
