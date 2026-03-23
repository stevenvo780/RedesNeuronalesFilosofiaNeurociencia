import { useState } from 'react'

export default function STDeriveCard({ derive }) {
  const [showFormal, setShowFormal] = useState(false)

  return (
    <div className="st-card st-derive" style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--green)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            ✓ DERIVACIÓN VÁLIDA · tableau FOL
          </div>
          {showFormal ? (
            <code style={{ fontSize: '0.78rem', color: 'var(--text-h)', display: 'block', lineHeight: 1.5 }}>
              {derive.conclusion}
            </code>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 }}>
              {derive.natural}
            </p>
          )}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem', fontFamily: 'monospace' }}>
            vía: {derive.via}
          </div>
        </div>
        <button
          onClick={() => setShowFormal(f => !f)}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            color: 'var(--text-dim)',
            fontSize: '0.68rem',
            padding: '2px 8px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {showFormal ? 'natural' : 'formal'}
        </button>
      </div>
    </div>
  )
}
