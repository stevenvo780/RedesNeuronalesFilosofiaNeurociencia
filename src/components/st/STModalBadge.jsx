import { useState } from 'react'
import STLogicModal from './STLogicModal'

export default function STModalBadge({ formula, symbol, content, title, status = 'satisfacible', system = 'Modal K' }) {
  const [modalOpen, setModalOpen] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    setModalOpen(true)
  }

  if (formula) {
    const isNecessary = formula.startsWith('□')
    const color = isNecessary ? 'var(--cyan)' : 'var(--accent-2)'
    return (
      <>
        <span className="st-badge" style={{ borderColor: `${color}66`, color }} onClick={handleClick}>
          <span style={{ fontSize: '0.9em' }}>{isNecessary ? '□' : '◇'}</span>
          <code style={{ fontSize: '0.65rem' }}>{formula.replace(/^[◇□]/, '').trim()}</code>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>{system}</span>
        </span>
        <STLogicModal isOpen={modalOpen} onClose={() => setModalOpen(false)} context={`Modal badge: ${formula}`} />
      </>
    )
  }

  const sym = symbol || '◇'
  const color = sym === '□' ? 'var(--cyan)' : 'var(--accent-2)'
  return (
    <>
      <span className="st-badge" style={{ borderColor: `${color}66`, color }} title={title || ''} onClick={handleClick}>
        <span style={{ fontSize: '0.9em' }}>{sym}</span>
        <code style={{ fontSize: '0.65rem' }}>{content || ''}</code>
      </span>
      <STLogicModal isOpen={modalOpen} onClose={() => setModalOpen(false)} context={title || content || 'ST Modal'} />
    </>
  )
}
