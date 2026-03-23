export default function STModalBadge({ formula, symbol, content, title, status = 'satisfacible', system = 'Modal K' }) {
  // Support both APIs: legacy (formula) and new (symbol + content + title)
  if (formula) {
    const isNecessary = formula.startsWith('□')
    const color = isNecessary ? 'var(--cyan)' : 'var(--accent-2)'
    return (
      <span className="st-badge" style={{ borderColor: `${color}66`, color }}>
        <span style={{ fontSize: '0.9em' }}>{isNecessary ? '□' : '◇'}</span>
        <code style={{ fontSize: '0.72rem' }}>{formula.replace(/^[◇□]/, '').trim()}</code>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{system}</span>
      </span>
    )
  }

  // New API: symbol + content + optional title
  const sym = symbol || '◇'
  const color = sym === '□' ? 'var(--cyan)' : 'var(--accent-2)'
  return (
    <span className="st-badge" style={{ borderColor: `${color}66`, color, cursor: title ? 'help' : 'default' }} title={title || ''}>
      <span style={{ fontSize: '0.9em' }}>{sym}</span>
      <code style={{ fontSize: '0.72rem' }}>{content || ''}</code>
    </span>
  )
}
