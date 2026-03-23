import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircleQuestion, Sparkles, X } from 'lucide-react'

const QA_ITEMS = [
  {
    question: '¿Qué aporta Hinton en 1992 a la discusión filosófica sobre el aprendizaje?',
    answer: 'Propone que una red puede aprender regularidades de la experiencia sin depender de reglas simbólicas explícitas, lo que desplaza la explicación desde la manipulación de símbolos hacia la adaptación distribuida de pesos.'
  },
  {
    question: '¿Por qué la retropropagación fue tan importante?',
    answer: 'Porque convirtió el ajuste multicapa en un procedimiento sistemático: primero se calcula una salida, luego se mide el error y finalmente ese error se reparte hacia atrás para corregir las conexiones que más contribuyeron al fallo.'
  },
  {
    question: '¿Esto reemplaza por completo a los enfoques simbólicos?',
    answer: 'No necesariamente. Una de las tesis más interesantes del curso es que las redes muestran una forma distinta de representar y aprender, pero eso abre un debate sobre complementariedad, límites explicativos e interpretación semántica.'
  },
  {
    question: '¿Qué relación tiene esto con la neurociencia?',
    answer: 'La relación no es de copia literal del cerebro, sino de inspiración estructural: unidades conectadas, ajuste por experiencia y patrones distribuidos. La pregunta filosófica clave es cuánto de esa inspiración basta para explicar cognición real.'
  },
]

const MotionDiv = motion.div

export default function QAModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(1rem, 3vw, 2rem)'
          }}
        >
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(3, 6, 20, 0.78)',
              backdropFilter: 'blur(8px)'
            }}
          />

          <MotionDiv
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: 'relative',
              width: 'min(920px, 100%)',
              maxHeight: 'min(88vh, 960px)',
              background: 'linear-gradient(180deg, rgba(20,20,32,0.98) 0%, rgba(12,12,22,0.98) 100%)',
              border: '1px solid rgba(124,109,250,0.22)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '1.1rem 1.25rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                background: 'linear-gradient(180deg, rgba(124,109,250,0.12) 0%, rgba(255,255,255,0.02) 100%)'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '999px',
                    background: 'rgba(124,109,250,0.16)',
                    color: 'var(--accent-2)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    marginBottom: '0.8rem'
                  }}
                >
                  <Sparkles size={14} strokeWidth={2} />
                  DISCUSIÓN RÁPIDA
                </div>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.15rem, 2vw, 1.4rem)', color: 'var(--text-h)', fontWeight: 700 }}>
                  Preguntas y respuestas para abrir conversación
                </h2>
                <p style={{ margin: '0.45rem 0 0', color: 'var(--text-dim)', lineHeight: 1.55, maxWidth: '64ch' }}>
                  Un apoyo rápido para la presentación: preguntas típicas, respuestas cortas y una brújula conceptual para salir elegante de dudas difíciles. Cierre con estilo, no con pánico académico.
                </p>
              </div>

              <button
                onClick={onClose}
                aria-label="Cerrar Q&A"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="scroll-y"
              style={{
                padding: '1.1rem 1.25rem 1.35rem',
                overflowY: 'auto',
                flex: 1,
                display: 'grid',
                gap: '0.9rem'
              }}
            >
              {QA_ITEMS.map(({ question, answer }) => (
                <article
                  key={question}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    padding: '1rem 1rem 0.95rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'rgba(124,109,250,0.16)',
                        color: 'var(--accent-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <MessageCircleQuestion size={17} strokeWidth={1.9} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.45rem', color: 'var(--text-h)', fontSize: '1rem', lineHeight: 1.35 }}>
                        {question}
                      </h3>
                      <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.65, fontSize: '0.97rem' }}>
                        {answer}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  )
}
