import { useState, useRef, useEffect } from 'react'
import { ArrowRight, X } from 'lucide-react'

const OLLAMA_URL = 'https://ollama.humanizar-dev.cloud/api/chat/completions'
const OLLAMA_KEY = 'sk-bac7ed4eba894e0d8f14eade1dc589fe'
const MODEL = 'qwen2.5-coder:14b'

const SYSTEM_PROMPT = `Eres el asistente de una presentación académica sobre el artículo "Redes Neuronales que Aprenden de la Experiencia" de Geoffrey Hinton (1992), en el contexto del curso de Filosofía de las Neurociencias.
Responde en español, de forma concisa y precisa. Tu función es responder preguntas del público durante la presentación.
Conceptos clave: neurona biológica vs artificial, retropropagación, aprendizaje supervisado y no supervisado, códigos demográficos/poblacionales, representaciones distribuidas y jerárquicas, idealización, plausibilidad biológica, convergencia computación-biología.
Mantén un tono filosófico-científico. Si no sabes algo, dilo claramente. Máximo 3-4 oraciones por respuesta.`

export default function AIPanel({ open, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OLLAMA_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
            userMsg,
          ],
        }),
      })
      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || 'Sin respuesta.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el modelo.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed right-0 top-0 h-full flex flex-col fade-in"
      style={{ width: 340, background: 'var(--bg-2)', borderLeft: '1px solid var(--border)', zIndex: 100 }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="text-sm font-semibold text-[var(--text-h)]">Asistente IA</div>
          <div className="text-xs text-[var(--text-dim)] font-mono">{MODEL}</div>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-dim)] hover:text-[var(--text-h)]"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Cerrar panel IA"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-y">
        {messages.length === 0 && (
          <div className="text-xs text-[var(--text-dim)] text-center mt-4">
            Pregunta al público sobre el texto de Hinton
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-sm leading-relaxed ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span
              className="inline-block px-3 py-2 rounded-lg text-xs"
              style={{
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-3)',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                maxWidth: '85%',
              }}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-[var(--text-dim)] font-mono" style={{ animation: 'pulse 1s infinite' }}>
            Pensando...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Pregunta al público..."
            className="flex-1 text-xs px-3 py-2 rounded outline-none"
            style={{
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          />
          <button
            onClick={send}
            disabled={loading}
            className="px-3 py-2 rounded text-xs font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', opacity: loading ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Enviar pregunta"
          >
            <ArrowRight size={16} strokeWidth={2.3} />
          </button>
        </div>
      </div>
    </div>
  )
}
