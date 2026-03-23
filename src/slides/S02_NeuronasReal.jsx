import STTensionPanel from "../components/st/STTensionPanel"
import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import STTooltip from '../components/st/STTooltip'

// ── Action potential (glowing ball moving along axon) ─────────────────────────
function ActionPotential({ curve }) {
  const meshRef  = useRef()
  const lightRef = useRef()
  const t        = useRef(0)

  useFrame((_, delta) => {
    t.current = (t.current + delta * 0.35) % 1
    if (!curve) return
    const pt = curve.getPointAt(t.current)
    meshRef.current?.position.copy(pt)
    if (lightRef.current) lightRef.current.position.copy(pt)
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#00f5ff" emissive="#00d8ff" emissiveIntensity={4} transparent opacity={0.95} />
      </mesh>
      <pointLight ref={lightRef} color="#00eeff" intensity={2.5} distance={1.8} decay={2} />
    </group>
  )
}

// ── Single tube from start to end ─────────────────────────────────────────────
function TubeSegment({ points, radius = 0.05, color = '#4a4a6a', emissive = '#000', emissiveIntensity = 0 }) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
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

// ── Soma (cell body) ──────────────────────────────────────────────────────────
function Soma({ selected, onClick }) {
  const ref = useRef()
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.3 })

  return (
    <group onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshStandardMaterial color="#7c6dfa" transparent opacity={selected ? 0.15 : 0.06} />
      </mesh>
      {/* Soma body */}
      <mesh>
        <sphereGeometry args={[0.68, 32, 32]} />
        <meshStandardMaterial
          color="#7c6dfa"
          emissive="#4c3dca"
          emissiveIntensity={selected ? 1.8 : 0.5}
          roughness={0.25}
          metalness={0.05}
        />
      </mesh>
      {/* Nucleus */}
      <mesh ref={ref}>
        <sphereGeometry args={[0.27, 16, 16]} />
        <meshStandardMaterial color="#a78bfa" emissive="#7c5df8" emissiveIntensity={0.7} />
      </mesh>
    </group>
  )
}

// ── Full neuron scene ─────────────────────────────────────────────────────────
function NeuronScene({ selected, setSelected }) {
  const axonCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.68, 0,    0),
    new THREE.Vector3(1.8,  0.08, 0.05),
    new THREE.Vector3(3.2, -0.04, 0),
    new THREE.Vector3(4.6,  0.05, 0),
    new THREE.Vector3(6.0,  0,    0),
  ])

  const dendritePaths = [
    [[-0.45,  0.45, 0], [-1.4,  1.2,  0.3],  [-2.2,  1.7,  0.5]],
    [[-0.45,  0.2,  0.15], [-1.5,  0.5,  -0.2], [-2.4,  0.6, -0.5]],
    [[-0.5,  -0.05, 0], [-1.6, -0.2,  0.1],  [-2.5, -0.5,  0.3]],
    [[-0.45, -0.35, 0], [-1.4, -0.9,  0],    [-2.2, -1.5, -0.1]],
    [[-0.3,   0.3, -0.3], [-1.2, 0.8, -0.8], [-2.0,  1.1, -1.2]],
  ]

  const myelinXs = [1.4, 2.2, 3.0, 3.8, 4.6]

  const synTerminals = [
    [6.1,  0.25,  0.1],
    [6.1, -0.25,  0.0],
    [6.1,  0.0,   0.2],
    [6.1,  0.15, -0.2],
    [6.1, -0.1,  -0.15],
  ]

  const dendActive = selected === 'dendrita'
  const synActive  = selected === 'sinapsis'

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-4, 3, 2]} color="#7c6dfa" intensity={2} distance={10} />
      <pointLight position={[7, 1, 1]} color="#eab308" intensity={1.5} distance={6} />

      {/* Dendrites */}
      {dendritePaths.map((pts, i) => (
        <group key={i} onClick={() => setSelected(s => s === 'dendrita' ? null : 'dendrita')}>
          <TubeSegment
            points={pts}
            radius={0.055 - i * 0.005}
            color={dendActive ? '#a78bfa' : '#5a5a8a'}
            emissive={dendActive ? '#7c6dfa' : '#000'}
            emissiveIntensity={dendActive ? 0.6 : 0}
          />
          {/* Sub-branch */}
          <TubeSegment
            points={[pts[2], [pts[2][0] - 0.5, pts[2][1] + (i % 2 ? 0.5 : -0.5), pts[2][2] + 0.2]]}
            radius={0.025}
            color={dendActive ? '#a78bfa' : '#4a4a6a'}
            emissive={dendActive ? '#7c6dfa' : '#000'}
            emissiveIntensity={dendActive ? 0.4 : 0}
          />
        </group>
      ))}

      {/* Soma */}
      <Soma selected={selected === 'soma'} onClick={() => setSelected(s => s === 'soma' ? null : 'soma')} />

      {/* Axon hillock (cone connecting soma to axon) */}
      <mesh position={[0.9, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.45, 8]} />
        <meshStandardMaterial color="#5a5aaa" emissive="#3a3a88" emissiveIntensity={0.3} />
      </mesh>

      {/* Axon */}
      <group onClick={() => setSelected(s => s === 'axon' ? null : 'axon')}>
        <mesh>
          <tubeGeometry args={[axonCurve, 40, 0.065, 8, false]} />
          <meshStandardMaterial
            color={selected === 'axon' ? '#06d4f0' : '#06b6d4'}
            emissive={selected === 'axon' ? '#04a0b0' : '#024a58'}
            emissiveIntensity={selected === 'axon' ? 0.8 : 0.25}
          />
        </mesh>
      </group>

      {/* Myelin sheaths */}
      {myelinXs.map(x => <Myelin key={x} x={x} />)}

      {/* Action potential */}
      <ActionPotential curve={axonCurve} />

      {/* Synaptic terminals */}
      <group onClick={() => setSelected(s => s === 'sinapsis' ? null : 'sinapsis')}>
        {synTerminals.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.13, 12, 12]} />
            <meshStandardMaterial
              color="#eab308"
              emissive="#eab308"
              emissiveIntensity={synActive ? 2.5 : 0.9}
            />
          </mesh>
        ))}
      </group>

      {/* Labels */}
      <Html position={[-2.2, 2.1, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#a78bfa', fontSize: '11px', fontFamily: 'monospace', whiteSpace: 'nowrap', background: 'rgba(5,5,15,0.75)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #a78bfa44' }}>
          Dendritas
        </div>
      </Html>
      <Html position={[0, -1.1, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#7c6dfa', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.75)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #7c6dfa44' }}>
          Soma + Núcleo
        </div>
      </Html>
      <Html position={[3.5, 0.55, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#06b6d4', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.75)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #06b6d444' }}>
          Axón + Mielina
        </div>
      </Html>
      <Html position={[6.3, 0.6, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#eab308', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.75)', padding: '2px 7px', borderRadius: '4px', border: '1px solid #eab30844' }}>
          Botones sinápticos
        </div>
      </Html>
      <Html position={[4.5, -0.55, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div style={{ color: '#00f5ff', fontSize: '10px', fontFamily: 'monospace', background: 'rgba(5,5,15,0.75)', padding: '2px 6px', borderRadius: '4px' }}>
          ⚡ potencial de acción
        </div>
      </Html>

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={18}
        autoRotate
        autoRotateSpeed={0.4}
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

export default function S02_NeuronasReal({ profesorMode }) {
  const [selected, setSelected] = useState(null)
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
        width: '100%', maxWidth: '1000px', height: '360px',
        borderRadius: '10px', overflow: 'hidden',
        border: '1px solid var(--border)', background: '#04040e',
        position: 'relative',
      }}>
        <Canvas camera={{ position: [2, 1.5, 9], fov: 42 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
          <Suspense fallback={null}>
            <color attach="background" args={['#04040e']} />
            <NeuronScene selected={selected} setSelected={setSelected} />
            <EffectComposer disableNormalPass>
              <Bloom luminanceThreshold={0.2} mipmapBlur luminanceSmoothing={0.1} intensity={1.5} />
            </EffectComposer>
          </Suspense>
        </Canvas>
        <div style={{ position: 'absolute', top: 8, right: 10, fontSize: '0.65rem', color: '#ffffff44', fontFamily: 'monospace' }}>
          clic en las partes · arrastrar para rotar
        </div>
      </div>

      {/* Part selector buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {PARTS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(s => s === p.id ? null : p.id)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              border: `1px solid ${selected === p.id ? p.color : 'var(--border)'}`,
              background: selected === p.id ? `${p.color}22` : 'var(--bg-3)',
              color: selected === p.id ? p.color : 'var(--text-dim)',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
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
      
      <STTensionPanel 
        title="Reducción Ontológica Neuronal"
        items={[
          { label: "Temporalidad Compleja", status: "no", desc: "El timing exacto de los picos de acción electroquímicos se ignora (salvo en SNNs modernas)." },
          { label: "Plasticidad Sináptica", status: "yes", desc: "El cambio en la 'eficacia' sináptica (pesos matemáticos) se mantiene como matriz central." }
        ]}
      />

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
