import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import STTooltip from '../components/st/STTooltip'
import STFloatingButton from '../components/st/STFloatingButton'

// ── Loss surface ───────────────────────────────────────────────────────────────
const RES = 64

function lossAt(x, y) {
  const base = 0.5 * (Math.sin(x * 2.1) * Math.cos(y * 1.8) + Math.sin(x * 0.9 + 0.5) * Math.cos(y * 2.5))
  const bowl = 0.08 * (x * x + y * y)
  const noise = 0.15 * Math.sin(x * 4.3) * Math.sin(y * 3.7)
  return base + bowl + noise
}

function buildSurface() {
  const positions = [], colors = [], indices = []
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
      positions.push(x, (z - minZ) / (maxZ - minZ) * 3.2 - 0.3, y)

      // Cosmic palette: deep indigo valleys → violet → bright cyan-white peaks (blooms!)
      const t = (z - minZ) / (maxZ - minZ)
      if (t < 0.42) {
        const s = t / 0.42
        colors.push(0.04 + s * 0.36, 0.02 + s * 0.08, 0.45 + s * 0.40)
      } else if (t < 0.74) {
        const s = (t - 0.42) / 0.32
        colors.push(0.40 + s * 0.25, 0.10 + s * 0.45, 0.85 - s * 0.05)
      } else {
        const s = (t - 0.74) / 0.26
        colors.push(0.65 + s * 0.35, 0.55 + s * 0.45, 0.80 + s * 0.20)
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

function buildGDPath(startX, startY, steps = 80, lr = 0.09) {
  const path = []
  let x = startX, y = startY
  for (let s = 0; s < steps; s++) {
    const z = lossAt(x, y)
    const eps = 0.01
    const gx = (lossAt(x + eps, y) - lossAt(x - eps, y)) / (2 * eps)
    const gy = (lossAt(x, y + eps) - lossAt(x, y - eps)) / (2 * eps)
    path.push({ x, y, z, gx, gy })
    x -= lr * gx + (Math.random() - 0.5) * 0.04
    y -= lr * gy + (Math.random() - 0.5) * 0.04
  }
  return path
}

// ── 3D Components ──────────────────────────────────────────────────────────────
function LossSurface() {
  const { positions, colors, indices } = buildSurface()
  return (
    <mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} count={positions.length / 3} />
        <bufferAttribute attach="attributes-color"    array={colors}    itemSize={3} count={colors.length / 3} />
        <bufferAttribute attach="index" array={new Uint32Array(indices)} itemSize={1} count={indices.length} />
      </bufferGeometry>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.3}
        metalness={0.25}
        transparent
        opacity={0.94}
      />
    </mesh>
  )
}

const GD_PATH  = buildGDPath(3.2, 3.0, 85, 0.09)
const GD_PATH2 = buildGDPath(-1.5, 2.5, 60, 0.1)

function GDTrail({ path, color, label, speed = 0.012 }) {
  const ballRef  = useRef()
  const lightRef = useRef()
  const t        = useRef(0)
  const minZ = Math.min(...path.map(p => p.z))
  const maxZ = Math.max(...path.map(p => p.z))
  const normZ = z => (z - minZ) / (maxZ - minZ) * 3.2 - 0.3

  useFrame((_, delta) => {
    t.current = (t.current + delta * speed * 60) % path.length
    const i    = Math.floor(t.current)
    const frac = t.current - i
    const cur  = path[i]
    const next = path[Math.min(i + 1, path.length - 1)]
    const px = cur.x + (next.x - cur.x) * frac
    const py = cur.y + (next.y - cur.y) * frac
    const pz = cur.z + (next.z - cur.z) * frac
    if (ballRef.current)  ballRef.current.position.set(px, normZ(pz) + 0.18, py)
    if (lightRef.current) lightRef.current.position.set(px, normZ(pz) + 0.6, py)
  })

  return (
    <group>
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={2.5} distance={2.5} />
      {label && (
        <Html position={[path[path.length - 1].x, normZ(path[path.length - 1].z) + 0.9, path[path.length - 1].y]} distanceFactor={12}>
          <div style={{ color, fontSize: '9px', fontFamily: 'monospace', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.75)', padding: '1px 5px', borderRadius: '3px', border: `1px solid ${color}66` }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  )
}

function MinMarker({ x, z, label, color }) {
  const minZ = Math.min(...GD_PATH.map(p => p.z))
  const maxZ = Math.max(...GD_PATH.map(p => p.z))
  const normZ = v => (v - minZ) / (maxZ - minZ) * 3.2 - 0.3
  const lossVal = lossAt(x, z)
  const baseY = normZ(lossVal)

  return (
    <group>
      <mesh position={[x, baseY + 0.45, z]}>
        <cylinderGeometry args={[0.07, 0.07, 0.9, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <mesh position={[x, baseY + 0.95, z]}>
        <sphereGeometry args={[0.13, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
      </mesh>
      <Html position={[x, baseY + 1.35, z]} distanceFactor={12}>
        <div style={{ color, fontSize: '9px', fontFamily: 'monospace', whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.75)', padding: '1px 5px', borderRadius: '3px' }}>
          {label}
        </div>
      </Html>
    </group>
  )
}

function LossScene() {
  return (
    <>
      <fog attach="fog" args={['#04040e', 14, 24]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[0, 12, 4]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-5, 5, -5]} color="#7c6dfa" intensity={5}  distance={16} />
      <pointLight position={[5,  4,  5]} color="#06b6d4" intensity={3.5} distance={12} />
      <pointLight position={[0,  2,  0]} color="#a855f7" intensity={2}  distance={8} />

      <LossSurface />

      <GDTrail path={GD_PATH}  color="#00f5ff" label="SGD → mínimo global" speed={0.013} />
      <GDTrail path={GD_PATH2} color="#ff7700" label="SGD atrapado en mínimo local" speed={0.010} />

      <MinMarker x={-0.3} z={0.1}  label="mínimo global ✓" color="#22c55e" />
      <MinMarker x={-1.5} z={2.8}  label="mínimo local ✗"  color="#ef4444" />
      <MinMarker x={1.8}  z={-1.2} label="mínimo local ✗"  color="#eab308" />

      <OrbitControls enablePan autoRotate autoRotateSpeed={0.4} minDistance={5} maxDistance={20} target={[0, 0.8, 0]} />
    </>
  )
}

// ── O(n³) complexity curve ──────────────────────────────────────────────────────
function ComplexityCurve() {
  const ref = useRef(null)
  const anim = useRef({ t: 0 })

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let raf
    let W = 0, H = 0

    const setSize = () => {
      const nw = canvas.offsetWidth * 2
      const nh = canvas.offsetHeight * 2
      if (nw !== W || nh !== H) { W = nw; H = nh; canvas.width = W; canvas.height = H }
    }
    setSize()
    const ro = new ResizeObserver(setSize); ro.observe(canvas)

    const draw = () => {
      if (!W || !H) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      ctx.save()
      ctx.scale(2, 2)
      const w = W / 2, h = H / 2
      ctx.clearRect(0, 0, w, h)

      // Background
      ctx.fillStyle = '#04040e'
      ctx.fillRect(0, 0, w, h)

      const pad = { l: 52, r: 16, t: 30, b: 32 }
      const pw = w - pad.l - pad.r
      const ph = h - pad.t - pad.b

      // Sweep progress
      anim.current.t += 0.003
      if (anim.current.t > 1.6) anim.current.t = 0
      const sweep = Math.min(anim.current.t, 1)

      // Grid
      ctx.strokeStyle = 'rgba(124,109,250,0.08)'
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 5; i++) {
        const x = pad.l + (i / 5) * pw
        ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ph); ctx.stroke()
        const y = pad.t + (i / 5) * ph
        ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke()
      }

      // Axis labels
      ctx.fillStyle = 'rgba(167,139,250,0.6)'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('tamaño de red (n)', pad.l + pw / 2, h - 6)
      ctx.save()
      ctx.translate(12, pad.t + ph / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText('costo computacional', 0, 0)
      ctx.restore()

      // n labels
      const ns = [10, 50, 100, 200, 500]
      ns.forEach((n, i) => {
        const x = pad.l + ((i + 0.5) / ns.length) * pw
        ctx.fillStyle = 'rgba(167,139,250,0.4)'
        ctx.fillText(n, x, pad.t + ph + 14)
      })

      // Curves
      const maxN = 500
      const maxVal = Math.pow(maxN, 3)
      const curves = [
        { fn: n => n, color: '#22c55e', label: 'O(n)', dash: [4, 3] },
        { fn: n => n * n, color: '#eab308', label: 'O(n²)', dash: [] },
        { fn: n => n * n * n, color: '#ef4444', label: 'O(n³)', dash: [], width: 2.5 },
      ]

      const steps = 120
      const sweepIdx = Math.floor(sweep * steps)

      curves.forEach(c => {
        ctx.beginPath()
        ctx.strokeStyle = c.color
        ctx.lineWidth = c.width || 1.5
        ctx.setLineDash(c.dash || [])
        let lastX = 0, lastY = 0
        for (let i = 0; i <= sweepIdx; i++) {
          const n = (i / steps) * maxN
          const val = c.fn(n)
          const x = pad.l + (i / steps) * pw
          const y = pad.t + ph - (val / maxVal) * ph
          if (i === 0) ctx.moveTo(x, Math.max(y, pad.t))
          else ctx.lineTo(x, Math.max(y, pad.t))
          lastX = x; lastY = Math.max(y, pad.t)
        }
        ctx.stroke()
        ctx.setLineDash([])

        // Label at curve end
        if (sweepIdx > 10) {
          ctx.fillStyle = c.color
          ctx.font = 'bold 9px monospace'
          ctx.textAlign = 'left'
          const labelY = Math.max(lastY - 4, pad.t + 8)
          ctx.fillText(c.label, lastX + 4, labelY)
        }
      })

      // Sweep line
      if (sweep < 1) {
        const sx = pad.l + sweep * pw
        ctx.strokeStyle = 'rgba(124,109,250,0.5)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(sx, pad.t); ctx.lineTo(sx, pad.t + ph); ctx.stroke()
        ctx.setLineDash([])
      }

      // Danger zone label
      if (sweep > 0.5) {
        const alpha = Math.min((sweep - 0.5) * 2, 1)
        ctx.fillStyle = `rgba(239,68,68,${alpha * 0.15})`
        const dangerX = pad.l + 0.55 * pw
        ctx.fillRect(dangerX, pad.t, pad.l + pw - dangerX, ph)
        ctx.fillStyle = `rgba(239,68,68,${alpha * 0.7})`
        ctx.font = 'bold 9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('zona intratable', pad.l + 0.77 * pw, pad.t + 16)
      }

      ctx.restore()
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
}

// ── Limits data ────────────────────────────────────────────────────────────────
const LIMITS = [
  {
    n: 1, title: 'Requiere instructor', color: '#ef4444',
    brief: 'Necesita una respuesta correcta inyectada externamente en cada ejemplo.',
    desc: <><STTooltip term="aprendizaje_supervisado">Necesita la salida correcta</STTooltip> en cada ejemplo. Alguien (o algún mecanismo) debe inyectar la respuesta de antemano. Esto es insostenible en entornos autónomos o en el desarrollo biológico, donde no existe un "maestro omnisciente".</>,
  },
  {
    n: 2, title: 'Escalabilidad O(n³)', color: '#eab308',
    brief: 'El costo computacional crece con el cubo del tamaño de la red.',
    desc: <>El tiempo de cálculo crece más rápido que la <STTooltip term="arquitectura">escala de la red</STTooltip>. Entrenar redes inmensas mediante retropropagación estándar satura la computación. El cerebro con 86B neuronas necesita otro mecanismo.</>,
  },
  {
    n: 3, title: 'Mínimos locales', color: '#f97316',
    brief: 'El SGD puede quedar atrapado para siempre en valles subóptimos.',
    desc: <>El espacio de <STTooltip term="error">error no convexo</STTooltip> tiene valles locales. El gradiente estocástico (SGD) puede quedar atrapado definitivamente — como ilustra la superficie 3D. La bola naranja no escapa del valle local.</>,
  },
  {
    n: 4, title: 'Implausibilidad biológica', color: '#a78bfa',
    brief: 'Las neuronas biológicas no pueden enviar señales de error hacia atrás.',
    desc: <>Las sinapsis requerirían <STTooltip term="plausibilidad_biologica">circuitos bidireccionales simétricos</STTooltip> para propagar errores hacia atrás. Ningún mecanismo biológico conocido (axones, neurotransmisores) soporta esta simetría estructural.</>,
  },
]

// ── Slide ──────────────────────────────────────────────────────────────────────
export default function S08_Limites({ profesorMode }) {
  const [activeLimit, setActiveLimit] = useState(null)

  return (
    <div className="section-slide" style={{ gap: '1.4rem' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Límites Analíticos y Ontológicos de la Retropropagación</div>
        <div className="section-subtitle">Grietas en el Paradigma Conexionista de 1992</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px', fontSize: '1.05rem' }}>
        "Incluso Hinton reconocía sus flaquezas. La retropropagación exige una <STTooltip term="idealizacion">supervisión omnisciente</STTooltip> y asume propiedades arquitectónicas (simetría de pesos bidireccional) que son neurobiológicamente imposibles. ¿Son estas reducciones pragmáticas útiles, o contradicciones fatales?"
      </div>

      {/* L-cards — accordion */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.75rem',
        width: '100%',
        maxWidth: '1100px',
        alignItems: 'stretch',
      }}>
        {LIMITS.map((l, i) => {
          const isOpen = activeLimit === l.n
          return (
            <motion.div
              key={l.n}
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 260, damping: 22 }}
              onClick={() => setActiveLimit(isOpen ? null : l.n)}
              whileHover={{ scale: 1.02, boxShadow: `0 0 18px ${l.color}22` }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isOpen ? `rgba(${hexRgb(l.color)},0.08)` : 'var(--bg-3)',
                border: `1px solid ${isOpen ? l.color + 'aa' : l.color + '44'}`,
                borderTop: `3px solid ${l.color}`,
                borderRadius: '8px',
                padding: '0.75rem 0.85rem',
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <span style={{
                  fontSize: '0.6rem', color: l.color, fontFamily: 'monospace', fontWeight: 700,
                  background: `${l.color}22`, padding: '1px 6px', borderRadius: '3px', flexShrink: 0,
                }}>L{l.n}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-h)', flex: 1, lineHeight: 1.2 }}>{l.title}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{ fontSize: '0.65rem', color: l.color, lineHeight: 1, flexShrink: 0 }}
                >▼</motion.span>
              </div>
              {/* Teaser */}
              <p style={{
                fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4, margin: 0,
                fontStyle: 'italic', flex: 1,
              }}>
                {l.brief}
              </p>
              {/* Expanded detail */}
              <AnimatePresence mode="wait">
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      paddingTop: '0.6rem',
                      marginTop: '0.5rem',
                      borderTop: `1px solid ${l.color}33`,
                    }}>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>{l.desc}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Visualizations 2-col grid: Loss landscape + O(n³) curve */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        width: '100%',
        maxWidth: '1100px',
      }}>
        {/* Left: Loss landscape 3D (L3) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 22 }}
          style={{
            background: '#04040e',
            border: '1px solid rgba(124,109,250,0.3)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 0 24px rgba(124,109,250,0.1)',
          }}
        >
          <div style={{
            padding: '0.35rem 0.7rem',
            borderBottom: '1px solid rgba(124,109,250,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(124,109,250,0.04)',
          }}>
            <span style={{ fontSize: '0.62rem', color: '#a78bfa', fontFamily: 'monospace' }}>
              L3 · Superficie de pérdida 3D
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>arrastrar para rotar</span>
          </div>
          <div style={{ height: '280px' }}>
            <Canvas camera={{ position: [1, 10, 12], fov: 45 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
              <Suspense fallback={null}>
                <color attach="background" args={['#04040e']} />
                <LossScene />
                <EffectComposer disableNormalPass>
                  <Bloom luminanceThreshold={0.15} mipmapBlur luminanceSmoothing={0.1} intensity={2.0} />
                </EffectComposer>
              </Suspense>
            </Canvas>
          </div>
          <div style={{ padding: '0.3rem 0.7rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', borderTop: '1px solid rgba(124,109,250,0.15)' }}>
            <span style={{ fontSize: '0.65rem', color: '#00f5ff', fontFamily: 'monospace' }}>● SGD global</span>
            <span style={{ fontSize: '0.65rem', color: '#ff7700', fontFamily: 'monospace' }}>● SGD atrapado</span>
            <span style={{ fontSize: '0.65rem', color: '#22c55e', fontFamily: 'monospace' }}>▲ mín. global</span>
            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontFamily: 'monospace' }}>▲ mín. local</span>
          </div>
        </motion.div>

        {/* Right: O(n³) complexity curve (L2) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 22 }}
          style={{
            background: '#04040e',
            border: '1px solid rgba(234,179,8,0.3)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 0 24px rgba(234,179,8,0.08)',
          }}
        >
          <div style={{
            padding: '0.35rem 0.7rem',
            borderBottom: '1px solid rgba(234,179,8,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'rgba(234,179,8,0.04)',
          }}>
            <span style={{ fontSize: '0.62rem', color: '#eab308', fontFamily: 'monospace' }}>
              L2 · Escalabilidad O(n³) — costo vs tamaño de red
            </span>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>animación cíclica</span>
          </div>
          <div style={{ height: '280px' }}>
            <ComplexityCurve />
          </div>
          <div style={{ padding: '0.3rem 0.7rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', borderTop: '1px solid rgba(234,179,8,0.15)' }}>
            <span style={{ fontSize: '0.65rem', color: '#22c55e', fontFamily: 'monospace' }}>— O(n)</span>
            <span style={{ fontSize: '0.65rem', color: '#eab308', fontFamily: 'monospace' }}>— O(n²)</span>
            <span style={{ fontSize: '0.65rem', color: '#ef4444', fontFamily: 'monospace', fontWeight: 700 }}>— O(n³)</span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(239,68,68,0.6)', fontFamily: 'monospace' }}>zona intratable</span>
          </div>
        </motion.div>
      </div>

      <STFloatingButton />

      {/* Alternativa: Hebb */}
      <div style={{
        background: 'rgba(34,197,94,0.05)',
        border: '1px solid rgba(34,197,94,0.22)',
        borderLeft: '4px solid #22c55e',
        borderRadius: '0 10px 10px 0',
        padding: '1rem 1.5rem',
        maxWidth: '1100px',
        width: '100%',
      }}>
        <div style={{ fontSize: '0.72rem', color: '#22c55e', fontFamily: 'monospace', marginBottom: '0.45rem', letterSpacing: '0.08em' }}>
          ALTERNATIVA BIOLÓGICAMENTE PLAUSIBLE — REGLA DE HEBB (1949)
        </div>
        <p style={{ fontSize: '0.93rem', color: 'var(--text)', lineHeight: 1.65, margin: 0 }}>
          <span style={{ color: 'var(--text-h)', fontStyle: 'italic' }}>"Neuronas que se disparan juntas, se conectan juntas."</span>{' '}
          El aprendizaje hebbiano no requiere señal de error externa ni simetría de pesos — solo
          correlación local entre activaciones pre y post sináptica. Oja (1982) demostró que el{' '}
          <strong style={{ color: '#22c55e' }}>Análisis de Componentes Principales (PCA)</strong>{' '}
          puede implementarse con reglas hebbianas locales. Es más lento y menos preciso que la
          retropropagación, pero <em>biológicamente plausible</em>.
        </p>
      </div>

      {/* Bridge */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        style={{
          background: 'rgba(124,109,250,0.07)',
          border: '1px solid rgba(124,109,250,0.3)',
          borderRadius: '12px', padding: '1.1rem 2rem',
          maxWidth: '850px', width: '100%', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1.05rem', color: 'var(--accent-2)', fontStyle: 'italic', lineHeight: 1.65 }}>
          "Si la dependencia de un instructor y las conexiones simétricas son neurobiológicamente irreales... ¿Será posible que existan redes que puedan descubrir sus propias representaciones de manera autónoma?"
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
          → Siguiente frontera: Aprendizaje No Supervisado
        </div>
      </motion.div>

      {profesorMode && (
        <div className="st-card" style={{ maxWidth: '1100px', width: '100%', fontSize: '1rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--accent-2)' }}>Marco ST:</strong>{' '}
          L1–L4 corresponden a fórmulas en{' '}
          <code>06_Critica_Ontologica.st</code>:{' '}
          <code style={{ color: 'var(--yellow)' }}>BACK_IMPL → ¬BACK_BIO</code> (L4),{' '}
          <code style={{ color: 'var(--yellow)' }}>METRIC_UNSTABLE → ¬GOOD_METRIC</code> (L3).
          La bola naranja en el espacio 3D ilustra L3 — el SGD queda atrapado en el valle local izquierdo.
        </div>
      )}
    </div>
  )
}

function hexRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '124,109,250'
}
