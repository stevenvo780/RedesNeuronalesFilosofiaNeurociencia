import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BotMessageSquare, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react'
import { SLIDE_SUMMARIES } from '../data/slideSummaries'
import AIPanel from './AIPanel'
import QAModal from './QAModal'
import HintonPassageFab from './HintonPassageFab'

const MotionDiv = motion.div

/**
 * MobileLayout — full mobile experience.
 * - Scrollable summary cards (one per slide).
 * - Tapping "Ver slide" opens the interactive slide FULLSCREEN with scroll.
 * - Back button returns to cards.
 * - FAB gives direct IA access.
 */
export default function MobileLayout({ slides, profesorMode }) {
  const [activeSlide, setActiveSlide] = useState(null)   // index or null
  const [aiOpen, setAiOpen] = useState(false)
  const [qaOpen, setQaOpen] = useState(false)
  const cardRefs = useRef([])

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (aiOpen) setAiOpen(false)
        else if (qaOpen) setQaOpen(false)
        else if (activeSlide !== null) setActiveSlide(null)
      }
      if (e.key === 'q' || e.key === 'Q') {
        setQaOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiOpen, activeSlide, qaOpen])

  // Lock body scroll when AI overlay is open (but NOT for slide — slide handles its own scroll)
  useEffect(() => {
    document.body.style.overflow = aiOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [aiOpen])

  const openSlide = useCallback((i) => {
    setActiveSlide(i)
  }, [])

  const goBack = useCallback(() => {
    setActiveSlide(null)
  }, [])

  const currentSlideData = activeSlide !== null ? slides[activeSlide] : null
  const SlideComponent = currentSlideData?.Component

  /* ── FULLSCREEN SLIDE VIEW ──────────────────── */
  if (activeSlide !== null) {
    return (
      <div className="mobile-slide-view" style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'var(--bg)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.6rem 0.8rem',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(10px)',
        }}>
          {/* Back button */}
          <button
            onClick={goBack}
            style={{
              background: 'rgba(124,109,250,0.12)',
              border: '1px solid rgba(124,109,250,0.3)',
              borderRadius: '8px',
              color: 'var(--accent-2)',
              padding: '0.35rem 0.65rem',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={16} strokeWidth={2.5} /> Atrás
          </button>
          {/* Slide info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: 'monospace',
            }}>
              SLIDE {String(activeSlide + 1).padStart(2, '0')} / {slides.length}
            </div>
            <div style={{
              fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-h)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {slides[activeSlide].label}
            </div>
          </div>
          {/* Nav arrows */}
          <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
            <button
              onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
              disabled={activeSlide === 0}
              style={drawerNavBtnStyle(activeSlide === 0)}
            >
              ‹
            </button>
            <button
              onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
              disabled={activeSlide === slides.length - 1}
              style={drawerNavBtnStyle(activeSlide === slides.length - 1)}
            >
              ›
            </button>
            {/* AI button */}
            <button
              onClick={() => setAiOpen(true)}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                color: 'var(--accent-2)', cursor: 'pointer', padding: '0.3rem',
                display: 'flex', alignItems: 'center',
              }}
              aria-label="Chat IA"
            >
              <BotMessageSquare size={16} strokeWidth={1.8} />
            </button>
            <button
              onClick={() => setQaOpen(true)}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                color: 'var(--accent-2)', cursor: 'pointer', padding: '0.3rem',
                display: 'flex', alignItems: 'center',
              }}
              aria-label="Abrir Q&A"
            >
              <HelpCircle size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>
        {/* Scrollable slide content */}
        <div className="mobile-slide-scroll" style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}>
          {SlideComponent && (
            <div className="mobile-slide-content">
              <SlideComponent profesorMode={profesorMode} />
            </div>
          )}
        </div>
        <HintonPassageFab
          key={currentSlideData.id}
          slideId={currentSlideData.id}
          bottom="1rem"
          left="0.9rem"
          panelLeft="0.9rem"
          mobile
        />

        {/* AI overlay (same as below) */}
        <AnimatePresence>
          {aiOpen && (
            <>
              <MotionDiv
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setAiOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 300,
                  background: 'rgba(0,0,0,0.5)',
                }}
              />
              <MotionDiv
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                style={{
                  position: 'fixed', bottom: 0, left: 0, right: 0,
                  height: '92svh', zIndex: 310,
                  borderTopLeftRadius: '18px', borderTopRightRadius: '18px',
                  overflow: 'hidden',
                  boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
                }}
              >
                <AIPanel
                  visible={true}
                  onClose={() => setAiOpen(false)}
                  currentSlide={currentSlideData}
                  mobile
                />
              </MotionDiv>
            </>
          )}
        </AnimatePresence>

        <QAModal isOpen={qaOpen} onClose={() => setQaOpen(false)} />
      </div>
    )
  }

  /* ── CARDS VIEW (default) ───────────────────── */
  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', position: 'relative' }}>
      {/* ── Header ─────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 80,
        background: 'rgba(17,17,24,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.9rem 1.2rem',
      }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)' }}>
          Hinton 1992 — Redes Neuronales
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
          Filosofía de las Neurociencias · 15 secciones
        </div>
      </header>

      {/* ── Summary cards ──────────────────────────── */}
      <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.7rem', paddingBottom: '100px' }}>
        {slides.map((slide, i) => {
          const summary = SLIDE_SUMMARIES[i]
          if (!summary) return null
          const SummaryIcon = summary.Icon
          return (
            <div
              key={slide.id}
              ref={el => cardRefs.current[i] = el}
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '1rem 1.1rem',
                position: 'relative',
              }}
            >
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-2)' }}>
                  <SummaryIcon size={24} strokeWidth={1.85} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.25 }}>
                    {summary.title}
                  </div>
                </div>
                {/* Open interactive slide button */}
                <button
                  onClick={() => openSlide(i)}
                  style={{
                    background: 'rgba(124,109,250,0.15)',
                    border: '1px solid rgba(124,109,250,0.3)',
                    borderRadius: '10px',
                    color: 'var(--accent-2)',
                    padding: '0.45rem 0.7rem',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Ver slide <ChevronRight size={13} strokeWidth={2.5} />
                </button>
              </div>

              {/* Hook */}
              {summary.hook && (
                <p style={{
                  fontSize: '0.92rem', color: 'var(--accent-2)', fontStyle: 'italic',
                  margin: '0 0 0.5rem', lineHeight: 1.45,
                }}>
                  "{summary.hook}"
                </p>
              )}

              {/* Bullets */}
              <ul style={{
                margin: 0, paddingLeft: '1.2rem',
                listStyleType: 'disc',
              }}>
                {summary.bullets.map((b, j) => (
                  <li key={j} style={{
                    fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.55,
                    marginBottom: '0.2rem',
                  }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* ── FABs: AI + Q&A ─────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: '1.2rem', right: '1.2rem', zIndex: 90,
        display: 'flex', flexDirection: 'column', gap: '0.7rem'
      }}>
        <button
          onClick={() => setQaOpen(true)}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'rgba(17,17,24,0.94)',
            border: '1px solid rgba(124,109,250,0.28)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            color: 'var(--accent-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Abrir Q&A"
        >
          <HelpCircle size={23} strokeWidth={1.9} />
        </button>

        <button
          onClick={() => setAiOpen(true)}
          style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c6dfa 0%, #06b6d4 100%)',
            border: 'none',
            boxShadow: '0 4px 20px rgba(124,109,250,0.5)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Abrir chat IA"
        >
          <BotMessageSquare size={26} strokeWidth={1.8} />
        </button>
      </div>

      {/* ── AI overlay ─────────────────────────────── */}
      <AnimatePresence>
        {aiOpen && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setAiOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 300,
                background: 'rgba(0,0,0,0.5)',
              }}
            />
            <MotionDiv
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: '92svh', zIndex: 310,
                borderTopLeftRadius: '18px', borderTopRightRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
              }}
            >
              <AIPanel
                visible={true}
                onClose={() => setAiOpen(false)}
                currentSlide={slides[0]}
                mobile
              />
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      <QAModal isOpen={qaOpen} onClose={() => setQaOpen(false)} />
    </div>
  )
}

function drawerNavBtnStyle(disabled) {
  return {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    color: disabled ? 'var(--text-dim)' : 'var(--text)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    padding: '0.3rem 0.6rem',
    fontSize: '1.1rem',
    fontWeight: 700,
    lineHeight: 1,
    display: 'flex', alignItems: 'center',
  }
}
