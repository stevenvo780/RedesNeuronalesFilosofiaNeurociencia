export default function STModalBadge({ formula, status = 'satisfacible', system = 'Modal K' }) {
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
