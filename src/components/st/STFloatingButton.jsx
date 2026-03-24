import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical } from 'lucide-react'
import STLogicModal from './STLogicModal'

void motion

const QUOTES = [
  '¿Y si todo es una metáfora?',
  'Hinton apostó, no demostró.',
  'Supuestos bajo la alfombra...',
  '¿Descripción o ingeniería?',
  'La convergencia es contingente.',
  '□ necesario vs ◇ posible',
]

export default function STFloatingButton({ slideId }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)])

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 15 }}
        whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(124,109,250,0.4)' }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'absolute',
          bottom: '1rem',
          right: '1rem',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '24px',
          border: '1px solid rgba(124,109,250,0.35)',
          background: 'rgba(17,17,24,0.85)',
          backdropFilter: 'blur(8px)',
          color: 'var(--accent-2)',
          fontSize: '0.7rem',
          fontFamily: '"JetBrains Mono", monospace',
          cursor: 'pointer',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <motion.span
          animate={{ rotate: [0, -10, 10, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, repeatDelay: 4 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <FlaskConical size={14} strokeWidth={1.8} />
        </motion.span>
        <span>Supuestos</span>
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 0.6 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ fontSize: '0.55rem', color: 'var(--text-dim)', overflow: 'hidden' }}
            >
              — {quote}
            </motion.span>
          )}
        </AnimatePresence>
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: 'var(--accent)', flexShrink: 0,
          }}
        />
      </motion.button>
      <STLogicModal isOpen={open} onClose={() => setOpen(false)} context="Explorador de supuestos formales — ST Hinton 1992" slideId={slideId} />
    </>
  )
}
