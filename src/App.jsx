import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Radio, BotMessageSquare, HelpCircle, Menu, X } from 'lucide-react'
import AIPanel from './components/AIPanel'
import MobileLayout from './components/MobileLayout'
import S00_Intro from './slides/S00_Intro'
import S01_Apertura from './slides/S01_Apertura'
import S02_NeuronasReal from './slides/S02_NeuronasReal'
import S03_NeuronasArtificial from './slides/S03_NeuronasArtificial'
import S04_Arquitectura from './slides/S04_Arquitectura'
import S05_Entrenamiento from './slides/S05_Entrenamiento'
import S06_Retropropagacion from './slides/S06_Retropropagacion'
import S07_AlcancesYCritica from './slides/S07_AlcancesYCritica'
import S08_Limites from './slides/S08_Limites'
import S09_NoSupervisado from './slides/S09_NoSupervisado'
import S10_ReprDistribuidas from './slides/S10_ReprDistribuidas'
import S11_CodigosDemograficos from './slides/S11_CodigosDemograficos'
import S12_De1992AHoy from './slides/S12_De1992AHoy'
import S12b_Convergencia from './slides/S12b_Convergencia'
import S13_CierreArgumental from './slides/S13_CierreArgumental'
import QAModal from './components/QAModal'
import HintonPassageFab from './components/HintonPassageFab'

const MotionDiv = motion.div

const SLIDES = [
  { id: 's00', label: 'Intro', Component: S00_Intro },
  { id: 's01', label: 'Apertura', Component: S01_Apertura },
  { id: 's02', label: 'Neurona real', Component: S02_NeuronasReal },
  { id: 's03', label: 'Neurona artificial', Component: S03_NeuronasArtificial },
  { id: 's04', label: 'Arquitectura', Component: S04_Arquitectura },
  { id: 's05', label: 'Entrenamiento', Component: S05_Entrenamiento },
  { id: 's06', label: 'Retropropagación', Component: S06_Retropropagacion },
  { id: 's07', label: 'Alcances + Crítica', Component: S07_AlcancesYCritica },
  { id: 's08', label: 'Límites', Component: S08_Limites },
  { id: 's09', label: 'No supervisado', Component: S09_NoSupervisado },
  { id: 's10', label: 'Repr. distribuidas', Component: S10_ReprDistribuidas },
  { id: 's11', label: 'Códigos demográficos', Component: S11_CodigosDemograficos },
  { id: 's12', label: 'De 1992 a hoy', Component: S12_De1992AHoy },
  { id: 's12b', label: 'Convergencia empírica', Component: S12b_Convergencia },
  { id: 's13', label: 'Cierre argumental', Component: S13_CierreArgumental },
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [profesorMode, setProfesorMode] = useState(false)
  const [aiVisible, setAiVisible] = useState(false)
  const [qaOpen, setQaOpen] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  // Ref for slide sub-step navigation (advanceStep / retreatStep)
  const slideRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    slideRef.current = null
  }, [current])

  // Responsive breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const goTo = useCallback((idx) => {
    if (idx >= 0 && idx < SLIDES.length) setCurrent(idx)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'Escape' && qaOpen) {
        setQaOpen(false)
        return
      }
      if (e.key === 'Escape' && navVisible) {
        setNavVisible(false)
        return
      }
      if (e.key === 'Escape' && aiVisible) {
        setAiVisible(false)
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          if (slideRef.current?.advanceStep?.()) break
          goTo(current + 1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          if (slideRef.current?.retreatStep?.()) break
          goTo(current - 1)
          break
        case 'F5':
          e.preventDefault()
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.()
          } else {
            document.exitFullscreen?.()
          }
          break
        case 'p':
        case 'P':
          setProfesorMode(m => !m)
          break
        case 'a':
        case 'A':
          setAiVisible(v => !v)
          break
        case 'n':
        case 'N':
          setNavVisible(v => !v)
          break
        case 'q':
        case 'Q':
          setQaOpen(v => !v)
          break
        case 'Home':
          goTo(0)
          break
        case 'End':
          goTo(SLIDES.length - 1)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aiVisible, current, goTo, navVisible, qaOpen])

  // ── Media Session API: watch / headphones / lock-screen controls ──
  // Start silent audio on first user interaction (auto-play policy)
  useEffect(() => {
    const ensureAudio = () => {
      const audio = audioRef.current
      if (!audio || !audio.paused) return
      audio.volume = 0.01          // near-silent but nonzero so OS counts it
      audio.play().catch(() => {})
    }
    // Try immediately and also on first interaction
    ensureAudio()
    window.addEventListener('click', ensureAudio, { once: true })
    window.addEventListener('keydown', ensureAudio, { once: true })
    window.addEventListener('touchstart', ensureAudio, { once: true })
    return () => {
      window.removeEventListener('click', ensureAudio)
      window.removeEventListener('keydown', ensureAudio)
      window.removeEventListener('touchstart', ensureAudio)
    }
  }, [])

  // Register / update media session handlers & metadata per slide
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    const ms = navigator.mediaSession

    const advance = () => {
      if (slideRef.current?.advanceStep?.()) return
      goTo(current + 1)
    }
    const retreat = () => {
      if (slideRef.current?.retreatStep?.()) return
      goTo(current - 1)
    }

    // Required handlers — Chrome won't show controls without play/pause
    ms.setActionHandler('play',          () => { audioRef.current?.play() })
    ms.setActionHandler('pause',         () => { /* keep playing silently */ })
    ms.setActionHandler('nexttrack',     advance)
    ms.setActionHandler('previoustrack', retreat)
    // Prevent seeking from resetting the loop
    ms.setActionHandler('seekto',        () => {})
    ms.setActionHandler('seekforward',   advance)
    ms.setActionHandler('seekbackward',  retreat)

    ms.metadata = new MediaMetadata({
      title:  `${String(current + 1).padStart(2, '0')} — ${SLIDES[current].label}`,
      artist: 'Hinton 1992 · Redes Neuronales',
      album:  'Filosofía de las Neurociencias',
    })
    ms.playbackState = 'playing'

    // Update position state so OS thinks there's a long track playing
    if (ms.setPositionState) {
      ms.setPositionState({
        duration:  SLIDES.length * 120,             // fake: ~30 min track
        playbackRate: 1,
        position: current * 120,                    // each slide = ~2 min marker
      })
    }

    return () => {
      ;['play','pause','nexttrack','previoustrack','seekto','seekforward','seekbackward']
        .forEach(a => ms.setActionHandler(a, null))
    }
  }, [current, goTo])

  const { Component } = SLIDES[current]

  // Mobile layout — completely separate view
  if (isMobile) {
    return <MobileLayout slides={SLIDES} profesorMode={profesorMode} />
  }

  return (
    <div style={{ position: 'relative', height: '100svh', overflow: 'hidden', background: 'var(--bg)' }}>
      <button
        onClick={() => setNavVisible(v => !v)}
        aria-label={navVisible ? 'Cerrar índice de slides' : 'Abrir índice de slides'}
        title={navVisible ? 'Cerrar índice (N / Esc)' : 'Abrir índice (N)'}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 130,
          border: `1px solid ${navVisible ? 'rgba(167,139,250,0.42)' : 'rgba(124,109,250,0.28)'}`,
          background: navVisible ? 'rgba(124,109,250,0.22)' : 'rgba(10,10,15,0.76)',
          color: navVisible ? 'var(--text-h)' : 'var(--accent-2)',
          backdropFilter: 'blur(16px)',
          boxShadow: navVisible ? '0 10px 30px rgba(124,109,250,0.22)' : '0 10px 24px rgba(0,0,0,0.28)',
          borderRadius: '999px',
          padding: '0.55rem 0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 700,
          letterSpacing: '0.01em',
          transition: 'all 0.2s ease',
        }}
      >
        {navVisible ? <X size={16} strokeWidth={2.1} /> : <Menu size={16} strokeWidth={2.1} />}
        {navVisible ? 'Cerrar índice' : 'Índice'}
      </button>

      {/* Main content */}
      <main style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        marginRight: aiVisible ? '340px' : 0,
        transition: 'margin-right 0.3s ease',
      }}>
        {/* Slide with Framer Motion */}
        <div style={{ width: '100%', height: 'calc(100% - 36px)', overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <MotionDiv
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              style={{ width: '100%', minHeight: '100%', position: 'absolute', inset: 0 }}
            >
              <Component ref={slideRef} profesorMode={profesorMode} />
            </MotionDiv>
          </AnimatePresence>
          <HintonPassageFab
            key={SLIDES[current].id}
            slideId={SLIDES[current].id}
            bottom="1rem"
            left="1rem"
            panelLeft="1rem"
            withinSlide
          />
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '36px',
          background: 'var(--bg-2)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 10,
        }}>
          {/* Prev */}
          <button
            onClick={() => {
              if (slideRef.current?.retreatStep?.()) return
              goTo(current - 1)
            }}
            disabled={current === 0}
            style={arrowBtnStyle(current === 0)}
          >
            <ChevronLeft size={16} strokeWidth={2} style={{ marginRight: '0.25rem' }} /> anterior
          </button>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{
                  width: i === current ? '20px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: i === current ? 'var(--accent)' : i < current ? 'var(--accent-2)' : 'var(--border)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.2s',
                }}
              />
            ))}
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', margin: '0 0.4rem', fontFamily: 'monospace' }}>
              {current + 1}/{SLIDES.length}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontStyle: 'italic', opacity: 0.75 }}>
              — Steven Vallejo
            </span>
          </div>

          {/* Next */}
          <button
            onClick={() => {
              if (slideRef.current?.advanceStep?.()) return
              goTo(current + 1)
            }}
            disabled={current === SLIDES.length - 1}
            style={arrowBtnStyle(current === SLIDES.length - 1)}
          >
            siguiente <ChevronRight size={16} strokeWidth={2} style={{ marginLeft: '0.25rem' }} />
          </button>
        </div>

        {/* Keyboard hints — toggle with N */}
        {!navVisible && (
          <div style={{
            position: 'absolute',
            top: '4.35rem',
            left: '1rem',
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            fontFamily: 'monospace',
            background: 'rgba(10,10,15,0.8)',
            padding: '0.3rem 0.45rem',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            N / ☰ = índice · P = profesor · A = IA · Q = Q&A
          </div>
        )}
      </main>

      <AnimatePresence>
        {navVisible && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setNavVisible(false)}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 110,
                background: 'linear-gradient(90deg, rgba(6,6,10,0.46) 0%, rgba(6,6,10,0.1) 36%, rgba(6,6,10,0) 62%)',
                backdropFilter: 'blur(4px)',
              }}
            />

            <MotionDiv
              initial={{ x: '-110%', opacity: 0.7 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-110%', opacity: 0.7 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                bottom: '1rem',
                width: 'clamp(260px, 22vw, 320px)',
                maxWidth: 'calc(100vw - 2rem)',
                background: 'rgba(17, 17, 24, 0.78)',
                backdropFilter: 'blur(18px)',
                border: '1px solid rgba(124,109,250,0.2)',
                borderRadius: '20px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 120,
                boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
              }}
            >
              {/* Header */}
              <div style={{ padding: '1.15rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.3 }}>
                      Hinton 1992
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)' }}>
                      Índice flotante · no empuja las slides
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent-2)',
                    border: '1px solid rgba(124,109,250,0.22)',
                    background: 'rgba(124,109,250,0.12)',
                    borderRadius: '999px',
                    padding: '0.2rem 0.5rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}>
                    N / Esc
                  </div>
                </div>
              </div>

              {/* Slide list */}
              <div className="scroll-y" style={{ flex: 1, padding: '0.35rem 0' }}>
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      goTo(i)
                      setNavVisible(false)
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      padding: '0.78rem 1.25rem',
                      background: current === i ? 'rgba(124,109,250,0.12)' : 'transparent',
                      border: 'none',
                      borderLeft: `4px solid ${current === i ? 'var(--accent)' : 'transparent'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      color: current === i ? 'var(--accent-2)' : 'var(--text-dim)',
                      width: '24px',
                      flexShrink: 0,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontSize: '0.98rem',
                      color: current === i ? 'var(--text-h)' : 'var(--text-dim)',
                      lineHeight: 1.3,
                      flex: 1,
                      fontWeight: current === i ? 600 : 400,
                    }}>
                      {s.label}
                    </span>
                    {s.time && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', flexShrink: 0 }}>
                        {s.time}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Footer controls */}
              <div style={{ padding: '1rem 1.25rem 1.15rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  onClick={() => setProfesorMode(m => !m)}
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: `1px solid ${profesorMode ? 'var(--accent)' : 'var(--border)'}`,
                    background: profesorMode ? 'rgba(124,109,250,0.2)' : 'none',
                    color: profesorMode ? 'var(--accent-2)' : 'var(--text-dim)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                  }}
                >
                  <Radio size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {profesorMode ? 'Modo profesor' : 'Modo público'} <span style={{ opacity: 0.5, fontWeight: 400 }}>(P)</span>
                </button>
                <button
                  onClick={() => setAiVisible(v => !v)}
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: `1px solid ${aiVisible ? 'var(--cyan)' : 'var(--border)'}`,
                    background: aiVisible ? 'rgba(6,182,212,0.1)' : 'none',
                    color: aiVisible ? 'var(--cyan)' : 'var(--text-dim)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                  }}
                >
                  <BotMessageSquare size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  {aiVisible ? 'IA activa' : 'Panel IA'} <span style={{ opacity: 0.5, fontWeight: 400 }}>(A)</span>
                </button>
                <button
                  onClick={() => setQaOpen(true)}
                  style={{
                    padding: '0.65rem 0.8rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'none',
                    color: 'var(--text-dim)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.45rem',
                  }}
                >
                  <HelpCircle size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                  Q&A <span style={{ opacity: 0.5, fontWeight: 400 }}>(Q)</span>
                </button>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* AI Panel */}
      <AIPanel visible={aiVisible} onClose={() => setAiVisible(false)} currentSlide={SLIDES[current]} />
      <QAModal isOpen={qaOpen} onClose={() => setQaOpen(false)} />

      {/* Silent audio for Media Session API (watch / headphones / media controls) */}
      <audio ref={audioRef} src="/silence.wav" loop preload="auto" style={{ display: 'none' }} />
    </div>
  )
}

function arrowBtnStyle(disabled) {
  return {
    padding: '0.3rem 0.9rem',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'none',
    color: disabled ? 'var(--text-dim)' : 'var(--text)',
    fontSize: '0.8rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    transition: 'all 0.15s',
  }
}
