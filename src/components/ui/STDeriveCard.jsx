import { useState } from 'react'
import { CheckCircle2, ChevronDown } from 'lucide-react'

export default function STDeriveCard({ derive }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="st-card st-derive text-left" style={{ maxWidth: 480 }}>
      <div
        className="flex items-center justify-between cursor-pointer gap-3"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <span className="st-satisfiable font-mono text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <CheckCircle2 size={12} strokeWidth={2} />
            derive
          </span>
          <span className="text-xs text-[var(--text-dim)] ml-2">{derive.readableConclusion}</span>
        </div>
        <span
          className="text-[var(--text-dim)] text-xs"
          style={{ display: 'flex', alignItems: 'center', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <ChevronDown size={14} strokeWidth={2} />
        </span>
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
            <span className="st-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} strokeWidth={2} />
              FOL tableau
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
