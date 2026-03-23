import { STModalResults } from '../../data/st-results'

export default function STModalBadge() {
  return (
    <div className="st-card st-modal space-y-2" style={{ maxWidth: 520 }}>
      <div className="text-xs text-[var(--text-dim)] font-mono mb-1">
        05_Hinton_Presupuestos_Expandidos.st — Modal K + Epistémica S5
      </div>
      {STModalResults.map((r, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="font-mono text-[var(--accent-2)] text-sm whitespace-nowrap">{r.formula}</span>
          <div>
            <span className={`text-xs font-mono ${r.result === 'VÁLIDA' ? 'st-valid' : 'st-satisfiable'}`}>
              {r.result}
            </span>
            <span className="text-xs text-[var(--text-dim)] ml-2">en {r.logic}</span>
            <div className="text-xs text-[var(--text-dim)]">{r.note}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
