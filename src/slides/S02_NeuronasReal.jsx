import { useEffect, useRef, useState } from 'react'
import STTooltip from '../components/st/STTooltip'

const PARTS = [
  { id: 'dendrita', label: 'Dendrita', x: 80, y: 180, desc: 'Recibe señales de otras neuronas' },
  { id: 'soma', label: 'Soma', x: 200, y: 180, desc: 'Integra las entradas — suma ponderada biológica' },
  { id: 'axon', label: 'Axón', x: 330, y: 180, desc: 'Conduce el potencial de acción' },
  { id: 'sinapsis', label: 'Sinapsis', x: 450, y: 180, desc: 'Transmite la señal a la siguiente neurona' },
]

export default function S02_NeuronasReal({ profesorMode }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const [hovered, setHovered] = useState(null)
  const [pulse, setPulse] = useState(0)

  // Potencial de acción animado
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = canvas.offsetWidth
    const H = canvas.height = canvas.offsetHeight

    ctx.clearRect(0, 0, W, H)

    // Dendrites (left side tree)
    ctx.strokeStyle = '#6b6b88'
    ctx.lineWidth = 2
    const dendrites = [
      [[60, 80], [140, 160]],
      [[60, 140], [140, 170]],
      [[60, 200], [140, 180]],
      [[60, 260], [140, 190]],
      [[60, 320], [140, 200]],
    ]
    dendrites.forEach(([[x1, y1], [x2, y2]]) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    })

    // Soma
    const somaX = 200, somaY = H / 2
    const grad = ctx.createRadialGradient(somaX, somaY, 5, somaX, somaY, 45)
    grad.addColorStop(0, 'rgba(124,109,250,0.4)')
    grad.addColorStop(1, 'rgba(124,109,250,0.05)')
    ctx.beginPath()
    ctx.arc(somaX, somaY, 40, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = '#7c6dfa'
    ctx.lineWidth = 2
    ctx.stroke()

    // Soma label
    ctx.fillStyle = '#a78bfa'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('soma', somaX, somaY + 4)

    // Axon — with moving pulse
    const axonStart = somaX + 40
    const axonEnd = W - 80
    ctx.strokeStyle = '#06b6d4'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(axonStart, H / 2)
    ctx.lineTo(axonEnd, H / 2)
    ctx.stroke()

    // Pulse ball moving along axon
    const pulseX = axonStart + ((axonEnd - axonStart) * (pulse / 100))
    const pulseGrad = ctx.createRadialGradient(pulseX, H / 2, 0, pulseX, H / 2, 12)
    pulseGrad.addColorStop(0, 'rgba(6,182,212,0.9)')
    pulseGrad.addColorStop(1, 'rgba(6,182,212,0)')
    ctx.beginPath()
    ctx.arc(pulseX, H / 2, 10, 0, Math.PI * 2)
    ctx.fillStyle = pulseGrad
    ctx.fill()

    // Synapse at end
    ctx.beginPath()
    ctx.arc(axonEnd, H / 2, 16, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(234,179,8,0.3)'
    ctx.fill()
    ctx.strokeStyle = '#eab308'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#eab308'
    ctx.font = '10px monospace'
    ctx.fillText('syn', axonEnd, H / 2 + 4)

    // Dendrite input labels
    ctx.fillStyle = '#6b6b88'
    ctx.font = '10px monospace'
    ctx.textAlign = 'right'
    dendrites.forEach(([[x1, y1]]) => {
      ctx.fillText(`x${Math.floor(Math.random() * 9 + 1)}`, x1 - 5, y1 + 4)
    })

  }, [pulse])

  return (
    <div className="section-slide" style={{ gap: '1.5rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">La neurona real</div>
        <div className="section-subtitle">¿Dónde vive la información?</div>
      </div>

      <div className="quote" style={{ maxWidth: '600px' }}>
        "Antes de hablar de neuronas artificiales, tenemos que entender qué estamos imitando —
        y cuánto se pierde en la imitación."
      </div>

      {/* Canvas */}
      <div style={{
        width: '100%',
        maxWidth: '580px',
        height: '200px',
        background: 'var(--bg-3)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '10px',
          fontSize: '0.68rem',
          color: 'var(--text-dim)',
          fontFamily: 'monospace',
        }}>
          potencial de acción →
        </div>
      </div>

      {/* Conceptos con tooltips */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['dendrita', 'axón', 'sinapsis', 'aprendizaje'].map(term => (
          <div key={term} style={{
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0.4rem 0.8rem',
            fontSize: '0.82rem',
          }}>
            <STTooltip term={term}>{term}</STTooltip>
          </div>
        ))}
      </div>

      {/* Key insight */}
      <div className="st-card" style={{ maxWidth: '580px', width: '100%' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent-2)' }}>La información no está en ningún lugar.</span>{' '}
          Está distribuida en la eficacia de miles de{' '}
          <STTooltip term="sinapsis">sinapsis</STTooltip>.
          Aprender = cambio en eficacia sináptica.
        </p>
        {profesorMode && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            Este es el fundamento empírico del marco computacional de Hinton.
            La idealización que sigue (S03) borrará la geometría del axón,
            la química sináptica y la temporalidad — pero conservará esta intuición central.
          </div>
        )}
      </div>
    </div>
  )
}
