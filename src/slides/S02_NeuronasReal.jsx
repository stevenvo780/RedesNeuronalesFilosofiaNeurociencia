import STFloatingButton from "../components/st/STFloatingButton"
import { useRef, useState, useEffect, useImperativeHandle, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import STTooltip from '../components/st/STTooltip'

// ── Shared timing constants ────────────────────────────────────────────────────
const CYCLE      = 4.2   // total cycle duration (seconds)
const DEND_END   = 0.60  // dendrites fully arrive at soma by this fraction
const SOMA_FIRE  = 0.68  // soma fires, AP launches
const AP_END     = 0.98  // AP reaches terminal

// Build a CatmullRom curve from an array of [x,y,z] triples
function makeCurve(pts) {
  return new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)))
}

// ── Dendrite signal (travels TIP → SOMA) ──────────────────────────────────────
function DendriteSignal({ curve, stagger }) {
  const meshRef  = useRef()
  const lightRef = useRef()

  useFrame(({ clock }) => {
    const cycleT = ((clock.elapsedTime / CYCLE) + stagger) % 1
    const visible = cycleT < DEND_END
    if (meshRef.current)  meshRef.current.visible  = visible
    if (lightRef.current) lightRef.current.visible = visible
    if (!visible) return

    const prog  = cycleT / DEND_END          // 0→1 over the dendrite phase
    const pt    = curve.getPointAt(Math.max(0, Math.min(0.999, 1 - prog)))
    meshRef.current?.position.copy(pt)
    lightRef.current?.position.copy(pt)

    const fade = Math.sin(prog * Math.PI)   // bell-shaped: bright in middle
    if (meshRef.current)  meshRef.current.material.opacity = fade * 0.92
    if (lightRef.current) lightRef.current.intensity       = fade * 1.8
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial
          color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={3.5}
          transparent opacity={0.9}
        />
      </mesh>
      <pointLight ref={lightRef} color="#a78bfa" intensity={1.8} distance={1.1} decay={2} />
    </group>
  )
}

// ── Soma — charges up and fires ────────────────────────────────────────────────
function Soma({ selected, onClick }) {
  const bodyRef    = useRef()
  const glowRef    = useRef()
  const nucleusRef = useRef()
  const selectedRef = useRef(selected)
  useEffect(() => { selectedRef.current = selected }, [selected])

  useFrame(({ clock }) => {
    const cycleT = (clock.elapsedTime / CYCLE) % 1
    const sel = selectedRef.current

    // charge fraction: ramps up 0→DEND_END, holds DEND_END→SOMA_FIRE, discharges after
    let charge
    if      (cycleT < DEND_END)  charge = cycleT / DEND_END
    else if (cycleT < SOMA_FIRE) charge = 1
    else                          charge = 1 - (cycleT - SOMA_FIRE) / (1 - SOMA_FIRE)

    charge = Math.max(0, charge)

    if (bodyRef.current) {
      bodyRef.current.material.emissiveIntensity = (sel ? 1.8 : 0.4) + charge * 1.6
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = (sel ? 0.15 : 0.03) + charge * 0.26
    }
    if (nucleusRef.current) {
      nucleusRef.current.rotation.y += 0.008 + charge * 0.012
      nucleusRef.current.material.emissiveIntensity = 0.6 + charge * 1.0
    }
  })

  return (
    <group onClick={onClick}>
      {/* Outer charge glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.96, 32, 32]} />
        <meshStandardMaterial color="#a78bfa" transparent opacity={0.05} depthWrite={false} />
      </mesh>
      {/* Soma body */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[0.68, 32, 32]} />
        <meshStandardMaterial
          color="#7c6dfa" emissive="#4c3dca" emissiveIntensity={0.5}
          roughness={0.22} metalness={0.06}
        />
      </mesh>
      {/* Nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[0.27, 16, 16]} />
        <meshStandardMaterial color="#a78bfa" emissive="#7c5df8" emissiveIntensity={0.7} />
      </mesh>
    </group>
  )
}

// ── Action potential (SOMA_FIRE → AP_END along axon) ──────────────────────────
function ActionPotential({ curve }) {
  const meshRef  = useRef()
  const lightRef = useRef()

  useFrame(({ clock }) => {
    const cycleT = (clock.elapsedTime / CYCLE) % 1
    const active = cycleT >= SOMA_FIRE && cycleT <= AP_END
    if (meshRef.current)  meshRef.current.visible  = active
    if (lightRef.current) lightRef.current.visible = active
    if (!active) return

    const prog = (cycleT - SOMA_FIRE) / (AP_END - SOMA_FIRE)
    const pt   = curve.getPointAt(Math.min(prog, 0.999))
    meshRef.current?.position.copy(pt)
    lightRef.current?.position.copy(pt)
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00d8ff" emissiveIntensity={5} transparent opacity={0.96} />
      </mesh>
      <pointLight ref={lightRef} color="#00eeff" intensity={3} distance={2} decay={2} />
    </group>
  )
}

// ── Synaptic terminals — flash when AP arrives ─────────────────────────────────
function SynapticTerminals({ positions }) {
  const refs = useRef(positions.map(() => null))

  useFrame(({ clock }) => {
    const cycleT = (clock.elapsedTime / CYCLE) % 1
    // Burst: AP_END ± 0.06
    const burst = cycleT > AP_END - 0.05 && cycleT <= 1.0
      ? Math.sin(((cycleT - (AP_END - 0.05)) / 0.09) * Math.PI)
      : 0
    const intensity = 0.9 + burst * 3.5
    refs.current.forEach(m => {
      if (m) m.material.emissiveIntensity = intensity
    })
  })

  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos} ref={el => refs.current[i] = el}>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial color="#eab308" emissive="#eab308" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </>
  )
}

// ── Single tube from start to end ─────────────────────────────────────────────
function TubeSegment({ points, radius = 0.05, color = '#4a4a6a', emissive = '#000', emissiveIntensity = 0 }) {
  const curve = makeCurve(points)
  return (
    <mesh>
      <tubeGeometry args={[curve, Math.max(points.length * 3, 6), radius, 6, false]} />
      <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={0.6} />
    </mesh>
  )
}

// ── Myelin sheath ─────────────────────────────────────────────────────────────
function Myelin({ x }) {
  return (
    <mesh position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.14, 0.14, 0.55, 8]} />
      <meshStandardMaterial color="#d8d8ee" roughness={0.3} transparent opacity={0.88} />
    </mesh>
  )
}

// ── Full neuron scene ─────────────────────────────────────────────────────────
const DENDRITE_PATHS = [
  [[-0.45,  0.45, 0.0], [-1.4,  1.2,  0.3],  [-2.2,  1.7,  0.5]],
  [[-0.45,  0.2,  0.15], [-1.5,  0.5, -0.2], [-2.4,  0.6, -0.5]],
  [[-0.5,  -0.05, 0.0], [-1.6, -0.2,  0.1],  [-2.5, -0.5,  0.3]],
  [[-0.45, -0.35, 0.0], [-1.4, -0.9,  0.0],  [-2.2, -1.5, -0.1]],
  [[-0.3,   0.3, -0.3], [-1.2,  0.8, -0.8],  [-2.0,  1.1, -1.2]],
]

const AXON_CURVE = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.68, 0,    0),
  new THREE.Vector3(1.8,  0.08, 0.05),
  new THREE.Vector3(3.2, -0.04, 0),
  new THREE.Vector3(4.6,  0.05, 0),
  new THREE.Vector3(6.0,  0,    0),
])

const MYELIN_XS = [1.4, 2.2, 3.0, 3.8, 4.6]

const SYN_TERMINALS = [
  [6.1,  0.25,  0.1],
  [6.1, -0.25,  0.0],
  [6.1,  0.0,   0.2],
  [6.1,  0.15, -0.2],
  [6.1, -0.1,  -0.15],
]

// Pre-build sub-branch endpoints (deterministic)
function subbranch(pts, i) {
  return [pts[2], [pts[2][0] - 0.5, pts[2][1] + (i % 2 ? 0.5 : -0.5), pts[2][2] + 0.2]]
}

function NeuronScene({ selected, setSelected }) {
  const dendActive = selected === 'dendrita'

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <pointLight position={[-4, 3, 2]} color="#7c6dfa" intensity={2} distance={10} />
      <pointLight position={[7,  1, 1]} color="#eab308" intensity={1.4} distance={6} />

      {/* ── Dendrites (static tubes + animated signals) ── */}
      {DENDRITE_PATHS.map((pts, i) => (
        <group key={i} onClick={() => setSelected(s => s === 'dendrita' ? null : 'dendrita')}>
          <TubeSegment
            points={pts}
            radius={0.055 - i * 0.005}
            color={dendActive ? '#a78bfa' : '#5a5a8a'}
            emissive={dendActive ? '#7c6dfa' : '#000'}
            emissiveIntensity={dendActive ? 0.6 : 0}
          />
          <TubeSegment
            points={subbranch(pts, i)}
            radius={0.025}
            color={dendActive ? '#a78bfa' : '#4a4a6a'}
            emissive={dendActive ? '#7c6dfa' : '#000'}
            emissiveIntensity={dendActive ? 0.4 : 0}
          />
          {/* Animated signal pulse: tip → soma */}
          <DendriteSignal curve={makeCurve(pts)} stagger={i * 0.11} />
        </group>
      ))}

      {/* ── Soma ── */}
      <Soma selected={selected === 'soma'} onClick={() => setSelected(s => s === 'soma' ? null : 'soma')} />

      {/* ── Axon hillock ── */}
      <mesh position={[0.9, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.45, 8]} />
        <meshStandardMaterial color="#5a5aaa" emissive="#3a3a88" emissiveIntensity={0.3} />
      </mesh>

      {/* ── Axon ── */}
      <group onClick={() => setSelected(s => s === 'axon' ? null : 'axon')}>
        <mesh>
          <tubeGeometry args={[AXON_CURVE, 40, 0.065, 8, false]} />
          <meshStandardMaterial
            color={selected === 'axon' ? '#06d4f0' : '#06b6d4'}
            emissive={selected === 'axon' ? '#04a0b0' : '#024a58'}
            emissiveIntensity={selected === 'axon' ? 0.8 : 0.25}
          />
        </mesh>
      </group>

      {/* ── Myelin sheaths ── */}
      {MYELIN_XS.map(x => <Myelin key={x} x={x} />)}

      {/* ── Action potential ── */}
      <ActionPotential curve={AXON_CURVE} />

      {/* ── Synaptic terminals ── */}
      <group onClick={() => setSelected(s => s === 'sinapsis' ? null : 'sinapsis')}>
        <SynapticTerminals positions={SYN_TERMINALS} />
      </group>

      {/* ── Labels ── */}
      <Html position={[-2.2, 2.1, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#a78bfa', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap', background: 'rgba(5,5,15,0.80)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #a78bfa44' }}>
          Dendritas
        </div>
      </Html>
      <Html position={[0, -1.05, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#7c6dfa', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.80)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #7c6dfa44' }}>
          Soma + Núcleo
        </div>
      </Html>
      <Html position={[3.5, 0.55, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#06b6d4', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.80)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #06b6d444' }}>
          Axón + Mielina
        </div>
      </Html>
      <Html position={[6.3, 0.6, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#eab308', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.80)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #eab30844' }}>
          Botones sinápticos
        </div>
      </Html>
      <Html position={[4.5, -0.6, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#00f5ff', fontSize: '10px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.80)', padding: '2px 6px', borderRadius: '4px' }}>
          ⚡ potencial de acción
        </div>
      </Html>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={18}
        autoRotate
        autoRotateSpeed={0.35}
        target={[2, 0, 0]}
      />
    </>
  )
}

// ── Slide ─────────────────────────────────────────────────────────────────────
const PARTS = [
  { id: 'dendrita', label: 'Dendrita',  color: '#a78bfa',
    info: 'Recibe señales de otras neuronas. La suma de entradas ponderadas determina si el soma se activa. Análogo artificial: el vector de entrada x.' },
  { id: 'soma',     label: 'Soma',      color: '#7c6dfa',
    info: 'Integra todas las señales. Si la suma supera el umbral → dispara el potencial de acción. Análogo: la función de activación f(Wx + b).' },
  { id: 'axon',     label: 'Axón',      color: '#06b6d4',
    info: 'Conduce el potencial de acción. La mielina acelera la conducción saltatoria entre nodos de Ranvier. Análogo: la salida escalar de la unidad.' },
  { id: 'sinapsis', label: 'Sinapsis',  color: '#eab308',
    info: 'Transmite la señal a la siguiente neurona mediante neurotransmisores. La eficacia sináptica cambia con el aprendizaje. Análogo: el peso w.' },
]

// ── Signal flow legend ─────────────────────────────────────────────────────────
const FLOW_STEPS = [
  { label: '① Señal dendrítica',  color: '#a78bfa', desc: 'Pulsos viajan tip → soma' },
  { label: '② Integración soma',  color: '#7c6dfa', desc: 'Se carga hasta umbral'   },
  { label: '③ Potencial de acción', color: '#00f5ff', desc: 'Disparo por el axón'  },
  { label: '④ Liberación sináptica', color: '#eab308', desc: 'Flash en terminales' },
]

export default function S02_NeuronasReal({ profesorMode, ref }) {
  const [selected, setSelected] = useState(null)
  // Step-by-step: track which parts have been visited (unlocks next in sequence)
  const [visited, setVisited] = useState(new Set())
  const partOrder = PARTS.map(p => p.id)

  // ── Sub-step navigation via arrow keys / remote ──
  const STEP_IDS = [null, ...partOrder]          // [null, 'dendrita', 'soma', 'axon', 'sinapsis']
  const stepRef = useRef(0)                       // 0 = initial (nothing selected via nav)

  useImperativeHandle(ref, () => ({
    advanceStep() {
      if (stepRef.current >= STEP_IDS.length - 1) return false
      stepRef.current++
      const id = STEP_IDS[stepRef.current]
      if (id) {
        setSelected(id)
        setVisited(prev => { const n = new Set(prev); n.add(id); return n })
      }
      return true
    },
    retreatStep() {
      if (stepRef.current <= 0) return false
      stepRef.current--
      const id = STEP_IDS[stepRef.current]
      setSelected(id)   // null when step 0
      return true
    },
  }))

  const handlePartClick = (id) => {
    setSelected(s => s === id ? null : id)
    setVisited(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    // Sync stepRef so arrow-key nav stays coherent with clicks
    const idx = STEP_IDS.indexOf(id)
    if (idx > stepRef.current) stepRef.current = idx
  }

  // Next suggested step in sequence
  const nextStep = partOrder.find(id => !visited.has(id)) || null

  const info = PARTS.find(p => p.id === selected)

  return (
    <div className="section-slide" style={{ gap: '1.25rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="section-title">Ontología Biológica Básica (Realidad Material)</div>
        <div className="section-subtitle">El Sustrato Natural (Neuronas Físicas 3D)</div>
      </div>

      <div className="quote" style={{ maxWidth: '900px', fontSize: '1.1rem' }}>
        "Antes de someter al cerebro a la <STTooltip term="idealizacion">idealización reduccionista</STTooltip> de 1992, debemos contemplar la asombrosa complejidad geométrica y electroquímica que la máquina descarta."
      </div>

      {/* 3D Canvas */}
      <div style={{
        width: '100%', maxWidth: '1000px', height: '370px',
        borderRadius: '10px', overflow: 'hidden',
        border: '1px solid var(--border)', background: '#04040e',
        position: 'relative',
      }}>
        <Canvas camera={{ position: [2, 1.5, 9], fov: 42 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Suspense fallback={null}>
            <color attach="background" args={['#04040e']} />
            <NeuronScene selected={selected} setSelected={setSelected} />
            <EffectComposer disableNormalPass>
              <Bloom luminanceThreshold={0.18} mipmapBlur luminanceSmoothing={0.08} intensity={1.8} />
            </EffectComposer>
          </Suspense>
        </Canvas>
        <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.65rem', color: '#ffffff44', fontFamily: 'monospace' }}>
          clic en las partes · arrastrar para rotar
        </div>
      </div>

      {/* Signal flow legend */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px', width: '100%' }}>
        {FLOW_STEPS.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-3)', border: `1px solid ${s.color}44`,
            borderRadius: '8px', padding: '0.4rem 0.9rem',
            flex: '1 1 160px',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: s.color }}>{s.label}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Part selector buttons — sequential unlock */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {PARTS.map((p) => {
          const active = selected === p.id
          const done   = visited.has(p.id)
          const isNext = p.id === nextStep
          return (
            <button
              key={p.id}
              onClick={() => handlePartClick(p.id)}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                border: `1px solid ${active ? p.color : done ? p.color + '66' : isNext ? p.color + '55' : 'var(--border)'}`,
                background: active ? `${p.color}22` : 'var(--bg-3)',
                color: active ? p.color : done ? p.color + 'aa' : 'var(--text-dim)',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.25s',
                position: 'relative',
                boxShadow: isNext && !active ? `0 0 8px ${p.color}33` : 'none',
              }}
            >
              {done && !active && <span style={{ marginRight: '0.3rem', fontSize: '0.7rem' }}>✓</span>}
              {isNext && !active && !done && <span style={{ marginRight: '0.3rem', fontSize: '0.7rem' }}>›</span>}
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Info panel */}
      {info && (
        <div style={{
          maxWidth: '1000px', width: '100%',
          background: 'var(--bg-3)',
          border: `1px solid ${info.color}55`,
          borderLeft: `4px solid ${info.color}`,
          borderRadius: '8px',
          padding: '1rem 1.5rem',
          fontSize: '1rem',
          color: 'var(--text)',
          lineHeight: 1.65,
          transition: 'all 0.2s',
        }}>
          {info.info}
        </div>
      )}

      {/* Scale comparison */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', maxWidth: '1000px', width: '100%', justifyContent: 'center' }}>
        {[
          { label: 'Cerebro humano', color: '#a78bfa', items: ['~86 mil millones de neuronas', '~100 billones de sinapsis', 'geometría 3D compleja', 'dinámica electroquímica', 'plasticidad continua'] },
          { label: 'Red de Hinton (1992)', color: '#7c6dfa', items: ['~100–1000 unidades', 'miles de pesos (floats)', 'grafo dirigido acíclico', 'aritmética matricial', 'aprendizaje por épocas'] },
        ].map(col => (
          <div key={col.label} style={{
            flex: '1 1 220px', background: 'var(--bg-3)',
            border: `1px solid ${col.color}44`, borderTop: `3px solid ${col.color}`,
            borderRadius: '8px', padding: '0.75rem 1rem',
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: col.color, marginBottom: '0.5rem' }}>{col.label}</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
              {col.items.map((it, i) => (
                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.55 }}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
        <div style={{
          flex: '1 1 220px', background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.25)', borderTop: '3px solid #ef4444',
          borderRadius: '8px', padding: '0.75rem 1rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.4rem' }}>Brecha de escala</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.55, margin: 0 }}>
            La convergencia de Andersen-Zipser ocurre a pesar de esta diferencia de 8 órdenes de magnitud.
            ¿Qué significa que emerjan representaciones similares en sistemas tan distintos?
          </p>
        </div>
      </div>

      <STFloatingButton />

      {/* Key insight */}
      <div className="st-card" style={{ maxWidth: '1000px', width: '100%' }}>
        <p style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent-2)' }}>El conocimiento no es un archivo almacenado, sino una disposición estructural latente.</span>{' '}
          La cognición reside holográficamente en la conectividad material codificada materialmente entre infinitas uniones de <STTooltip term="sinapsis">sinapsis</STTooltip>.
          Aprender implica alterar esta topología micro-conductora.
        </p>
        {profesorMode && (
          <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            Hinton ejecutó una <STTooltip term="idealizacion">reducción funcional</STTooltip> estricta. Intercambió fidelidad anatómica por manejabilidad algebraica, reduciendo química y geometría pura para poder diferenciar derivativamente matrices enteras de aprendizaje <STTooltip term="conexionismo">conexionista</STTooltip>.
          </div>
        )}
      </div>
    </div>
  )
}
