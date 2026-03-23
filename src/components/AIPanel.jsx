import { useState, useRef, useEffect } from 'react'
import { Zap, SendHorizontal } from 'lucide-react'
import { HINTON_CONTEXT } from '../data/st_results'

const ENDPOINT = 'https://ollama.humanizar-dev.cloud/api/chat/completions'
const MODEL = 'qwen2.5-coder:14b'
const AUTH = 'Bearer sk-bac7ed4eba894e0d8f14eade1dc589fe'

const QUICK_QUESTIONS = [
  '¿Por qué la retropropagación no es biológicamente plausible?',
  '¿Qué diferencia hay entre representación local y distribuida?',
  '¿Qué demostró el experimento de Sparks?',
  '¿Qué es la realizabilidad múltiple?',
  '¿Cómo se relaciona Hinton con Daugman?',
  '¿Qué significa que sea un programa de investigación lakatosiano?',
  '¿Qué prueba Andersen y Zipser?',
  '¿Qué es el teorema de aproximación universal?',
]

function buildSystemPrompt(currentSlide) {
  const slideCtx = currentSlide
    ? `\nSLIDE ACTUAL: ${currentSlide.id} — "${currentSlide.label}". Prioriza respuestas relevantes a este slide, pero responde cualquier pregunta sobre la presentación completa.`
    : ''
  return `Eres un asistente filosófico especializado en la presentación sobre Hinton (1992) y el contexto del curso de Filosofía de las Neurociencias.
Responde siempre en español. Sé conciso pero preciso (máximo 4 oraciones salvo que pidan más detalle).
Usa los conceptos del marco formal cuando sea relevante.
Si la pregunta es sobre un slide específico, responde en ese contexto.
Si no sabes algo, dilo claramente en lugar de inventar.
${slideCtx}

${HINTON_CONTEXT}`
}

export default function AIPanel({ visible, onClose, currentSlide, mobile }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¿Tienes preguntas sobre el texto de Hinton o la presentación?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuick, setShowQuick] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setShowQuick(false)
    const newMessages = [...messages, { role: 'user', content: q }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: buildSystemPrompt(currentSlide) },
            ...newMessages,
          ],
          stream: false,
        }),
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || '(sin respuesta)'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error de conexión: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div style={{
      ...(mobile ? {
        width: '100%',
        height: '100%',
        position: 'relative',
      } : {
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '340px',
      }),
      background: 'rgba(17, 17, 24, 0.75)',
      backdropFilter: 'blur(16px)',
      borderLeft: mobile ? 'none' : '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: mobile ? 0 : 200,
      boxShadow: mobile ? 'none' : '-8px 0 32px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '0.9rem 1.2rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '1rem', color: 'var(--text-h)', fontWeight: 600 }}>
            IA · Hinton 1992
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            {currentSlide ? `slide: ${currentSlide.label}` : 'contexto completo'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowQuick(v => !v)}
            title="Preguntas rápidas"
            style={{
              background: showQuick ? 'rgba(124,109,250,0.2)' : 'none',
              border: `1px solid ${showQuick ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '5px',
              color: showQuick ? 'var(--accent-2)' : 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              padding: '0.2rem 0.5rem',
            }}
          >
            <Zap size={12} strokeWidth={1.8} /> rápidas
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Quick questions panel */}
      {showQuick && (
        <div style={{
          padding: '0.6rem 0.8rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.3rem',
          flexShrink: 0,
          background: 'rgba(124,109,250,0.04)',
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace', marginBottom: '0.2rem' }}>
            PREGUNTAS FRECUENTES
          </div>
          {QUICK_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              disabled={loading}
              style={{
                background: 'var(--bg-3)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-dim)',
                fontSize: '0.72rem',
                padding: '0.35rem 0.6rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                lineHeight: 1.4,
                transition: 'background 0.15s',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="scroll-y" style={{ flex: 1, padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: '90%',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'rgba(124,109,250,0.2)' : 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '0.65rem 1rem',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            color: 'var(--text)',
          }}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '0.4rem 0.7rem',
            fontSize: '0.78rem',
            color: 'var(--text-dim)',
          }}>
            <span style={{ animation: 'pulse 1.2s ease infinite' }}>pensando…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.65rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Pregunta sobre Hinton…"
          style={{
            flex: 1,
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text)',
            padding: '0.4rem 0.6rem',
            fontSize: '0.82rem',
            outline: 'none',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: 'rgba(124,109,250,0.8)',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            padding: '0.4rem 0.8rem',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          <SendHorizontal size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
