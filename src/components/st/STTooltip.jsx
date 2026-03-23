import { useState } from 'react'

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
      }}>
        {children || term}
      </span>
      {visible && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '0.5rem 0.75rem',
          fontSize: '0.78rem',
          color: 'var(--text)',
          width: '240px',
          zIndex: 100,
          lineHeight: 1.5,
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--accent)', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
            ST · 04_Diccionario
          </div>
          <strong style={{ color: 'var(--text-h)' }}>{term}</strong>: {def}
        </div>
      )}
    </span>
  )
}
