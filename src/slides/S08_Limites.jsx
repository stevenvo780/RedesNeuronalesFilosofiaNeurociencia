import { motion } from 'framer-motion'

const LIMITS = [
  {
    n: 1,
    title: 'Requiere instructor',
    desc: 'Necesita la salida correcta en cada ejemplo. El aprendizaje es supervisado — alguien debe saber la respuesta de antemano.',
    color: '#ef4444',
    icon: '👨‍🏫',
  },
  {
    n: 2,
    title: 'Escalabilidad',
    desc: 'El tiempo de aprendizaje crece más rápido que el tamaño de la red. Redes muy grandes son costosas de entrenar.',
    color: '#eab308',
    icon: '📏',
  },
  {
    n: 3,
    title: 'Mínimos locales',
    desc: 'La retropropagación puede quedar atrapada en mínimos locales del espacio de error. No garantiza convergencia global.',
    color: '#f97316',
    icon: '⚠️',
  },
  {
    n: 4,
    title: 'Implausibilidad biológica',
    desc: 'La retropropagación envía errores hacia atrás por las mismas conexiones. Ningún mecanismo biológico conocido hace eso.',
    color: '#a78bfa',
    icon: '🧬',
  },
]

export default function S08_Limites({ profesorMode }) {
  return (
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Límites del modelo</div>
        <div className="section-subtitle">Hinton mismo los dice</div>
      </div>

      <div className="quote" style={{ maxWidth: '560px' }}>
        "Hinton mismo los dice. No hay que ir lejos para encontrar las grietas."
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '0.75rem',
        width: '100%',
        maxWidth: '680px',
      }}>
        {LIMITS.map((l, i) => (
          <motion.div
            key={l.n}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            style={{
              background: 'var(--bg-3)',
              border: `1px solid ${l.color}44`,
              borderLeft: `4px solid ${l.color}`,
              borderRadius: '8px',
              padding: '0.75rem 1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.2rem' }}>{l.icon}</span>
              <div>
                <span style={{ fontSize: '0.68rem', color: l.color, fontFamily: 'monospace', marginRight: '0.3rem' }}>
                  L{l.n}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-h)' }}>
                  {l.title}
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5 }}>{l.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Puente */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          background: 'rgba(124,109,250,0.1)',
          border: '1px solid rgba(124,109,250,0.3)',
          borderRadius: '8px',
          padding: '0.75rem 1.25rem',
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-2)', fontStyle: 'italic' }}>
          "Si quitamos el instructor, ¿qué queda?
          La red aprende sola — o no aprende."
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
          → Sección siguiente: aprendizaje no supervisado
        </div>
      </motion.div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '600px', width: '100%', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Marco ST:</strong>{' '}
          Los límites L1–L4 corresponden a las fórmulas validadas en{' '}
          <code>06_Critica_Ontologica.st</code>:{' '}
          <code style={{ color: 'var(--yellow)' }}>BACK_IMPL → ¬BACK_BIO</code> (L4),{' '}
          <code style={{ color: 'var(--yellow)' }}>METRIC_UNSTABLE → ¬GOOD_METRIC</code> (L3).
        </div>
      )}
    </div>
  )
}
