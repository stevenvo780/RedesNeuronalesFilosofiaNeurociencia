import { useState } from 'react'

export default function STDeriveCard({ derive }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="st-card st-derive text-left" style={{ maxWidth: 480 }}>
      <div
        className="flex items-center justify-between cursor-pointer gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <span className="st-satisfiable font-mono text-xs">✓ derive</span>
          <span className="text-xs text-[var(--text-dim)] ml-2">{derive.readableConclusion}</span>
        </div>
        <span className="text-[var(--text-dim)] text-xs">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="mt-3 space-y-1 fade-in">
          <div className="text-[var(--text-dim)] text-xs mb-2">
            Patrón: <span className="text-[var(--cyan)]">{derive.rule}</span>
          </div>
          {derive.proof.map((line, i) => (
            <div key={i} className="font-mono text-xs text-[var(--text)]">{line}</div>
          ))}
          <div className="mt-2 pt-2 border-t border-[var(--border)]">
            <span className="st-badge">FOL tableau ✓</span>
          </div>
        </div>
      )}
    </div>
  )
}
