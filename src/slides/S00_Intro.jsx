import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { ExternalLink, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import * as THREE from 'three'

const PUBLIC_URL = 'https://hinton.stevenvallejo.com/'

// ── Deterministic pseudo-random ─────────────────────────────────────────────
function prng(seed) {
  let s = seed ^ 0xdeadbeef
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b)
  return ((s ^ (s >>> 16)) >>> 0) / 0xffffffff
}

// Box-Muller — normal distribution N(0,1)
function randn(s1, s2) {
  const u = Math.max(prng(s1), 1e-9)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * prng(s2))
}

// ── Brain-region clusters: [cx, cy, cz, sx, sy, sz, count] ──────────────────
const CLUSTERS = [
  [-2.4,  0.7,  1.4,  0.70, 0.60, 0.70, 14],
  [-2.9, -0.1,  0.2,  0.55, 0.65, 0.60, 11],
  [-2.3,  1.2, -0.4,  0.70, 0.55, 0.70, 11],
  [-1.9,  0.2, -1.8,  0.60, 0.60, 0.55,  9],
  [ 2.4,  0.7,  1.4,  0.70, 0.60, 0.70, 14],
  [ 2.9, -0.1,  0.2,  0.55, 0.65, 0.60, 11],
  [ 2.3,  1.2, -0.4,  0.70, 0.55, 0.70, 11],
  [ 1.9,  0.2, -1.8,  0.60, 0.60, 0.55,  9],
  [ 0.0, -1.7, -1.9,  1.10, 0.55, 0.65, 16],
]

// ── Generate positions ───────────────────────────────────────────────────────
const POSITIONS = CLUSTERS.flatMap(([cx, cy, cz, sx, sy, sz, n], ci) =>
  Array.from({ length: n }, (_, j) => {
    const b = ci * 1000 + j * 7
    return [
      cx + randn(b+1, b+2) * sx,
      cy + randn(b+3, b+4) * sy,
      cz + randn(b+5, b+6) * sz,
    ]
  })
)
const N = POSITIONS.length

// ── Per-node floating offsets (each node has unique phase & amplitude) ────────
const NODE_ANIM = POSITIONS.map((_, i) => ({
  phaseX: prng(i * 137 + 1) * Math.PI * 2,
  phaseY: prng(i * 137 + 2) * Math.PI * 2,
  phaseZ: prng(i * 137 + 3) * Math.PI * 2,
  freqX:  0.15 + prng(i * 137 + 4) * 0.25,
  freqY:  0.12 + prng(i * 137 + 5) * 0.20,
  freqZ:  0.10 + prng(i * 137 + 6) * 0.22,
  ampX:   0.06 + prng(i * 137 + 7) * 0.12,
  ampY:   0.05 + prng(i * 137 + 8) * 0.10,
  ampZ:   0.06 + prng(i * 137 + 9) * 0.12,
}))

// ── Edges ────────────────────────────────────────────────────────────────────
const MAX_D = 2.8
const EDGES = []
for (let a = 0; a < N; a++) {
  for (let b = a + 1; b < N; b++) {
    const dx = POSITIONS[a][0] - POSITIONS[b][0]
    const dy = POSITIONS[a][1] - POSITIONS[b][1]
    const dz = POSITIONS[a][2] - POSITIONS[b][2]
    if (dx*dx + dy*dy + dz*dz < MAX_D * MAX_D) EDGES.push([a, b])
  }
}

// ── Circular glow sprite texture ─────────────────────────────────────────────
function makeGlowTexture(size = 128) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const half = size / 2
  // Outer glow
  const g1 = ctx.createRadialGradient(half, half, 0, half, half, half)
  g1.addColorStop(0, 'rgba(180,160,255,1)')
  g1.addColorStop(0.15, 'rgba(140,120,250,0.9)')
  g1.addColorStop(0.4, 'rgba(100,80,220,0.35)')
  g1.addColorStop(0.7, 'rgba(60,40,180,0.08)')
  g1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, size, size)
  // Bright core
  const g2 = ctx.createRadialGradient(half, half, 0, half, half, half * 0.22)
  g2.addColorStop(0, 'rgba(255,255,255,1)')
  g2.addColorStop(0.5, 'rgba(200,190,255,0.8)')
  g2.addColorStop(1, 'rgba(140,120,250,0)')
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// ── Pulse glow sprite ────────────────────────────────────────────────────────
function makePulseTexture(size = 64) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const half = size / 2
  const g = ctx.createRadialGradient(half, half, 0, half, half, half)
  g.addColorStop(0, 'rgba(220,214,254,1)')
  g.addColorStop(0.25, 'rgba(167,139,250,0.7)')
  g.addColorStop(0.6, 'rgba(124,109,250,0.15)')
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

// ── Main 3D scene ────────────────────────────────────────────────────────────
function NeuralScene() {
  const { gl } = useThree()

  const autoFlyRef      = useRef(true)
  const lastInteractRef = useRef(-Infinity)
  const autoBaseRef     = useRef({ t0: 0, yaw0: 0 })
  const userCamRef      = useRef({ yaw: 0, pitch: 0.1, dist: 10 })
  const dragRef         = useRef({ active: false, x: 0, y: 0 })

  // Sprite textures (created once)
  const glowTex  = useMemo(() => makeGlowTexture(), [])
  const pulseTex = useMemo(() => makePulseTexture(), [])

  // ── Manual drag / zoom ──
  useEffect(() => {
    const canvas = gl.domElement
    const onDown = (e) => {
      dragRef.current = { active: true, x: e.clientX, y: e.clientY }
      lastInteractRef.current = performance.now()
      autoFlyRef.current = false
    }
    const onMove = (e) => {
      if (!dragRef.current.active) return
      const dx = e.clientX - dragRef.current.x
      const dy = e.clientY - dragRef.current.y
      userCamRef.current.yaw  -= dx * 0.006
      userCamRef.current.pitch = Math.max(-1.1, Math.min(1.1,
        userCamRef.current.pitch - dy * 0.006))
      dragRef.current.x = e.clientX
      dragRef.current.y = e.clientY
      lastInteractRef.current = performance.now()
    }
    const onUp    = () => { dragRef.current.active = false }
    const onWheel = (e) => {
      userCamRef.current.dist = Math.max(4, Math.min(28,
        userCamRef.current.dist + e.deltaY * 0.02))
      autoFlyRef.current = false
      lastInteractRef.current = performance.now()
    }

    canvas.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    canvas.addEventListener('wheel',     onWheel, { passive: true })
    return () => {
      canvas.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
      canvas.removeEventListener('wheel',     onWheel)
    }
  }, [gl])

  // ── Per-edge pulse state (more pulses per edge, staggered) ──
  const pulseState = useMemo(() =>
    EDGES.flatMap((_, i) => {
      const count = 1 + Math.floor(prng(i * 31 + 99) * 2) // 1-2 pulses per edge
      return Array.from({ length: count }, (_, k) => ({
        edge: i,
        t:    (i * 0.618034 + k * 0.37) % 1,
        spd:  0.001 + prng(i * 31 + k * 17 + 5) * 0.004,
        size: 0.18 + prng(i * 31 + k * 17 + 8) * 0.22,
      }))
    })
  , [])

  // ── Animated node positions buffer ──
  const livePos = useMemo(() => new Float32Array(N * 3), [])

  // ── Static geometries ──
  const { nodeGeo, edgeGeo, pulseGeo, nodeSizes } = useMemo(() => {
    const npos  = new Float32Array(N * 3)
    const ncol  = new Float32Array(N * 3)
    const sizes = new Float32Array(N)
    POSITIONS.forEach(([x, y, z], i) => {
      npos[i*3] = x; npos[i*3+1] = y; npos[i*3+2] = z
      const b = 0.55 + prng(i * 4219) * 0.45
      ncol[i*3] = 0.50 * b; ncol[i*3+1] = 0.40 * b; ncol[i*3+2] = b
      sizes[i] = 0.35 + prng(i * 3141) * 0.30
    })
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(npos, 3))
    nodeGeo.setAttribute('color',    new THREE.BufferAttribute(ncol, 3))
    nodeGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1))

    const epos = new Float32Array(EDGES.length * 6)
    EDGES.forEach(([a, b], i) => {
      const [ax,ay,az] = POSITIONS[a], [bx,by,bz] = POSITIONS[b]
      epos[i*6]=ax; epos[i*6+1]=ay; epos[i*6+2]=az
      epos[i*6+3]=bx; epos[i*6+4]=by; epos[i*6+5]=bz
    })
    const edgeGeo = new THREE.BufferGeometry()
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(epos, 3))

    const ppos    = new Float32Array(pulseState.length * 3)
    const pSizes  = new Float32Array(pulseState.length)
    const pulseGeo = new THREE.BufferGeometry()
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3))
    pulseGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1))

    return { nodeGeo, edgeGeo, pulseGeo, nodeSizes: sizes }
  }, [pulseState])

  useFrame(({ clock, camera }) => {
    const t   = clock.elapsedTime
    const now = performance.now()

    // ── Resume auto-fly after 4 s idle ──
    if (!dragRef.current.active && now - lastInteractRef.current > 4000 && !autoFlyRef.current) {
      autoFlyRef.current = true
      autoBaseRef.current = { t0: t, yaw0: userCamRef.current.yaw }
    }

    // ── Update live node positions (floating / breathing) ──
    const npos = nodeGeo.attributes.position.array
    const eSrc = edgeGeo.attributes.position.array
    POSITIONS.forEach(([bx, by, bz], i) => {
      const a = NODE_ANIM[i]
      const x = bx + Math.sin(t * a.freqX + a.phaseX) * a.ampX
      const y = by + Math.sin(t * a.freqY + a.phaseY) * a.ampY
      const z = bz + Math.sin(t * a.freqZ + a.phaseZ) * a.ampZ
      npos[i*3] = x; npos[i*3+1] = y; npos[i*3+2] = z
      livePos[i*3] = x; livePos[i*3+1] = y; livePos[i*3+2] = z
    })
    nodeGeo.attributes.position.needsUpdate = true

    // ── Update edge endpoints to follow floating nodes ──
    EDGES.forEach(([a, b], i) => {
      eSrc[i*6]   = livePos[a*3];   eSrc[i*6+1] = livePos[a*3+1]; eSrc[i*6+2] = livePos[a*3+2]
      eSrc[i*6+3] = livePos[b*3];   eSrc[i*6+4] = livePos[b*3+1]; eSrc[i*6+5] = livePos[b*3+2]
    })
    edgeGeo.attributes.position.needsUpdate = true

    // ── Camera: steady close orbit ──
    if (autoFlyRef.current) {
      const dt     = t - autoBaseRef.current.t0
      const angle  = autoBaseRef.current.yaw0 + dt * 0.08
      // Fixed close distance with very subtle breathing
      const dist   = 8.2 + Math.sin(t * 0.05) * 0.3
      // Gentle vertical sway
      const h      = Math.sin(t * 0.03) * 1.2
      camera.position.set(Math.sin(angle) * dist, h, Math.cos(angle) * dist)
      camera.lookAt(0, 0, 0)
      userCamRef.current.yaw   = angle
      userCamRef.current.pitch = Math.asin(Math.max(-0.99, Math.min(0.99, h / dist)))
      userCamRef.current.dist  = dist
    } else {
      const { yaw, pitch, dist } = userCamRef.current
      camera.position.set(
        Math.cos(pitch) * Math.sin(yaw) * dist,
        Math.sin(pitch) * dist,
        Math.cos(pitch) * Math.cos(yaw) * dist,
      )
      camera.lookAt(0, 0, 0)
    }

    // ── Pulse positions ──
    const pAttr  = pulseGeo.attributes.position.array
    const pSizes = pulseGeo.attributes.size.array
    pulseState.forEach((p, idx) => {
      p.t = (p.t + p.spd) % 1
      const [a, b] = EDGES[p.edge]
      const ax = livePos[a*3], ay = livePos[a*3+1], az = livePos[a*3+2]
      const bx = livePos[b*3], by = livePos[b*3+1], bz = livePos[b*3+2]
      pAttr[idx*3]   = ax + (bx-ax) * p.t
      pAttr[idx*3+1] = ay + (by-ay) * p.t
      pAttr[idx*3+2] = az + (bz-az) * p.t
      // Pulse size peaks at center of travel, fades at endpoints
      const envelope = Math.sin(p.t * Math.PI)
      pSizes[idx] = p.size * (0.4 + 0.6 * envelope)
    })
    pulseGeo.attributes.position.needsUpdate = true
    pulseGeo.attributes.size.needsUpdate = true

    // ── Node brightness pulse + size breathing ──
    const col   = nodeGeo.attributes.color.array
    const sAttr = nodeGeo.attributes.size.array
    POSITIONS.forEach((_, i) => {
      const ph    = (i * 2.71828) % (Math.PI * 2)
      const pulse = 0.5 + 0.5 * Math.sin(t * (0.35 + (i % 11) * 0.07) + ph)
      const b     = 0.40 + pulse * 0.60
      col[i*3]   = 0.50 * b
      col[i*3+1] = 0.40 * b
      col[i*3+2] = b
      // Size breathing
      sAttr[i] = nodeSizes[i] * (0.85 + 0.30 * pulse)
    })
    nodeGeo.attributes.color.needsUpdate = true
    nodeGeo.attributes.size.needsUpdate = true
  })

  return (
    <>
      <points geometry={nodeGeo}>
        <pointsMaterial
          map={glowTex}
          vertexColors
          size={0.55}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color="#7c6dfa" transparent opacity={0.12} />
      </lineSegments>
      <points geometry={pulseGeo}>
        <pointsMaterial
          map={pulseTex}
          color="#ddd6fe"
          size={0.40}
          sizeAttenuation
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}

// ── Slide ────────────────────────────────────────────────────────────────────
export default function S00_Intro() {
  const [qrOpen, setQrOpen] = useState(false)

  useEffect(() => {
    if (!qrOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setQrOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [qrOpen])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#020212', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 2, 10], fov: 68 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020212']} />
        <NeuralScene />
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom luminanceThreshold={0.12} mipmapBlur luminanceSmoothing={0.25} intensity={1.7} radius={0.7} />
        </EffectComposer>
      </Canvas>

      <div style={{
        position: 'absolute',
        top: 18,
        right: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.7rem',
        zIndex: 3,
      }}>
        <button
          onClick={() => setQrOpen(v => !v)}
          style={{
            border: '1px solid rgba(167,139,250,0.3)',
            background: 'rgba(10,10,18,0.72)',
            color: 'var(--text-h)',
            backdropFilter: 'blur(14px)',
            borderRadius: '14px',
            padding: '0.7rem 0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            cursor: 'pointer',
            boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
            minWidth: '220px',
            justifyContent: 'space-between',
          }}
          aria-label={qrOpen ? 'Ocultar acceso QR' : 'Mostrar acceso QR'}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(167,139,250,0.14)',
              color: 'var(--accent-2)',
              flexShrink: 0,
            }}>
              <QrCode size={18} strokeWidth={2} />
            </span>
            <span style={{ textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700 }}>
                Acceso móvil
              </span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                Mostrar QR para que lo escaneen
              </span>
            </span>
          </span>
          <span style={{
            color: qrOpen ? 'var(--accent-2)' : 'var(--text-dim)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {qrOpen ? <X size={17} strokeWidth={2.2} /> : <ExternalLink size={17} strokeWidth={2.2} />}
          </span>
        </button>

      </div>

      {qrOpen && (
        <div
          onClick={() => setQrOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(1rem, 4vw, 2rem)',
            background: 'rgba(2, 2, 18, 0.42)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div style={{
            width: 'min(1200px, 100%)',
            minHeight: 'min(82vh, 760px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: '1.2rem',
            background: 'linear-gradient(180deg, rgba(10,10,18,0.56) 0%, rgba(18,18,32,0.48) 100%)',
            border: '1px solid rgba(167,139,250,0.18)',
            borderRadius: '30px',
            padding: 'clamp(1.1rem, 2.4vw, 1.8rem)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.32)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <button
              onClick={(event) => {
                event.stopPropagation()
                setQrOpen(false)
              }}
              aria-label="Cerrar acceso QR"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} strokeWidth={2.2} />
            </button>

            <div style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap-reverse',
              gap: 'clamp(2rem, 5vw, 6rem)',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                alignItems: 'flex-start',
                textAlign: 'left',
                minWidth: 0,
              }}>
                <div style={{
                  fontSize: '0.76rem',
                  color: 'rgba(167,139,250,0.86)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Acceso rápido desde el móvil
                </div>

                <a
                  href={PUBLIC_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: 'clamp(1rem, 2.2vw, 1.5rem)',
                    borderRadius: '24px',
                    border: '1px solid rgba(167,139,250,0.22)',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'var(--text-h)',
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                    lineHeight: 1.12,
                    boxShadow: '0 14px 40px rgba(0,0,0,0.18)',
                  }}
                >
                  <div style={{
                    fontSize: '0.74rem',
                    color: 'rgba(240,240,255,0.56)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '0.55rem',
                  }}>
                    URL pública
                  </div>
                  <div style={{
                    fontSize: 'clamp(2rem, 4.8vw, 3.9rem)',
                    fontWeight: 800,
                    color: 'var(--text-h)',
                    letterSpacing: '-0.04em',
                  }}>
                    hinton.stevenvallejo.com
                  </div>
                </a>

                <div style={{
                  fontSize: 'clamp(1rem, 1.45vw, 1.15rem)',
                  color: 'rgba(240,240,255,0.72)',
                  lineHeight: 1.5,
                  maxWidth: '44ch',
                }}>
                  Si alguien igual quiere escribirla, ahora es corta. Pero el camino preferido sigue siendo el QR: sacar cámara, escanear y entrar.
                </div>

                <div style={{
                  fontSize: 'clamp(0.86rem, 1.1vw, 0.96rem)',
                  color: 'rgba(240,240,255,0.48)',
                  lineHeight: 1.5,
                  maxWidth: '48ch',
                }}>
                  El QR está optimizado para verse grande en pantalla completa. Pulsa fuera del modal o presiona <strong style={{ color: 'rgba(240,240,255,0.75)' }}>Esc</strong> para cerrarlo.
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 0,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 'clamp(0.9rem, 1.6vw, 1.15rem)',
                  background: 'rgba(255,255,255,0.96)',
                  borderRadius: '26px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.18)',
                }}>
                  <QRCodeSVG
                    value={PUBLIC_URL}
                    size={380}
                    bgColor="#ffffff"
                    fgColor="#111118"
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 18, right: 18,
        fontSize: '0.6rem', color: 'rgba(167,139,250,0.38)',
        fontFamily: 'monospace', pointerEvents: 'none',
        letterSpacing: '0.08em',
      }}>
        arrastrar · zoom · tomar control
      </div>
    </div>
  )
}
