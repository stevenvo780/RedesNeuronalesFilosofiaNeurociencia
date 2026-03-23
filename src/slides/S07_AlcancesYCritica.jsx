import { useRef, useEffect, useState } from 'react'
import STTensionPanel from '../components/st/STTensionPanel'

const DIGITS_EXAMPLES = [
  { label: '3', pattern: [0,1,1,0, 0,0,1,0, 0,1,1,0, 0,0,1,0, 0,1,1,0] },
  { label: '7', pattern: [1,1,1,0, 0,0,1,0, 0,1,0,0, 1,0,0,0, 1,0,0,0] },
  { label: '0', pattern: [0,1,1,0, 1,0,0,1, 1,0,0,1, 1,0,0,1, 0,1,1,0] },
]

const APPS = [
  { label: 'Reconocimiento de dígitos', icon: '🔢', desc: 'MNIST — clasificación de dígitos escritos a mano' },
  { label: 'Tasas cambiarias', icon: '📈', desc: 'Predicción de mercados financieros' },
  { label: 'Células precancerosas', icon: '🔬', desc: 'Detección en frotis de Papanicolau' },
  { label: 'Espejos de telescopio', icon: '🔭', desc: 'Optimización de formas ópticas' },
]

export default function S07_AlcancesYCritica({ profesorMode }) {
  const canvasRef = useRef(null)
  const [selectedDigit, setSelectedDigit] = useState(0)
  const [drawing, setDrawing] = useState(Array(20).fill(0))
  const [isDrawing, setIsDrawing] = useState(false)

  const digit = DIGITS_EXAMPLES[selectedDigit]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 4
    const pattern = digit.pattern
    canvas.width = size * 4
    canvas.height = size * 5
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 4; j++) {
        const val = pattern[i * 4 + j]
        ctx.fillStyle = val ? '#7c6dfa' : '#1a1a24'
        ctx.fillRect(j * size, i * size, size - 1, size - 1)
      }
    }
  }, [selectedDigit, digit])

  return (
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Alcances + Primera crítica</div>
        <div className="section-subtitle">Funciona. Pero ¿explica?</div>
      </div>

      <div className="quote" style={{ maxWidth: '600px' }}>
        "Funciona. Reconoce dígitos, predice tasas cambiarias, detecta células precancerosas.
        Pero ¿está <em>explicando</em> cómo aprende el cerebro, o simplemente funciona?"
      </div>

      {/* Apps grid */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '640px', width: '100%' }}>
        {APPS.map(a => (
          <div key={a.label} style={{
            flex: '1 1 140px',
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{a.icon}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-h)', fontWeight: 600 }}>{a.label}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {/* Demo dígito */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.4rem', fontFamily: 'monospace' }}>
            patrón de entrada
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
            {DIGITS_EXAMPLES.map((d, i) => (
              <button
                key={d.label}
                onClick={() => setSelectedDigit(i)}
                style={{
                  width: '32px', height: '32px',
                  borderRadius: '4px',
                  border: `1px solid ${selectedDigit === i ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedDigit === i ? 'rgba(124,109,250,0.2)' : 'var(--bg-3)',
                  color: selectedDigit === i ? 'var(--accent-2)' : 'var(--text-dim)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <canvas
            ref={canvasRef}
            style={{
              imageRendering: 'pixelated',
              width: '80px',
              height: '100px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              display: 'block',
            }}
          />
        </div>

        <div style={{ fontSize: '2rem', color: 'var(--text-dim)' }}>→</div>

        <div style={{
          background: 'rgba(124,109,250,0.15)',
          border: '2px solid var(--accent)',
          borderRadius: '8px',
          padding: '0.75rem 1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
            clasificación
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-2)' }}>
            {digit.label}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontFamily: 'monospace' }}>
            confianza: 94.2%
          </div>
        </div>
      </div>

      {/* ST Tension Panel */}
      <div style={{ width: '100%', maxWidth: '760px' }}>
        <STTensionPanel />
      </div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '760px', width: '100%', fontSize: '0.78rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--yellow)' }}>Punto de quiebre:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            La pregunta por el sustrato. ¿Importa si es silicio o carbono?
            La tensión entre <code style={{ color: 'var(--green)' }}>BRAIN_COMP</code> y{' '}
            <code style={{ color: 'var(--red)' }}>◇(¬BRAIN_COMP)</code> no es decorativa:
            son formalmente incompatibles si ambas son verdaderas. Pero ninguna es necesariamente cierta.
          </span>
        </div>
      )}
    </div>
  )
}
