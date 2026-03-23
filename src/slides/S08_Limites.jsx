import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { motion } from 'framer-motion'
import * as THREE from 'three'

// ── Loss surface generation ───────────────────────────────────────────────────
const RES = 60

// Synthetic multi-modal loss surface — multiple local minima
function lossAt(x, y) {
  const base = 0.5 * (Math.sin(x * 2.1) * Math.cos(y * 1.8) + Math.sin(x * 0.9 + 0.5) * Math.cos(y * 2.5))
  const bowl = 0.08 * (x * x + y * y)
  const noise = 0.15 * Math.sin(x * 4.3) * Math.sin(y * 3.7)
  return base + bowl + noise
}

function buildSurface() {
  const positions = []
  const colors    = []
  const indices   = []

  let minZ = Infinity, maxZ = -Infinity
  const zGrid = []

  for (let row = 0; row < RES; row++) {
    for (let col = 0; col < RES; col++) {
      const x = (col / (RES - 1)) * 8 - 4
      const y = (row / (RES - 1)) * 8 - 4
      const z = lossAt(x, y)
      zGrid.push(z)
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
  }

  for (let row = 0; row < RES; row++) {
    for (let col = 0; col < RES; col++) {
      const x = (col / (RES - 1)) * 8 - 4
      const y = (row / (RES - 1)) * 8 - 4
      const z = zGrid[row * RES + col]
      positions.push(x, (z - minZ) / (maxZ - minZ) * 3 - 0.5, y)

      // Color: green (low) → yellow → red (high)
      const t = (z - minZ) / (maxZ - minZ)
      if (t < 0.5) {
        colors.push(t * 2 * 0.9, 0.8, t * 2 * 0.1)
      } else {
        const t2 = (t - 0.5) * 2
        colors.push(0.9, 0.8 * (1 - t2), 0)
      }
    }
  }

  for (let row = 0; row < RES - 1; row++) {
    for (let col = 0; col < RES - 1; col++) {
      const i = row * RES + col
      indices.push(i, i + 1, i + RES)
      indices.push(i + 1, i + RES + 1, i + RES)
    }
  }

  return { positions: new Float32Array(positions), colors: new Float32Array(colors), indices }
}

// ── Gradient descent path simulation ─────────────────────────────────────────
function buildGDPath(startX = 3.2, startY = 3.0, steps = 80, lr = 0.08) {
  const path = []
  let x = startX, y = startY
  const minZ = -Infinity

  for (let s = 0; s < steps; s++) {
    const z = lossAt(x, y)
    const eps = 0.01
    const gx = (lossAt(x + eps, y) - lossAt(x - eps, y)) / (2 * eps)
    const gy = (lossAt(x, y + eps) - lossAt(x, y - eps)) / (2 * eps)
    path.push({ x, y, z, gx, gy })

    // SGD with momentum
    x -= lr * gx + (Math.random() - 0.5) * 0.05
    y -= lr * gy + (Math.random() - 0.5) * 0.05
  }
  return path
}

// ── Loss surface mesh ─────────────────────────────────────────────────────────
function LossSurface() {
  const { positions, colors, indices } = buildSurface()
  const geomRef = useRef()

  return (
    <mesh>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={positions.length / 3} />
        <bufferAttribute attach="attributes-color"    array={colors}    itemSize={3} count={colors.length / 3} />
        <bufferAttribute attach="index" array={new Uint32Array(indices)} itemSize={1} count={indices.length} />
      </bufferGeometry>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.6} metalness={0.05} transparent opacity={0.92} />
    </mesh>
  )
}

// ── Gradient descent ball ─────────────────────────────────────────────────────
const GD_PATH = buildGDPath(3.2, 3.0, 80, 0.09)
const GD_PATH2 = buildGDPath(-1.5, 2.5, 60, 0.1)  // gets stuck in local minimum

function NormalizeZ(z) {
  const zVals = GD_PATH.map(p => p.z)
  const minZ = Math.min(...zVals)
  const maxZ = Math.max(...zVals)
  return (z - minZ) / (maxZ - minZ) * 3 - 0.5
}

function GDTrail({ path, color, label, speed = 0.012 }) {
  const ballRef  = useRef()
  const lightRef = useRef()
  const trailRef = useRef()
  const t        = useRef(0)
  const minZ = Math.min(...path.map(p => p.z))
  const maxZ = Math.max(...path.map(p => p.z))
  const normZ = z => (z - minZ) / (maxZ - minZ) * 3 - 0.5

  useFrame((_, delta) => {
    t.current = (t.current + delta * speed * 60) % path.length
    const i = Math.floor(t.current)
    const frac = t.current - i
    const cur  = path[i]
    const next = path[Math.min(i + 1, path.length - 1)]
    const px = cur.x + (next.x - cur.x) * frac
    const py = cur.y + (next.y - cur.y) * frac
    const pz = cur.z + (next.z - cur.z) * frac

    if (ballRef.current)  ballRef.current.position.set(px, normZ(pz) + 0.15, py)
    if (lightRef.current) lightRef.current.position.set(px, normZ(pz) + 0.5, py)
  })

  return (
    <group>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={2} distance={2} />
      {label && (
        <Html position={[path[0].x, normZ(path[0].z) + 0.6, path[0].y]} distanceFactor={12}>
          <div style={{ color, fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.6)', padding: '1px 5px', borderRadius: '3px' }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Minimum marker ────────────────────────────────────────────────────────────
function MinMarker({ x, z, label, color = '#22c55e' }) {
  const minZ = Math.min(...GD_PATH.map(p => p.z))
  const maxZ = Math.max(...GD_PATH.map(p => p.z))
  const normZ = v => (v - minZ) / (maxZ - minZ) * 3 - 0.5
  const lossVal = lossAt(x, z)

  return (
    <group>
      <mesh position={[x, normZ(lossVal) + 0.05, z]}>
        <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[x, normZ(lossVal) + 0.5, z]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <Html position={[x, normZ(lossVal) + 0.9, z]} distanceFactor={12}>
        <div style={{ color, fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.65)', padding: '1px 5px', borderRadius: '3px', border: `1px solid ${color}44` }}>
          {label}
        </div>
      </Html>
    </group>
  )
}

// ── 3D Scene ──────────────────────────────────────────────────────────────────
function LossScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[-4, 5, -4]} color="#7c6dfa" intensity={1.5} distance={12} />

      <LossSurface />

      {/* Gradient descent balls */}
      <GDTrail path={GD_PATH}  color="#22c55e" label="SGD desde (3.2, 3.0)" speed={0.012} />
      <GDTrail path={GD_PATH2} color="#ef4444" label="SGD atrapado en mínimo local" speed={0.010} />

      {/* Mark minima */}
      <MinMarker x={-0.3} z={0.1}  label="mínimo global" color="#22c55e" />
      <MinMarker x={-1.5} z={2.8}  label="mínimo local" color="#ef4444" />
      <MinMarker x={1.8}  z={-1.2} label="mínimo local" color="#eab308" />

      <OrbitControls enablePan autoRotate autoRotateSpeed={0.3} minDistance={5} maxDistance={20} target={[0, 0.5, 0]} />
    </>
  )
}

// ── Limits list ───────────────────────────────────────────────────────────────
const LIMITS = [
  { n: 1, title: 'Requiere instructor',     color: '#ef4444', desc: <><STTooltip term="aprendizaje_supervisado">Necesita la salida correcta</STTooltip> en cada ejemplo. Alguien (o algún mecanismo) debe inyectar la respuesta de antemano. Esto es insostenible en entornos autónomos.</> },
  { n: 2, title: 'Escalabilidad (O(n³))',           color: '#eab308', desc: <>El tiempo de cálculo crece más rápido que la <STTooltip term="arquitectura">escala de la red</STTooltip>. Entrenar redes inmensas mediante retropropagación estándar satura la computación.</> },
  { n: 3, title: 'Mínimos locales',         color: '#f97316', desc: <>El espacio de <STTooltip term="error">error no convexo</STTooltip> tiene valles locales. El gradiente estocástico (SGD) puede quedar atrapado para siempre.</> },
  { n: 4, title: 'Implausibilidad biológica', color: '#a78bfa', desc: <>Las sinapsis requerirían <STTooltip term="plausibilidad_biologica">circuitos bidireccionales simétricos</STTooltip> para enviar errores hacia atrás. Ningún mecanismo biológico (ej. axones) soporta esto estructuradamente.</> },
]

// ── Main slide ────────────────────────────────────────────────────────────────
import STTooltip from '../components/st/STTooltip'
import STModalBadge from '../components/st/STModalBadge'
import STTensionPanel from '../components/st/STTensionPanel'

export default function S08_Limites({ profesorMode }) {
  const [focusLandscape, setFocusLandscape] = useState(false)

  return (
    <div className="section-slide" style={{ gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Límites Analíticos y Ontológicos de la Retropropagación</div>
        <div className="section-subtitle">Grietas en el Paradigma Conexionista de 1992</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px', fontSize: '1.1rem' }}>
        "Incluso Hinton reconocía sus flaquezas. La retropropagación exige una <STTooltip term="idealizacion">supervisión omnisciente</STTooltip> y asume propiedades arquitectónicas (simetría de pesos bidireccional) que son neurobiológicamente imposibles. ¿Son estas reducciones pragmáticas útiles, o contradicciones fatales?"
      </div>

      {/* Limits grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem', width: '100%', maxWidth: '1100px',
      }}>
        {LIMITS.map((l, i) => (
          <motion.div
            key={l.n}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            onClick={() => l.n === 3 && setFocusLandscape(true)}
            style={{
              background: 'var(--bg-3)',
              border: `1px solid ${l.color}44`,
              borderLeft: `4px solid ${l.color}`,
              borderRadius: '8px', padding: '1rem 1.25rem',
              cursor: l.n === 3 ? 'pointer' : 'default',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.65rem', color: l.color, fontFamily: 'monospace' }}>L{l.n}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-h)' }}>{l.title}</span>
              {l.n === 3 && <span style={{ fontSize: '0.6rem', color: l.color, marginLeft: 'auto' }}>↓ ver 3D</span>}
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{l.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Loss landscape 3D */}
      <div style={{
        width: '100%', maxWidth: '1100px',
        background: 'var(--bg-3)', border: '1px solid var(--border)',
        borderRadius: '10px', overflow: 'hidden',
      }}>
        <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            Espacio de error 3D — superfície de pérdida real con mínimos locales
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>arrastrar para rotar (Canvas 3D)</span>
        </div>
        <div style={{ height: '400px', background: '#04040e' }}>
          <Canvas camera={{ position: [0, 8, 12], fov: 40 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
            <Suspense fallback={null}>
              <color attach="background" args={['#04040e']} />
              <LossScene />
              <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} />
              </EffectComposer>
            </Suspense>
          </Canvas>
        </div>
        <div style={{ padding: '0.4rem 0.75rem', display: 'flex', gap: '1.2rem', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.9rem', color: '#22c55e', fontFamily: 'monospace' }}>● Descenso Gradiente al Mínimo Global</span>
          <span style={{ fontSize: '0.9rem', color: '#ef4444', fontFamily: 'monospace' }}>● Atrapado en Mínimo Local</span>
          <span style={{ fontSize: '0.9rem', color: '#22c55e', fontFamily: 'monospace' }}>▲ Solución Óptima Ideal</span>
        </div>
      </div>

      <STTensionPanel 
        title="La Tensión de la Plausibilidad vs. Utilidad"
        items={[
          { label: "Cálculo Eficiente", status: "yes", desc: "El algoritmo permite a los agentes artificiales generar mapas abstractos complejos." },
          { label: "Exactitud Estructural", status: "no", desc: "Las neuronas biológicas no mandan señales idénticas en reversa. Hinton sacrificó realismo por computabilidad heurística." }
        ]}
      />

      {/* Bridge */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{
          background: 'rgba(124,109,250,0.08)',
          border: '1px solid rgba(124,109,250,0.3)',
          borderRadius: '12px', padding: '1.25rem 2rem',
          maxWidth: '850px', width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1.1rem', color: 'var(--accent-2)', fontStyle: 'italic' }}>
          "Si la dependencia de un instructor y las conexiones simétricas son neurobiológicamente irreales... ¿Será posible que existan redes que puedan descubrir sus propias representaciones de manera autónoma?"
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '0.6rem' }}>
          → Siguiente frontera: Aprendizaje No Supervisado
        </div>
      </motion.div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1100px', width: '100%', fontSize: '1rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Marco ST:</strong>{' '}
          L1–L4 corresponden a fórmulas validadas en{' '}
          <code>06_Critica_Ontologica.st</code>:{' '}
          <code style={{ color: 'var(--yellow)' }}>BACK_IMPL → ¬BACK_BIO</code> (L4),{' '}
          <code style={{ color: 'var(--yellow)' }}>METRIC_UNSTABLE → ¬GOOD_METRIC</code> (L3).
          La superficie 3D muestra por qué L3 es real — el paisaje tiene múltiples valles.
        </div>
      )}
    </div>
  )
}
