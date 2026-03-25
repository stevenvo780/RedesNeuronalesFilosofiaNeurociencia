import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Github, BookOpen } from 'lucide-react'

void motion

const REPOS = [
  {
    name: 'RedesNeuronalesFilosofiaNeurociencia',
    desc: 'Presentación interactiva (React / Vite)',
    url: 'https://github.com/stevenvo780/RedesNeuronalesFilosofiaNeurociencia',
  },
  {
    name: 'neurofilosofia',
    desc: 'Materiales del curso de neurofilosofía',
    url: 'https://github.com/stevenvo780/neurofilosofia',
  },
]

const SOURCES = [
  // ── Primary source ──
  {
    category: 'Texto central',
    entries: [
      { author: 'Hinton, G. E.', year: 1992, title: 'How Neural Networks Learn from Experience', journal: 'Scientific American, 267(3), 144–151', slides: 'S00–S13' },
    ],
  },
  // ── Cited works ──
  {
    category: 'Fundamentos históricos',
    entries: [
      { author: 'McCulloch, W. S. & Pitts, W.', year: 1943, title: 'A Logical Calculus of the Ideas Immanent in Nervous Activity', journal: 'Bulletin of Mathematical Biophysics, 5(4), 115–133', slides: 'S03, S12' },
      { author: 'Hebb, D. O.', year: 1949, title: 'The Organization of Behavior', journal: 'Wiley', slides: 'S05, S09, S12' },
      { author: 'Rosenblatt, F.', year: 1958, title: 'The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain', journal: 'Psychological Review, 65(6), 386–408', slides: 'S03, S12' },
      { author: 'Barlow, H. B.', year: 1961, title: 'Possible Principles Underlying the Transformations of Sensory Messages', journal: 'Sensory Communication, MIT Press', slides: 'S09, S10' },
      { author: 'Minsky, M. & Papert, S.', year: 1969, title: 'Perceptrons', journal: 'MIT Press', slides: 'S06, S12' },
    ],
  },
  {
    category: 'Retropropagación y aprendizaje',
    entries: [
      { author: 'Bliss, T. V. P. & Lømo, T.', year: 1973, title: 'Long-lasting Potentiation of Synaptic Transmission in the Dentate Area of the Anaesthetized Rabbit', journal: 'Journal of Physiology, 232(2), 331–356', slides: 'S02' },
      { author: 'Werbos, P. J.', year: 1974, title: 'Beyond Regression: New Tools for Prediction and Analysis in the Behavioral Sciences', journal: 'Tesis doctoral, Harvard University', slides: 'S06, S12' },
      { author: 'Oja, E.', year: 1982, title: 'A Simplified Neuron Model as a Principal Component Analyzer', journal: 'Journal of Mathematical Biology, 15(3), 267–273', slides: 'S09' },
      { author: 'Kohonen, T.', year: 1982, title: 'Self-Organized Formation of Topologically Correct Feature Maps', journal: 'Biological Cybernetics, 43(1), 59–69', slides: 'S09' },
      { author: 'Rumelhart, D. E., Hinton, G. E. & Williams, R. J.', year: 1986, title: 'Learning Representations by Back-Propagating Errors', journal: 'Nature, 323, 533–536', slides: 'S06, S12' },
      { author: 'Linsker, R.', year: 1988, title: 'Self-Organization in a Perceptual Network', journal: 'Computer, 21(3), 105–117', slides: 'S09' },
      { author: 'Sutton, R. S.', year: 1988, title: 'Learning to Predict by the Methods of Temporal Differences', journal: 'Machine Learning, 3(1), 9–44', slides: 'S09' },
    ],
  },
  {
    category: 'Convergencia empírica',
    entries: [
      { author: 'Andersen, R. A. & Zipser, D.', year: 1988, title: 'The Role of the Posterior Parietal Cortex in Coordinate Transformations for Visual-Motor Integration', journal: 'Journal of Neuroscience, 8(12)', slides: 'S06, S09, S12b' },
      { author: 'Sparks, D. L.', year: 1988, title: 'Neural Cartography: Sensory and Motor Maps in the Superior Colliculus', journal: 'Brain, Behavior and Evolution, 31(1)', slides: 'S11' },
      { author: 'Young, M. P. & Yamane, S.', year: 1992, title: 'Sparse Population Coding of Faces in the Inferotemporal Cortex', journal: 'RIKEN', slides: 'S11' },
      { author: 'Cybenko, G.', year: 1989, title: 'Approximation by Superpositions of a Sigmoidal Function', journal: 'Mathematics of Control, Signals and Systems, 2(4), 303–314', slides: 'S07' },
    ],
  },
  {
    category: 'Filosofía de la mente y neurociencias',
    entries: [
      { author: 'Putnam, H.', year: 1967, title: 'Psychological Predicates (realizabilidad múltiple)', journal: 'Art, Mind, and Religion, University of Pittsburgh Press', slides: 'S10, S12c' },
      { author: 'Fodor, J. A.', year: 1974, title: 'Special Sciences (The Disunity of Science as a Working Hypothesis)', journal: 'Synthese, 28(2), 97–115', slides: 'S10, S12c' },
      { author: 'Daugman, J. G.', year: 1992, title: 'Brain Metaphor and Brain Theory', journal: 'Philosophy and the Neurosciences, Cambridge UP', slides: 'S01, S12, S13' },
      { author: 'Schultz, W.', year: 1997, title: 'A Neural Substrate of Prediction and Reward', journal: 'Science, 275(5306), 1593–1599', slides: 'S09' },
      { author: 'Kim, J.', year: 1999, title: 'Making Sense of Emergence', journal: 'Philosophical Studies, 95(1–2), 3–36', slides: 'S12c, S13' },
      { author: 'Bechtel, W.', year: 2001, title: 'Representations: From Neural Systems to Cognitive Systems', journal: 'Philosophy and the Neurosciences, Cambridge UP', slides: 'S01, S10, S12b, S13' },
      { author: 'Lakatos, I.', year: 1978, title: 'The Methodology of Scientific Research Programmes', journal: 'Cambridge University Press', slides: 'S13' },
    ],
  },
  {
    category: 'Deep learning moderno',
    entries: [
      { author: 'LeCun, Y. et al.', year: 1998, title: 'Gradient-Based Learning Applied to Document Recognition', journal: 'Proceedings of the IEEE, 86(11), 2278–2324', slides: 'S12' },
      { author: 'Krizhevsky, A., Sutskever, I. & Hinton, G. E.', year: 2012, title: 'ImageNet Classification with Deep Convolutional Neural Networks (AlexNet)', journal: 'NeurIPS 2012', slides: 'S12' },
      { author: 'Vaswani, A. et al.', year: 2017, title: 'Attention Is All You Need', journal: 'NeurIPS 2017', slides: 'S12' },
      { author: 'Kaplan, J. et al.', year: 2020, title: 'Scaling Laws for Neural Language Models', journal: 'arXiv:2001.08361', slides: 'S12' },
    ],
  },
]

export default function SourcesModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(4,4,12,0.7)',
              backdropFilter: 'blur(6px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'clamp(360px, 72vw, 820px)',
              maxHeight: '82vh',
              background: 'rgba(17,17,24,0.94)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(124,109,250,0.25)',
              borderRadius: '18px',
              zIndex: 910,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(0,0,0,0.55)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.2rem 1.5rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <BookOpen size={18} strokeWidth={1.8} style={{ color: 'var(--accent-2)' }} />
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-h)' }}>
                  Fuentes y Bibliografía
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '0.35rem',
                  color: 'var(--text-dim)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="scroll-y" style={{ flex: 1, padding: '1rem 1.5rem', overflowY: 'auto' }}>

              {/* Repos */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.7rem', fontFamily: 'monospace',
                  color: 'var(--accent-2)', letterSpacing: '0.12em',
                  marginBottom: '0.6rem',
                }}>
                  REPOSITORIOS DEL PROYECTO
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {REPOS.map(r => (
                    <a
                      key={r.name}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.7rem',
                        padding: '0.7rem 1rem',
                        background: 'var(--bg-3)',
                        border: '1px solid rgba(124,109,250,0.2)',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,109,250,0.5)'; e.currentTarget.style.background = 'rgba(124,109,250,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(124,109,250,0.2)'; e.currentTarget.style.background = 'var(--bg-3)' }}
                    >
                      <Github size={18} strokeWidth={1.6} style={{ color: 'var(--accent-2)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-h)' }}>
                          {r.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                          {r.desc}
                        </div>
                      </div>
                      <ExternalLink size={14} strokeWidth={1.6} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Bibliography by category */}
              {SOURCES.map(cat => (
                <div key={cat.category} style={{ marginBottom: '1.4rem' }}>
                  <div style={{
                    fontSize: '0.7rem', fontFamily: 'monospace',
                    color: cat.category === 'Texto central' ? '#ef4444' : 'var(--text-dim)',
                    letterSpacing: '0.12em',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                  }}>
                    {cat.category}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {cat.entries.map((e, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.6rem 0.8rem',
                          background: cat.category === 'Texto central' ? 'rgba(239,68,68,0.06)' : 'transparent',
                          border: cat.category === 'Texto central' ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                          borderRadius: '8px',
                          borderBottom: cat.category !== 'Texto central' ? '1px solid rgba(255,255,255,0.04)' : undefined,
                        }}
                      >
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-h)', lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600 }}>{e.author}</span>
                          {' '}
                          <span style={{ color: 'var(--accent-2)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                            ({e.year})
                          </span>
                          {'. '}
                          <em style={{ color: 'var(--text)' }}>{e.title}</em>
                          {'. '}
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{e.journal}</span>
                        </div>
                        <div style={{
                          fontSize: '0.7rem', fontFamily: 'monospace',
                          color: 'var(--text-dim)', marginTop: '0.25rem',
                          opacity: 0.7,
                        }}>
                          → {e.slides}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Footer note */}
              <div style={{
                fontSize: '0.78rem', color: 'var(--text-dim)',
                lineHeight: 1.55, marginTop: '0.5rem',
                padding: '0.8rem',
                background: 'rgba(124,109,250,0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(124,109,250,0.12)',
              }}>
                <strong style={{ color: 'var(--accent-2)' }}>Nota:</strong>{' '}
                Esta presentación fue desarrollada por Steven Vallejo como material para el curso
                de Filosofía de las Neurociencias. El análisis formal (ST) fue ejecutado con{' '}
                <code style={{ fontSize: '0.72rem', padding: '0.1rem 0.3rem', background: 'var(--bg-3)', borderRadius: '4px' }}>
                  @stevenvo780/st-lang v3.0.0
                </code>.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
