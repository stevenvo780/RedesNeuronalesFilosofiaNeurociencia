import { useState } from 'react'
import { dictionary } from '../../data/dictionary'

export default function STTooltip({ term, children }) {
  const [visible, setVisible] = useState(false)
  const def = dictionary[term]
  if (!def) return <>{children}</>

  return (
    <span className="relative inline-block">
      <span
        className="border-b border-dashed border-[var(--accent)] cursor-help"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {children}
      </span>
      {visible && (
        <div
          className="absolute bottom-full left-0 mb-2 z-50 fade-in"
          style={{ width: 300 }}
        >
          <div className="st-card text-left">
            <div className="text-xs text-[var(--accent-2)] font-mono mb-1">{term}</div>
            <div className="text-xs text-[var(--text)] leading-relaxed">{def}</div>
            <div className="text-xs text-[var(--text-dim)] mt-1 font-mono">04_Hinton_Diccionario.st</div>
          </div>
        </div>
      )}
    </span>
  )
}
