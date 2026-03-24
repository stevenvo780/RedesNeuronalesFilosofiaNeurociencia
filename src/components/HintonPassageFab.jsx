import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Quote, X } from 'lucide-react'
import { HINTON_PASSAGES, HINTON_PASSAGE_SOURCE } from '../data/hintonPassages'

const MotionButton = motion.button
const MotionDiv = motion.div

export default function HintonPassageFab({
  slideId,
  bottom = '4.8rem',
  right = '1rem',
  panelRight = right,
  left,
  panelLeft,
  mobile = false,
}) {
  const [open, setOpen] = useState(false)
  const passage = HINTON_PASSAGES[slideId]

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!passage) return null

  return (
    <>
      <MotionButton
        onClick={() => setOpen(true)}
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.24, ease: 'easeOut' }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        style={{
          position: 'fixed',
          right: left ? 'auto' : right,
          left: left ?? 'auto',
          bottom,
          zIndex: 180,
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          padding: mobile ? '0.55rem 0.95rem' : '0.5rem 1rem',
          borderRadius: '999px',
          border: '1px solid rgba(6,182,212,0.3)',
          background: 'rgba(8,12,24,0.88)',
          color: '#8be9fd',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 14px 36px rgba(0,0,0,0.28)',
          cursor: 'pointer',
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: mobile ? '0.72rem' : '0.68rem',
          whiteSpace: 'nowrap',
        }}
        aria-label={`Abrir pasaje del texto de Hinton para ${passage.topic}`}
      >
        <BookOpen size={15} strokeWidth={1.9} />
        <span>Texto Hinton</span>
      </MotionButton>

      <AnimatePresence>
        {open && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 190,
                background: 'rgba(0,0,0,0.42)',
                backdropFilter: 'blur(4px)',
              }}
            />

            <MotionDiv
              initial={mobile ? { y: 48, opacity: 0 } : { x: 24, y: 10, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              exit={mobile ? { y: 48, opacity: 0 } : { x: 24, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'fixed',
                right: panelLeft ? 'auto' : panelRight,
                left: mobile ? (panelLeft ?? '0.75rem') : (panelLeft ?? 'auto'),
                bottom: mobile ? '4.8rem' : `calc(${bottom} + 3.4rem)`,
                width: mobile ? 'auto' : 'min(560px, calc(100vw - 2rem))',
                maxHeight: mobile ? 'min(68svh, 560px)' : 'min(70vh, 600px)',
                overflowY: 'auto',
                zIndex: 200,
                borderRadius: mobile ? '18px' : '20px',
                border: '1px solid rgba(139,233,253,0.18)',
                background: 'linear-gradient(180deg, rgba(8,12,24,0.98) 0%, rgba(14,17,30,0.98) 100%)',
                boxShadow: '0 22px 60px rgba(0,0,0,0.4)',
                padding: mobile ? '1rem' : '1.05rem 1.1rem 1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(6,182,212,0.12)',
                  color: '#8be9fd',
                  flexShrink: 0,
                }}>
                  <Quote size={18} strokeWidth={2} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.68rem',
                    color: '#67e8f9',
                    fontFamily: '"JetBrains Mono", monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.35rem',
                  }}>
                    Texto directo en español
                  </div>
                  <div style={{ fontSize: mobile ? '1rem' : '1.05rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.25 }}>
                    {passage.topic}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                    Sección del artículo: {passage.section}
                  </div>
                </div>

                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  aria-label="Cerrar texto de Hinton"
                >
                  <X size={16} strokeWidth={2.1} />
                </button>
              </div>

              <div style={{
                marginTop: '0.95rem',
                padding: mobile ? '0.9rem' : '1rem 1.05rem',
                borderRadius: '16px',
                background: 'rgba(6,182,212,0.05)',
                border: '1px solid rgba(6,182,212,0.14)',
              }}>
                {passage.excerpt.map((paragraph) => (
                  <p
                    key={paragraph}
                    style={{
                      fontSize: mobile ? '0.88rem' : '0.9rem',
                      lineHeight: 1.68,
                      color: 'var(--text)',
                      marginBottom: '0.8rem',
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              <div style={{
                marginTop: '0.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {HINTON_PASSAGE_SOURCE} · página {passage.pdfPage}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-dim)',
                }}>
                  Fragmento asociado al tema actual del slide
                </div>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
