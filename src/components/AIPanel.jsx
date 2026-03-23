import { useState, useRef, useEffect } from 'react'
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

export default function AIPanel({ visible, onClose, currentSlide }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '¿Tienes preguntas sobre el texto de Hinton o la presentación?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')
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
            { role: 'system', content: SYSTEM_PROMPT },
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
      position: 'fixed',
      right: 0,
      top: 0,
      bottom: 0,
      width: '340px',
      background: 'rgba(17, 17, 24, 0.75)',
      backdropFilter: 'blur(16px)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 200,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.2rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-h)', fontWeight: 600 }}>
            IA · qwen2.5-coder:14b
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Contexto: Hinton 1992 + notas
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="scroll-y" style={{ flex: 1, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            maxWidth: '90%',
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? 'rgba(124,109,250,0.2)' : 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '0.8rem 1.2rem',
            fontSize: '1rem',
            lineHeight: 1.5,
            color: 'var(--text)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
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
            padding: '0.5rem 0.75rem',
            fontSize: '0.82rem',
            color: 'var(--text-dim)',
          }}>
            <span className="fade-in" style={{ animation: 'pulse 1.2s ease infinite' }}>pensando…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
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
          onClick={send}
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
          →
        </button>
      </div>
    </div>
  )
}
