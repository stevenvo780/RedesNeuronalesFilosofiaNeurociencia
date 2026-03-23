import STTensionPanel from "../components/st/STTensionPanel"
import STModalBadge from '../components/st/STModalBadge'
import { motion } from 'framer-motion'

const ARCO = [
  {
    autor: 'Daugman 1992',
    color: '#06b6d4',
    symbol: '□',
    tesis: 'Toda teoría del cerebro viene acompañada de una metáfora tecnológica de época.',
    implicacion: 'La computación no es el lenguaje final — es el lenguaje vigente. Necesario reconocerlo.',
  },
  {
    autor: 'Hinton 1992',
    color: '#7c6dfa',
    symbol: '◇',
    tesis: 'El aprendizaje distribuido puede modelar cognición sin reglas simbólicas explícitas.',
    implicacion: 'Funciona como herramienta; si explica el cerebro, es una apuesta empírica, no un hecho.',
  },
  {
    autor: 'Bechtel 2001',
    color: '#a78bfa',
    symbol: '?',
    tesis: '¿Qué es exactamente una representación mental y qué condiciones la constituyen?',
    implicacion: 'La convergencia cerebro–red exige responder esto antes de poder afirmarla.',
  },
]

const TESIS = `La red neuronal artificial no es una descripción del cerebro,
sino una apuesta en un programa de investigación. Su valor explicativo —
no solo instrumental — depende de si ese programa genera predicciones
nuevas y corroborables sobre cómo funciona la cognición real.`

export default function S13_CierreArgumental({ profesorMode }) {
  return (
    <div className="section-slide" style={{ gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Tesis y Arco Argumentativo</div>
        <div className="section-subtitle">¿Qué hemos argumentado en esta presentación?</div>
      </div>

      {/* Tesis central */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background: 'rgba(124,109,250,0.10)',
          border: '1px solid rgba(124,109,250,0.45)',
          borderRadius: '16px',
          padding: '1.5rem 2.5rem',
          maxWidth: '920px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.8rem', letterSpacing: '0.12em' }}>
          TESIS CENTRAL
        </div>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-h)', lineHeight: 1.75, margin: 0, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
          {TESIS}
        </p>
      </motion.div>

      {/* Arco de tres autores */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '1100px', justifyContent: 'center' }}>
        {ARCO.map((a, i) => (
          <motion.div
            key={a.autor}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.15 }}
            style={{
              flex: '1 1 280px',
              background: 'var(--bg-3)',
              border: `1px solid ${a.color}44`,
              borderTop: `4px solid ${a.color}`,
              borderRadius: '10px',
              padding: '1.25rem 1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <span style={{ fontSize: '1.3rem', color: a.color, fontFamily: 'monospace', fontWeight: 700 }}>{a.symbol}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: a.color }}>{a.autor}</span>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-h)', lineHeight: 1.55, margin: '0 0 0.6rem' }}>
              {a.tesis}
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              → {a.implicacion}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Tensión final */}
      <STTensionPanel
        title="La Pregunta que Permanece Abierta"
        items={[
          {
            label: 'Éxito instrumental',
            status: 'yes',
            desc: 'Las redes neuronales funcionan y generan predicciones corroborables en dominios específicos. Eso es real e importante.',
          },
          {
            label: 'Explicación neurocientífica',
            status: 'no',
            desc: 'Mostrar que un mecanismo funciona no prueba que sea el mecanismo que usa el cerebro. La brecha explicativa subsiste.',
          },
        ]}
      />

      {/* Pregunta para la discusión */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem 2rem',
          maxWidth: '900px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.6rem', letterSpacing: '0.1em' }}>
          PREGUNTA PARA LA DISCUSIÓN
        </div>
        <p style={{ fontSize: '1.1rem', color: 'var(--accent-2)', fontStyle: 'italic', lineHeight: 1.65, margin: 0 }}>
          "¿Cuándo un modelo computacional cuenta como explicación neurocientífica —
          y no solo como predicción o herramienta?"
        </p>
      </motion.div>

      {/* Modal badges */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <STModalBadge symbol="◇" content="CONV_POSS" />
        <STModalBadge symbol="□" content="META_HIST" title="Metáfora Históricamente Contingente" />
        <STModalBadge symbol="O" content="EPISTEMOLOGICAL_GAP" title="Brecha Explicativa Persistente" />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1100px', width: '100%', fontSize: '1rem', lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Lakatos y los programas de investigación:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            Un programa es <em>progresivo</em> si predice hechos novedosos que luego se verifican.
            <em> Degenerativo</em> si solo explica post-hoc lo que ya sabíamos.
            La pregunta para el conexionismo de Hinton: en 2024, ¿los LLMs han generado predicciones
            corroborables sobre cognición biológica, o han divergido hacia ingeniería pura?
            Si divergieron, el programa sigue vivo como tecnología pero muere como neurofilosofía.
          </span>
        </div>
      )}
    </div>
  )
}
