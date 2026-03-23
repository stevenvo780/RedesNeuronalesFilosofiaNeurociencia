import STTensionPanel from "../components/st/STTensionPanel"
import STTooltip from "../components/st/STTooltip"
import { useEffect, useRef, useState } from 'react'
import STDeriveCard from '../components/st/STDeriveCard'
import { ST_ONTOLOGIA } from '../data/st_results'

const N_UNITS = 20
const CONCEPT_CENTER = 10  // índice de la unidad más activa

function gaussian(i, center, sigma = 3) {
  return Math.exp(-((i - center) ** 2) / (2 * sigma ** 2))
}

export default function S11_CodigosDemograficos({ profesorMode }) {
  const [center, setCenter] = useState(CONCEPT_CENTER)
  const [anesthetized, setAnesthetized] = useState(new Set())
  const canvasRef = useRef(null)
  const eyeCanvasRef = useRef(null)

  const activations = Array.from({ length: N_UNITS }, (_, i) =>
    anesthetized.has(i) ? 0 : gaussian(i, center)
  )

  const activeUnits = activations.filter((_, i) => !anesthetized.has(i))
  const weightedSum = activeUnits.reduce((s, a, i) => s + a * i, 0)
  const totalWeight = activeUnits.reduce((s, a) => s + a, 0)
  const populationCenter = totalWeight > 0
    ? activeUnits.reduce((s, a, i) => {
        const realIdx = activations.findIndex((_, origI) => !anesthetized.has(origI) && activations
          .filter((_, k) => !anesthetized.has(k))
          .indexOf(activations[origI]) === i)
        return s + a * realIdx
      }, 0) / totalWeight
    : center

  // Bump canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    const barW = W / N_UNITS
    activations.forEach((act, i) => {
      const x = i * barW
      const barH = act * (H - 30)
      const isAnesth = anesthetized.has(i)
      ctx.fillStyle = isAnesth
        ? 'rgba(239,68,68,0.3)'
        : `rgba(124,109,250,${0.2 + act * 0.8})`
      ctx.fillRect(x + 1, H - 30 - barH, barW - 2, barH)
      ctx.strokeStyle = isAnesth ? '#ef4444' : 'rgba(167,139,250,0.6)'
      ctx.lineWidth = 1
      ctx.strokeRect(x + 1, H - 30 - barH, barW - 2, barH)
    })

    // Population center marker
    const cX = (populationCenter / N_UNITS) * W
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(cX, 0)
    ctx.lineTo(cX, H - 30)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#22c55e'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('⟨pop⟩', cX, H - 15)

    // Axis label
    ctx.fillStyle = '#6b6b88'
    ctx.font = '9px monospace'
    ctx.textAlign = 'left'
    ctx.fillText('unidades →', 4, H - 2)

  }, [activations, anesthetized, center, populationCenter])

  // Eye canvas
  useEffect(() => {
    const canvas = eyeCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight
    ctx.clearRect(0, 0, W, H)

    // Sclera
    ctx.beginPath()
    ctx.ellipse(W / 2, H / 2, W * 0.45, H * 0.3, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#f0f0ff'
    ctx.fill()

    // Iris — positioned by population center
    const eyeX = W * 0.15 + (populationCenter / N_UNITS) * W * 0.7
    ctx.beginPath()
    ctx.arc(eyeX, H / 2, H * 0.22, 0, Math.PI * 2)
    ctx.fillStyle = '#2563eb'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(eyeX, H / 2, H * 0.12, 0, Math.PI * 2)
    ctx.fillStyle = '#0f172a'
    ctx.fill()

    ctx.fillStyle = '#6b6b88'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('posición ocular = promedio de la población', W / 2, H - 4)
  }, [populationCenter])

  function toggleAnesthetize(i) {
    setAnesthetized(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="section-slide" style={{ gap: '1.8rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Evidencia Biológica: Códigos Demográficos</div>
        <div className="section-subtitle">¿Cómo procesa la corteza las representaciones continuas del espacio?</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px', fontSize: '1.1rem' }}>
        "El experimento de Sparks con monos anestesiados destruyó el modelo del <STTooltip term="idealizacion">localismo</STTooltip>. Al anular neuronas específicas que controlan el movimiento ocular (colículo superior), el ojo no se paralizó ni erró catastróficamente; promedió las fuerzas restantes. Esto confirma un cálculo poblacional de <STTooltip term="pesos">vectores demográficos</STTooltip>."
      </div>

      {/* Interactive bump */}
      <div style={{ width: '100%', maxWidth: '1000px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
          <span>mueve el centro del bump</span>
          <span style={{ fontFamily: 'monospace' }}>centro = unidad {center}</span>
        </div>
        <input
          type="range"
          min="2"
          max={N_UNITS - 3}
          value={center}
          onChange={e => setCenter(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: '0.5rem' }}
        />
        <div style={{
          height: '200px',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Anesthesia buttons */}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
          clic para "anestesiar" neuronas (rojo) — el ojo se desplaza al nuevo promedio
        </div>
        <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
          {Array.from({ length: N_UNITS }, (_, i) => (
            <button
              key={i}
              onClick={() => toggleAnesthetize(i)}
              title={`Unidad ${i}`}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: anesthetized.has(i) ? 'rgba(239,68,68,0.5)' : 'var(--bg-3)',
                color: anesthetized.has(i) ? '#ef4444' : 'var(--text-dim)',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {i}
            </button>
          ))}
        </div>
        {anesthetized.size > 0 && (
          <button
            onClick={() => setAnesthetized(new Set())}
            style={{
              marginTop: '0.4rem',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-dim)',
              fontSize: '0.72rem',
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            restablecer ({anesthetized.size} anestesiadas)
          </button>
        )}
      </div>

      {/* Eye position */}
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
          posición ocular resultante
        </div>
        <div style={{
          height: '150px',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <canvas ref={eyeCanvasRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* ST Derivations */}
      {profesorMode && (
        <div style={{ width: '100%', maxWidth: '1000px' }}>
          <STDeriveCard derive={ST_ONTOLOGIA.derives[2]} />
          <STDeriveCard derive={ST_ONTOLOGIA.derives[3]} />
        </div>
      )}

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1000px', width: '100%', fontSize: '1rem', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Punto filosófico:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            Un concepto no existe en un lugar del cerebro. Existe distribuido.
            La localización cerebral modular estricta queda cuestionada.
            Young y Yamane (RIKEN) confirmaron códigos demográficos para rostros en corteza temporal de monos.
          </span>
        </div>
      )}
    </div>
  )
}
