import STTooltip from '../components/st/STTooltip'
import STFloatingButton from '../components/st/STFloatingButton'
import STModalBadge from '../components/st/STModalBadge'
import ConwayLifeBg from '../components/ConwayLifeBg'
import { useEffect, useRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { useState } from 'react'
import { Ban, BrainCircuit, BrainCog, Check, GitFork, Orbit, Scale, Sigma, Sprout } from 'lucide-react'

void motion
void AnimatePresence

// ── Emergence background — Conway garden with persistent structures ─────────
function EmergenceCanvas() {
  return <ConwayLifeBg />
}

// ── Step content definitions ──────────────────────────────────────────────────
const STEPS = [
  {
    key: 'elephant',
    title: '¿Por qué Hinton nunca habla de emergencia?',
    accent: '#ef4444',
    Icon: BrainCircuit,
  },
  {
    key: 'formal',
    title: 'El problema formal de P',
    accent: '#f59e0b',
    Icon: Sigma,
  },
  {
    key: 'sleight',
    title: 'La jugada de Hinton: reducción a información',
    accent: '#7c6dfa',
    Icon: BrainCog,
  },
  {
    key: 'continuous',
    title: 'Emergencia continua: una ontología no dicha',
    accent: '#22c55e',
    Icon: Orbit,
  },
  {
    key: 'fork',
    title: 'La bifurcación epistemológica',
    accent: '#06b6d4',
    Icon: GitFork,
  },
  {
    key: 'st',
    title: 'ST: Reduccionismo informacional vs Emergentismo débil',
    accent: '#a78bfa',
    Icon: Scale,
  },
]

// ── Individual step panels ──────────────────────────────────────────────────────
function StepElephant() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1000px', width: '100%' }}
    >
      <div className="quote" style={{ fontSize: '1.15rem', borderLeft: '4px solid #ef4444' }}>
        "La palabra <em style={{ color: '#ef4444' }}>emergencia</em> no aparece ni una sola vez
        en Hinton (1992). Cero. Nada. Y sin embargo, todo su argumento
        depende de que las <STTooltip term="representacion_distribuida">representaciones distribuidas</STTooltip>{' '}
        hagan algo que ninguna neurona individual puede hacer.
        ¿Coincidencia? No — es una decisión ontológica disfrazada de ingeniería."
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '0.8rem', width: '100%',
      }}>
        {[
          { label: '"emergencia" en el paper', val: '0 menciones', color: '#ef4444' },
          { label: '"representación distribuida"', val: '~18 veces', color: '#7c6dfa' },
          { label: '"información"', val: '~25 veces', color: '#06b6d4' },
          { label: 'Implicación', val: 'Reducción al lenguaje informacional', color: '#f59e0b' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            style={{
              background: 'var(--bg-3)', border: `1px solid ${item.color}44`,
              borderLeft: `4px solid ${item.color}`, borderRadius: '8px',
              padding: '0.8rem 1rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color, marginTop: '0.3rem' }}>
              {item.val}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function StepFormal() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '1000px', width: '100%', alignItems: 'center' }}
    >
      <div style={{
        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
        borderRadius: '12px', padding: '1.5rem 2rem', textAlign: 'center', width: '100%',
      }}>
        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-dim)', marginBottom: '0.8rem', letterSpacing: '0.15em' }}>
          DEFINICIÓN FORMAL — PROPIEDAD EMERGENTE
        </div>
        <BlockMath math="P = f\!\left(\{N_i\}_{i=1}^{k},\; \mathbf{R}\right) \quad \text{donde } \mathbf{R} = \{w_{ij}\}" />
        <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6, marginTop: '0.8rem' }}>
          <InlineMath math="P" /> es la propiedad global (clasificación, representación, patrón).{' '}
          <InlineMath math="N_i" /> son las unidades individuales. <InlineMath math="\mathbf{R}" /> es la estructura relacional (pesos).
        </div>
      </div>

      <div style={{
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)',
        borderRadius: '12px', padding: '1.2rem 2rem', textAlign: 'center', width: '100%',
      }}>
        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#ef4444', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
          TESIS DE IRREDUCIBILIDAD
        </div>
        <BlockMath math="P \neq \sum_{i=1}^{k} N_i \quad \Longrightarrow \quad P \text{ es irreducible a sus partes}" />
        <div style={{ fontSize: '0.92rem', color: 'var(--text-dim)', lineHeight: 1.6, marginTop: '0.6rem' }}>
          Si <InlineMath math="P" /> no puede explicarse desde ningún <InlineMath math="N_i" /> aislado,
          entonces <InlineMath math="P" /> es una propiedad <em style={{ color: '#ef4444' }}>emergente</em> —
          por definición.
          Y las representaciones distribuidas de Hinton <strong>satisfacen exactamente esta condición</strong>.
        </div>
      </div>
    </motion.div>
  )
}

function StepSleight() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1000px', width: '100%' }}
    >
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem',
        alignItems: 'center', width: '100%',
      }}>
        {/* Emergentism */}
        <motion.div
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-3)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px', padding: '1rem 1.2rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Ban size={14} strokeWidth={2} />
            LO QUE HINTON EVITA
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-h)', fontWeight: 600 }}>
            "¿Qué <em>emerge</em>?"
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginTop: '0.4rem', lineHeight: 1.5 }}>
            Pregunta ontológica clásica. Requiere comprometerse con la existencia de propiedades nuevas,
            irreducibles. Es un compromiso metafísico pesado.
          </div>
        </motion.div>

        {/* Arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          style={{ fontSize: '2rem', color: '#7c6dfa' }}
        >
          →
        </motion.div>

        {/* Info reduction */}
        <motion.div
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--bg-3)', border: '1px solid rgba(124,109,250,0.4)',
            borderRadius: '10px', padding: '1rem 1.2rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#7c6dfa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <BrainCog size={14} strokeWidth={2} />
            LO QUE HINTON HACE
          </div>
          <div style={{ fontSize: '1rem', color: 'var(--text-h)', fontWeight: 600 }}>
            "¿Qué <em>información</em> se codifica?"
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', marginTop: '0.4rem', lineHeight: 1.5 }}>
            Pregunta ingenieril. Reemplaza ontología por epistemología.
            La emergencia "desaparece" — pero solo porque cambió la pregunta, no porque se resolvió.
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          background: 'rgba(124,109,250,0.08)', border: '1px solid rgba(124,109,250,0.3)',
          borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.65 }}>
          <strong style={{ color: '#f59e0b' }}>Pero hay un truco:</strong> la representación distribuida{' '}
          <em>es en sí misma</em> una propiedad emergente de la configuración de pesos.
          Llamarla "información codificada" no elimina la emergencia — la <em style={{ color: '#7c6dfa' }}>renombra</em>.
        </div>
      </motion.div>
    </motion.div>
  )
}

function StepContinuous() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '1000px', width: '100%', alignItems: 'center' }}
    >
      <div style={{
        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.35)',
        borderRadius: '12px', padding: '1.5rem 2rem', textAlign: 'center', width: '100%',
      }}>
        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#22c55e', marginBottom: '0.8rem', letterSpacing: '0.15em' }}>
          EMERGENCIA CONTINUA — LA ONTOLOGÍA NO DICHA
        </div>
        <BlockMath math="\frac{\partial P}{\partial t} = \frac{\partial P}{\partial \mathbf{R}} \cdot \frac{\partial \mathbf{R}}{\partial t} \neq 0" />
        <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.6, marginTop: '0.8rem' }}>
          En cada paso de entrenamiento, los pesos <InlineMath math="\mathbf{R}" /> cambian
          → la propiedad <InlineMath math="P" /> cambia → emergen propiedades nuevas <strong>continuamente</strong>.
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '0.8rem', width: '100%',
      }}>
        {[
          {
            label: 'Emergencia clásica (fuerte)',
            desc: 'P aparece como novedad cualitativa irreducible. Salto ontológico.',
            formula: 'P \\not\\in \\text{closure}(\\{N_i\\})',
            color: '#ef4444',
            verdict: 'Hinton no la asume',
          },
          {
            label: 'Emergencia continua (Hinton implícito)',
            desc: 'P varía suavemente con R. No hay salto, pero P no está en ningún Nᵢ.',
            formula: 'P = \\lim_{\\Delta t \\to 0} P(\\mathbf{R} + \\Delta\\mathbf{R})',
            color: '#22c55e',
            verdict: 'Lo que realmente ocurre',
          },
          {
            label: 'Reducción simple',
            desc: 'P es derivable directamente de las partes. Sin novedad ontológica.',
            formula: 'P = \\bigoplus_i N_i',
            color: '#7c6dfa',
            verdict: 'Hinton cree estar aquí — pero no',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            style={{
              background: 'var(--bg-3)', border: `1px solid ${item.color}44`,
              borderTop: `3px solid ${item.color}`, borderRadius: '8px',
              padding: '1rem', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color, marginBottom: '0.4rem' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: '0.6rem' }}>
              {item.desc}
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <InlineMath math={item.formula} />
            </div>
            <div style={{
              fontSize: '0.75rem', fontFamily: 'monospace', padding: '0.3rem 0.6rem',
              borderRadius: '4px', display: 'inline-block',
              background: `${item.color}15`, color: item.color,
            }}>
              {item.verdict}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function StepFork() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '1000px', width: '100%', alignItems: 'center' }}
    >
      <div style={{
        background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.35)',
        borderRadius: '12px', padding: '1.5rem 2rem', textAlign: 'center', width: '100%',
      }}>
        <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: '#06b6d4', marginBottom: '0.6rem', letterSpacing: '0.15em' }}>
          LA BIFURCACIÓN
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-h)', lineHeight: 1.65 }}>
          <strong>¿Es Hinton un reduccionista o un emergentista que no se da cuenta?</strong>
        </div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%',
      }}>
        {/* Ontological level */}
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'var(--bg-3)', border: '1px solid rgba(124,109,250,0.35)',
            borderRadius: '10px', padding: '1.2rem', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#7c6dfa', marginBottom: '0.4rem' }}>
            NIVEL ONTOLÓGICO
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#7c6dfa', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Check size={16} strokeWidth={2.4} />
            Monismo
          </div>
          <BlockMath math="P \equiv g(\mathbf{R})" />
          <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.5, marginTop: '0.5rem' }}>
            Todo es <InlineMath math="\mathbf{R}" /> (pesos = información).
            Una sola sustancia. Reducible <em>en principio</em>.
            No hay "fuerza vital" ni propiedad metafísicamente extra.
          </div>
        </motion.div>

        {/* Epistemic level */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'var(--bg-3)', border: '1px solid rgba(34,197,94,0.35)',
            borderRadius: '10px', padding: '1.2rem', textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#22c55e', marginBottom: '0.4rem' }}>
            NIVEL EPISTÉMICO
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#22c55e', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Check size={16} strokeWidth={2.4} />
            Emergencia
          </div>
          <BlockMath math="P \not\leftarrow \{N_i\} \;\text{sin simular}\; \mathbf{R}" />
          <div style={{ fontSize: '0.88rem', color: 'var(--text-dim)', lineHeight: 1.5, marginTop: '0.5rem' }}>
            No puedes predecir <InlineMath math="P" /> desde los <InlineMath math="N_i" /> individuales.
            Necesitas la red completa funcionando.
            Reducible en principio, <em style={{ color: '#22c55e' }}>irreducible en práctica</em>.
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center', width: '100%',
        }}
      >
        <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.65 }}>
          <strong style={{ color: '#f59e0b' }}>Resultado:</strong>{' '}
          Hinton es un <em>monista ontológico</em> que opera como <em>emergentista epistémico</em>.
          Su framework permite reduccionismo como posición metafísica — pero obliga a tratar la cognición
          como si fuera emergente. Y eso es <strong>exactamente</strong> lo que hace en todo el paper sin decirlo.
        </div>
      </motion.div>
    </motion.div>
  )
}

function StepST() {
  const rows = [
    {
      dimension: 'Ontología',
      reduct: 'P \\equiv g(\\mathbf{R})',
      emerg: 'P \\notin \\text{partes}',
      reductLabel: 'Todo es pesos/info',
      emergLabel: 'P es novedad real',
      winner: 'reduct',
    },
    {
      dimension: 'Predicción',
      reduct: 'P \\leftarrow \\mathbf{R}',
      emerg: 'P \\not\\leftarrow \\{N_i\\}',
      reductLabel: 'Derivable si tienes R',
      emergLabel: 'No derivable sin simular',
      winner: 'emerg',
    },
    {
      dimension: 'Explicación',
      reduct: '\\text{bottom-up completo}',
      emerg: '\\text{top-down necesario}',
      reductLabel: 'De partes al todo',
      emergLabel: 'Del todo a las partes',
      winner: 'emerg',
    },
    {
      dimension: 'Mecanismo',
      reduct: '\\nabla_W \\mathcal{L}',
      emerg: '\\frac{\\partial P}{\\partial t}',
      reductLabel: 'Gradiente descendente',
      emergLabel: 'Novedad continua',
      winner: 'tie',
    },
    {
      dimension: 'Realizabilidad',
      reduct: '\\text{sustrato-indep.}',
      emerg: '\\text{sustrato-dep.}',
      reductLabel: 'Putnam/Fodor: múltiple',
      emergLabel: 'Embodiment importa',
      winner: 'reduct',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1100px', width: '100%', alignItems: 'center' }}
    >
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{
          width: '100%', borderCollapse: 'separate', borderSpacing: '0',
          fontSize: '0.88rem', background: 'var(--bg-3)', borderRadius: '10px',
          overflow: 'hidden',
        }}>
          <thead>
            <tr>
              <th style={{ padding: '0.8rem 1rem', textAlign: 'left', color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                Dimensión
              </th>
              <th style={{ padding: '0.8rem 1rem', textAlign: 'center', color: '#7c6dfa', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border)', background: 'rgba(124,109,250,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <BrainCog size={14} strokeWidth={2} />
                  REDUCT_INFO
                </div>
              </th>
              <th style={{ padding: '0.8rem 1rem', textAlign: 'center', color: '#22c55e', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border)', background: 'rgba(34,197,94,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <Sprout size={14} strokeWidth={2} />
                  EMERG_WEAK
                </div>
              </th>
              <th style={{ padding: '0.8rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'monospace', fontSize: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scale size={14} strokeWidth={2} />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={row.dimension}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: 'var(--text-h)' }}>
                  {row.dimension}
                </td>
                <td style={{
                  padding: '0.7rem 1rem', textAlign: 'center',
                  background: row.winner === 'reduct' ? 'rgba(124,109,250,0.08)' : 'transparent',
                }}>
                  <div style={{ marginBottom: '0.2rem' }}><InlineMath math={row.reduct} /></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{row.reductLabel}</div>
                </td>
                <td style={{
                  padding: '0.7rem 1rem', textAlign: 'center',
                  background: row.winner === 'emerg' ? 'rgba(34,197,94,0.08)' : 'transparent',
                }}>
                  <div style={{ marginBottom: '0.2rem' }}><InlineMath math={row.emerg} /></div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{row.emergLabel}</div>
                </td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '1.1rem' }}>
                  {row.winner === 'reduct' ? <BrainCog size={18} strokeWidth={2.2} color="#7c6dfa" />
                    : row.winner === 'emerg' ? <Sprout size={18} strokeWidth={2.2} color="#22c55e" />
                    : <Scale size={18} strokeWidth={2.2} color="#f59e0b" />}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center',
        }}
      >
        {[
          { code: 'REDUCT_INFO', val: '2/5', color: '#7c6dfa', label: 'Ventaja ontológica' },
          { code: 'EMERG_WEAK', val: '2/5', color: '#22c55e', label: 'Ventaja epistémica' },
          { code: 'EMPATE', val: '1/5', color: '#f59e0b', label: 'Mecanismo: ambos describen' },
        ].map((badge, i) => (
          <motion.div
            key={badge.code}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + i * 0.1 }}
            style={{
              background: 'var(--bg-3)', border: `1px solid ${badge.color}55`,
              borderRadius: '8px', padding: '0.5rem 1rem',
              display: 'flex', alignItems: 'center', gap: '0.6rem',
            }}
          >
            <span style={{
              fontSize: '1.2rem', fontWeight: 700, color: badge.color, fontFamily: 'monospace',
            }}>{badge.val}</span>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: badge.color }}>{badge.code}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{badge.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{
          background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.3)',
          borderRadius: '10px', padding: '1rem 1.5rem', textAlign: 'center', width: '100%',
        }}
      >
        <div style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.65 }}>
          <strong style={{ color: '#a78bfa' }}>Veredicto ST:</strong>{' '}
          <InlineMath math="\text{REDUCT\_INFO} \parallel \text{EMERG\_WEAK}" /> — ambas posiciones son
          <em> lógicamente compatibles</em>. El monismo ontológico de Hinton convive con emergencia epistémica.
          La tensión no se resuelve: se <em style={{ color: '#a78bfa' }}>habita</em>.
        </div>
      </motion.div>
    </motion.div>
  )
}

const STEP_COMPONENTS = [StepElephant, StepFormal, StepSleight, StepContinuous, StepFork, StepST]

// ── Main slide ──────────────────────────────────────────────────────────────────
export default function S12c_Emergencia({ profesorMode, ref: externalRef }) {
  const [step, setStep] = useState(0)
  const stepRef = useRef(0)

  // Sync ref with state
  useEffect(() => { stepRef.current = step }, [step])

  // Step-by-step navigation via arrow keys
  useImperativeHandle(externalRef, () => ({
    advanceStep() {
      if (stepRef.current < STEPS.length - 1) {
        setStep(s => s + 1)
        return true
      }
      return false
    },
    retreatStep() {
      if (stepRef.current > 0) {
        setStep(s => s - 1)
        return true
      }
      return false
    },
  }))

  const StepContent = STEP_COMPONENTS[step]
  const ActiveStepIcon = STEPS[step].Icon

  return (
    <div className="section-slide" style={{ gap: '1.2rem', position: 'relative', overflow: 'hidden' }}>

      {/* Background emergence visualization */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, opacity: 0.35, pointerEvents: 'none',
      }}>
        <EmergenceCanvas step={step} />
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="section-title">¿Por qué no se habló de emergencia?</div>
        <div className="section-subtitle">El silencio ontológico de Hinton (1992)</div>
      </div>

      {/* Step progress bar */}
      <div style={{
        display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center',
        position: 'relative', zIndex: 1, flexWrap: 'wrap',
      }}>
        {STEPS.map((s, i) => {
          const StepIcon = s.Icon
          return (
            <motion.button
              key={s.key}
              onClick={() => setStep(i)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                background: i === step ? `${s.accent}22` : 'var(--bg-3)',
                borderColor: i === step ? s.accent : 'var(--border)',
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.8rem', borderRadius: '20px',
                border: `1px solid ${i <= step ? s.accent + '55' : 'var(--border)'}`,
                cursor: 'pointer', fontSize: '0.75rem',
                color: i === step ? s.accent : i < step ? 'var(--text-dim)' : 'var(--text-dim)',
                fontFamily: 'monospace', transition: 'all 0.3s',
                opacity: i <= step ? 1 : 0.5,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <StepIcon size={15} strokeWidth={2.2} />
              </span>
              <span style={{ display: i === step ? 'inline' : 'none' }}>{s.title.length > 20 ? s.title.slice(0, 20) + '…' : s.title}</span>
              {i < step && <Check size={14} strokeWidth={2.4} color="#22c55e" />}
            </motion.button>
          )
        })}
      </div>

      {/* Step title */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          style={{
            textAlign: 'center', position: 'relative', zIndex: 1,
          }}
        >
          <span style={{
            fontSize: '0.7rem', fontFamily: 'monospace', color: STEPS[step].accent,
            letterSpacing: '0.15em',
          }}>
            PASO {step + 1}/{STEPS.length}
          </span>
          <div style={{
            fontSize: '1.3rem', fontWeight: 700, color: STEPS[step].accent,
            marginTop: '0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
          }}>
            <ActiveStepIcon size={20} strokeWidth={2.2} />
            {STEPS[step].title}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Step content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <StepContent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ST floating button + modal badges */}
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1, marginTop: '0.5rem' }}>
        <STModalBadge symbol="⊬" content="EMERG_SILENCE" title="Silencio sobre emergencia" />
        <STModalBadge symbol="∥" content="ONTO_EPIST_SPLIT" title="Bifurcación onto-epistémica" />
        <STModalBadge symbol="∂" content="CONTINUOUS_EMERG" title="Emergencia continua" />
      </div>
      <STFloatingButton slideId="S12c" />

      {/* Profesor mode note */}
      {profesorMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="st-card"
          style={{ maxWidth: '1100px', width: '100%', fontSize: '1rem', lineHeight: 1.65, position: 'relative', zIndex: 1 }}
        >
          <strong style={{ color: '#ef4444' }}>Nota para la discusión:</strong>{' '}
          <span style={{ color: 'var(--text)' }}>
            Kim (1999) argumentó que la emergencia epistémica sin emergencia ontológica es inestable —
            o el nivel superior es real y causalmente eficaz, o es un epifenómeno.
            Hinton, sin saberlo, cae justo en esta tensión: sus representaciones distribuidas
            son causalmente eficaces (determinan el output) pero supuestamente reducibles a pesos.
            ¿Es <InlineMath math="P" /> real o es un artefacto descriptivo?
            Esta es la pregunta que el paper de 1992 nunca hace — y que nosotros debemos hacer.
          </span>
        </motion.div>
      )}
    </div>
  )
}
