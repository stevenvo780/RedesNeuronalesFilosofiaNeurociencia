import { SECTIONS } from '../../data/sections'

export default function SectionNav({ current, onGo }) {
  return (
    <div className="flex items-center gap-1 flex-wrap justify-center px-2">
      {SECTIONS.map(s => (
        <button
          key={s.id}
          onClick={() => onGo(s.id)}
          title={s.title}
          style={{
            width: 28, height: 28, borderRadius: 4,
            background: current === s.id ? s.color : 'var(--bg-3)',
            border: `1px solid ${current === s.id ? s.color : 'var(--border)'}`,
            color: current === s.id ? '#fff' : 'var(--text-dim)',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {s.id}
        </button>
      ))}
    </div>
  )
}
