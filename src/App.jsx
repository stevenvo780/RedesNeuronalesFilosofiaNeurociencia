import { useState, useEffect, useCallback } from 'react'
import AIPanel from './components/AIPanel'
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

const SLIDES = [
  { id: 's01', label: 'Apertura', time: '1 min', Component: S01_Apertura },
  { id: 's02', label: 'Neurona real', time: '1.5 min', Component: S02_NeuronasReal },
  { id: 's03', label: 'Neurona artificial', time: '1.5 min', Component: S03_NeuronasArtificial },
  { id: 's04', label: 'Arquitectura', time: '2 min', Component: S04_Arquitectura },
  { id: 's05', label: 'Entrenamiento', time: '2 min', Component: S05_Entrenamiento },
  { id: 's06', label: 'Retropropagación', time: '2 min', Component: S06_Retropropagacion },
  { id: 's07', label: 'Alcances + Crítica', time: '1.5 min', Component: S07_AlcancesYCritica },
  { id: 's08', label: 'Límites', time: '1 min', Component: S08_Limites },
  { id: 's09', label: 'No supervisado', time: '3 min', Component: S09_NoSupervisado },
  { id: 's10', label: 'Repr. distribuidas', time: '1 min', Component: S10_ReprDistribuidas },
  { id: 's11', label: 'Códigos demográficos', time: '1.5 min', Component: S11_CodigosDemograficos },
  { id: 's12', label: 'De 1992 a hoy', time: '2 min', Component: S12_De1992AHoy },
]

export default function App() {
  const [current, setCurrent] = useState(0)
  const [profesorMode, setProfesorMode] = useState(false)
  const [aiVisible, setAiVisible] = useState(false)
  const [navVisible, setNavVisible] = useState(true)

  const goTo = useCallback((idx) => {
    if (idx >= 0 && idx < SLIDES.length) setCurrent(idx)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault()
          goTo(current + 1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          goTo(current - 1)
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
  }, [current, goTo])

  const { Component } = SLIDES[current]

  return (
    <div style={{ display: 'flex', height: '100svh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar nav */}
      {navVisible && (
        <nav style={{
          width: '200px',
          flexShrink: 0,
          background: 'var(--bg-2)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.3 }}>
              Hinton 1992
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Redes Neuronales
            </div>
          </div>

          {/* Slide list */}
          <div className="scroll-y" style={{ flex: 1 }}>
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.45rem 0.875rem',
                  background: current === i ? 'rgba(124,109,250,0.15)' : 'none',
                  border: 'none',
                  borderLeft: `3px solid ${current === i ? 'var(--accent)' : 'transparent'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  color: current === i ? 'var(--accent-2)' : 'var(--text-dim)',
                  width: '18px',
                  flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  color: current === i ? 'var(--text-h)' : 'var(--text-dim)',
                  lineHeight: 1.3,
                  flex: 1,
                }}>
                  {s.label}
                </span>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', flexShrink: 0 }}>
                  {s.time}
                </span>
              </button>
            ))}
          </div>

          {/* Footer controls */}
          <div style={{ padding: '0.6rem 0.875rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              onClick={() => setProfesorMode(m => !m)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                border: `1px solid ${profesorMode ? 'var(--accent)' : 'var(--border)'}`,
                background: profesorMode ? 'rgba(124,109,250,0.2)' : 'none',
                color: profesorMode ? 'var(--accent-2)' : 'var(--text-dim)',
                fontSize: '0.68rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {profesorMode ? '◉ Modo profesor' : '○ Modo público'} <span style={{ opacity: 0.5 }}>(P)</span>
            </button>
            <button
              onClick={() => setAiVisible(v => !v)}
              style={{
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                border: `1px solid ${aiVisible ? 'var(--cyan)' : 'var(--border)'}`,
                background: aiVisible ? 'rgba(6,182,212,0.1)' : 'none',
                color: aiVisible ? 'var(--cyan)' : 'var(--text-dim)',
                fontSize: '0.68rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {aiVisible ? '◉ IA activa' : '○ Panel IA'} <span style={{ opacity: 0.5 }}>(A)</span>
            </button>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        marginRight: aiVisible ? '340px' : 0,
        transition: 'margin-right 0.3s ease',
      }}>
        {/* Slide */}
        <div
          key={current}
          className="fade-in"
          style={{ width: '100%', height: '100%', overflow: 'hidden auto' }}
        >
          <Component profesorMode={profesorMode} />
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
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            style={arrowBtnStyle(current === 0)}
          >
            ← anterior
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
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginLeft: '0.4rem', fontFamily: 'monospace' }}>
              {current + 1}/{SLIDES.length}
            </span>
          </div>

          {/* Next */}
          <button
            onClick={() => goTo(current + 1)}
            disabled={current === SLIDES.length - 1}
            style={arrowBtnStyle(current === SLIDES.length - 1)}
          >
            siguiente →
          </button>
        </div>

        {/* Keyboard hints — toggle with N */}
        {!navVisible && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            left: '0.5rem',
            fontSize: '0.65rem',
            color: 'var(--text-dim)',
            fontFamily: 'monospace',
            background: 'rgba(10,10,15,0.8)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}>
            N=nav · P=profesor · A=IA · ←→=slide
          </div>
        )}
      </main>

      {/* AI Panel */}
      <AIPanel visible={aiVisible} onClose={() => setAiVisible(false)} />
    </div>
  )
}

function arrowBtnStyle(disabled) {
  return {
    background: 'none',
    border: 'none',
    color: disabled ? 'var(--border)' : 'var(--text-dim)',
    fontSize: '0.72rem',
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'monospace',
    padding: '0.25rem 0.5rem',
  }
}
