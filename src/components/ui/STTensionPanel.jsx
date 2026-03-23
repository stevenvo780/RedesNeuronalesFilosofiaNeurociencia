import { STTensionData, STContradictions } from '../../data/st-results'

export default function STTensionPanel({ compact = false }) {
  return (
    <div className="st-card" style={{ maxWidth: compact ? 560 : 720 }}>
      <div className="text-xs text-[var(--text-dim)] mb-3 font-mono">
        06_Hinton_Critica_Ontologica.st — STTensionPanel
      </div>

      <div className="space-y-3">
        {STTensionData.map((item, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <div className="st-card st-tension-left p-2">
              <div className="st-satisfiable text-xs mb-1">Presupuesto</div>
              <div className="text-xs text-[var(--text)]">{item.presupuesto}</div>
            </div>
            <div className="st-card st-tension-right p-2">
              <div className="text-[var(--red)] text-xs mb-1">Objeción</div>
              <div className="text-xs text-[var(--text)]">{item.objecion}</div>
              <div className="text-[var(--text-dim)] text-xs mt-1 font-mono">{item.derive}</div>
              <div className="text-[var(--accent-2)] text-xs font-mono">{item.modal}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)] flex gap-4">
        {STContradictions.map((c, i) => (
          <div key={i} className="text-xs">
            <span className="font-mono text-[var(--text-dim)]">{c.formula}</span>
            <span className="ml-2 st-insatisfiable font-mono">{c.result}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
