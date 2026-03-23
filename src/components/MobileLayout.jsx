import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BotMessageSquare, X, ChevronRight, Maximize2, Minimize2 } from 'lucide-react'
import { SLIDE_SUMMARIES } from '../data/slideSummaries'
import AIPanel from './AIPanel'

/**
 * MobileLayout — full mobile experience.
 * - Scrollable summary cards (one per slide).
 * - Floating button opens the interactive slide in a bottom-sheet drawer.
 * - Another floating button gives direct IA access.
 */
export default function MobileLayout({ slides, profesorMode }) {
  const [activeSlide, setActiveSlide] = useState(null)   // index or null
  const [aiOpen, setAiOpen] = useState(false)
  const [drawerFull, setDrawerFull] = useState(false)
  const cardRefs = useRef([])

  // Close drawer on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (aiOpen) setAiOpen(false)
        else if (activeSlide !== null) { setActiveSlide(null); setDrawerFull(false) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiOpen, activeSlide])

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = (activeSlide !== null || aiOpen) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeSlide, aiOpen])

  const openSlide = useCallback((i) => {
    setActiveSlide(i)
    setDrawerFull(false)
  }, [])

  const currentSlideData = activeSlide !== null ? slides[activeSlide] : null
  const SlideComponent = currentSlideData?.Component

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
                <span style={{ fontSize: '1.5rem' }}>{summary.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace',
                  }}>
                    {String(i + 1).padStart(2, '0')} · {slide.time}
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

      {/* ── FAB: AI ────────────────────────────────── */}
      {activeSlide === null && (
        <button
          onClick={() => setAiOpen(true)}
          style={{
            position: 'fixed', bottom: '1.2rem', right: '1.2rem',
            zIndex: 90,
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
      )}

      {/* ── Drawer: Interactive slide ──────────────── */}
      <AnimatePresence>
        {activeSlide !== null && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => { setActiveSlide(null); setDrawerFull(false) }}
              style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.6)',
              }}
            />
            {/* Drawer panel */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                height: drawerFull ? '100svh' : '82svh',
                zIndex: 110,
                background: 'var(--bg)',
                borderTopLeftRadius: drawerFull ? 0 : '18px',
                borderTopRightRadius: drawerFull ? 0 : '18px',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.7rem 1rem',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
                background: 'rgba(17,17,24,0.85)', backdropFilter: 'blur(8px)',
              }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                    SLIDE {String(activeSlide + 1).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-h)' }}>
                    {slides[activeSlide].label}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Nav: prev */}
                  <button
                    onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                    disabled={activeSlide === 0}
                    style={drawerNavBtnStyle(activeSlide === 0)}
                  >
                    ‹
                  </button>
                  {/* Nav: next */}
                  <button
                    onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                    disabled={activeSlide === slides.length - 1}
                    style={drawerNavBtnStyle(activeSlide === slides.length - 1)}
                  >
                    ›
                  </button>
                  {/* Fullscreen toggle */}
                  <button
                    onClick={() => setDrawerFull(f => !f)}
                    style={{
                      background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                      color: 'var(--text-dim)', cursor: 'pointer', padding: '0.3rem',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    {drawerFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  {/* AI inside drawer */}
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
                  {/* Close */}
                  <button
                    onClick={() => { setActiveSlide(null); setDrawerFull(false) }}
                    style={{
                      background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                      color: 'var(--text-dim)', cursor: 'pointer', padding: '0.3rem',
                      display: 'flex', alignItems: 'center',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              {/* Slide content */}
              <div style={{
                flex: 1, overflow: 'auto', position: 'relative',
                WebkitOverflowScrolling: 'touch',
              }}>
                {SlideComponent && (
                  <SlideComponent profesorMode={profesorMode} />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── AI Fullscreen overlay (mobile) ─────────── */}
      <AnimatePresence>
        {aiOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setAiOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 300,
                background: 'rgba(0,0,0,0.5)',
              }}
            />
            <motion.div
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
                currentSlide={currentSlideData || slides[0]}
                mobile
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
