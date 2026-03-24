import { useEffect, useRef } from 'react'

function parseLifePattern(rows) {
  const coords = []
  rows.forEach((row, y) => {
    Array.from(row).forEach((cell, x) => {
      if (cell === 'O') coords.push([x, y])
    })
  })
  return coords
}

const LIFE_PATTERNS = {
  glider: parseLifePattern([
    '.O.',
    '..O',
    'OOO',
  ]),
  lwss: parseLifePattern([
    'O..O.',
    '....O',
    'O...O',
    '.OOOO',
  ]),
  acorn: parseLifePattern([
    '.O.....',
    '...O...',
    'OO..OOO',
  ]),
  rPentomino: parseLifePattern([
    '.OO',
    'OO.',
    '.O.',
  ]),
  pulsar: parseLifePattern([
    '..OOO...OOO..',
    '.............',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '..OOO...OOO..',
    '.............',
    '..OOO...OOO..',
    'O....O.O....O',
    'O....O.O....O',
    'O....O.O....O',
    '.............',
    '..OOO...OOO..',
  ]),
  gosperGun: parseLifePattern([
    '........................O...........',
    '......................O.O...........',
    '............OO......OO............OO',
    '...........O...O....OO............OO',
    'OO........O.....O...OO..............',
    'OO........O...O.OO....O.O...........',
    '..........O.....O.......O...........',
    '...........O...O....................',
    '............OO......................',
  ]),
}

const LIFE_PALETTE = [190, 248, 268, 148, 42, 332]

export default function ConwayLifeBg() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let frameId = 0
    let W = 0
    let H = 0
    let cols = 0
    let rows = 0
    let cellSize = 10
    let offsetX = 0
    let offsetY = 0
    let current = new Uint8Array(0)
    let next = new Uint8Array(0)
    let ages = new Uint8Array(0)
    let nextAges = new Uint8Array(0)
    let energy = new Float32Array(0)
    let nextEnergy = new Float32Array(0)
    let hues = new Float32Array(0)
    let nextHues = new Float32Array(0)
    let generation = 0
    let lastTs = 0
    let accumulator = 0
    const stepMs = 92

    const wrapX = (x) => (x + cols) % cols
    const wrapY = (y) => (y + rows) % rows
    const toIndex = (x, y) => wrapY(y) * cols + wrapX(x)

    const setCell = (x, y, hue, age = 1, intensity = 1) => {
      const index = toIndex(x, y)
      current[index] = 1
      ages[index] = age
      energy[index] = Math.max(energy[index], intensity)
      hues[index] = hue
    }

    const stampPattern = (pattern, originX, originY, { hue, flipX = false, flipY = false } = {}) => {
      pattern.forEach(([px, py]) => {
        const x = flipX ? originX - px : originX + px
        const y = flipY ? originY - py : originY + py
        setCell(x, y, hue)
      })
    }

    const averageNeighborHue = (x, y) => {
      let sumX = 0
      let sumY = 0
      let count = 0

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue
          const index = toIndex(x + dx, y + dy)
          if (!current[index]) continue
          const angle = (hues[index] / 180) * Math.PI
          sumX += Math.cos(angle)
          sumY += Math.sin(angle)
          count++
        }
      }

      if (!count) return LIFE_PALETTE[(x + y + generation) % LIFE_PALETTE.length]

      const angle = Math.atan2(sumY / count, sumX / count)
      return (angle * 180) / Math.PI < 0 ? (angle * 180) / Math.PI + 360 : (angle * 180) / Math.PI
    }

    const seedGarden = () => {
      current.fill(0)
      next.fill(0)
      ages.fill(0)
      nextAges.fill(0)
      energy.fill(0)
      nextEnergy.fill(0)
      hues.fill(0)
      nextHues.fill(0)
      generation = 0

      stampPattern(LIFE_PATTERNS.gosperGun, Math.round(cols * 0.06), Math.round(rows * 0.16), { hue: LIFE_PALETTE[0] })
      stampPattern(LIFE_PATTERNS.gosperGun, Math.round(cols * 0.94), Math.round(rows * 0.74), { hue: LIFE_PALETTE[1], flipX: true })
      stampPattern(LIFE_PATTERNS.pulsar, Math.round(cols * 0.28), Math.round(rows * 0.6), { hue: LIFE_PALETTE[2] })
      stampPattern(LIFE_PATTERNS.pulsar, Math.round(cols * 0.72), Math.round(rows * 0.28), { hue: LIFE_PALETTE[3] })
      stampPattern(LIFE_PATTERNS.acorn, Math.round(cols * 0.48), Math.round(rows * 0.44), { hue: LIFE_PALETTE[4] })
      stampPattern(LIFE_PATTERNS.rPentomino, Math.round(cols * 0.58), Math.round(rows * 0.54), { hue: LIFE_PALETTE[5] })
      stampPattern(LIFE_PATTERNS.lwss, Math.round(cols * 0.18), Math.round(rows * 0.82), { hue: LIFE_PALETTE[0] })
      stampPattern(LIFE_PATTERNS.lwss, Math.round(cols * 0.82), Math.round(rows * 0.12), { hue: LIFE_PALETTE[2], flipX: true })
      stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.45), Math.round(rows * 0.18), { hue: LIFE_PALETTE[3] })
      stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.6), Math.round(rows * 0.8), { hue: LIFE_PALETTE[4], flipX: true, flipY: true })

      // Four extra corner colonies keep the field alive from the edges inward.
      stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.08), Math.round(rows * 0.1), { hue: LIFE_PALETTE[5] })
      stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.92), Math.round(rows * 0.1), { hue: LIFE_PALETTE[1], flipX: true })
      stampPattern(LIFE_PATTERNS.lwss, Math.round(cols * 0.1), Math.round(rows * 0.88), { hue: LIFE_PALETTE[3] })
      stampPattern(LIFE_PATTERNS.lwss, Math.round(cols * 0.9), Math.round(rows * 0.88), { hue: LIFE_PALETTE[0], flipX: true })
    }

    const pulseGarden = () => {
      const phase = Math.floor(generation / 160) % 6
      if (phase === 0) {
        stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.12), Math.round(rows * 0.46), { hue: LIFE_PALETTE[0] })
        stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.88), Math.round(rows * 0.52), { hue: LIFE_PALETTE[1], flipX: true })
      } else if (phase === 1) {
        stampPattern(LIFE_PATTERNS.rPentomino, Math.round(cols * 0.42), Math.round(rows * 0.26), { hue: LIFE_PALETTE[5] })
        stampPattern(LIFE_PATTERNS.acorn, Math.round(cols * 0.64), Math.round(rows * 0.68), { hue: LIFE_PALETTE[4] })
      } else if (phase === 2) {
        stampPattern(LIFE_PATTERNS.lwss, Math.round(cols * 0.2), Math.round(rows * 0.22), { hue: LIFE_PALETTE[2] })
        stampPattern(LIFE_PATTERNS.lwss, Math.round(cols * 0.82), Math.round(rows * 0.78), { hue: LIFE_PALETTE[3], flipX: true })
      } else if (phase === 3) {
        stampPattern(LIFE_PATTERNS.pulsar, Math.round(cols * 0.5), Math.round(rows * 0.18), { hue: LIFE_PALETTE[1] })
      } else if (phase === 4) {
        stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.34), Math.round(rows * 0.74), { hue: LIFE_PALETTE[0], flipY: true })
        stampPattern(LIFE_PATTERNS.glider, Math.round(cols * 0.68), Math.round(rows * 0.24), { hue: LIFE_PALETTE[3] })
      } else {
        stampPattern(LIFE_PATTERNS.acorn, Math.round(cols * 0.5), Math.round(rows * 0.54), { hue: LIFE_PALETTE[2] })
      }
    }

    const resize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.floor(W * dpr)
      canvas.height = Math.floor(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cellSize = Math.max(8, Math.floor(Math.min(W / 160, H / 90)))
      cols = Math.max(84, Math.floor(W / cellSize))
      rows = Math.max(48, Math.floor(H / cellSize))
      offsetX = (W - cols * cellSize) / 2
      offsetY = (H - rows * cellSize) / 2

      const total = cols * rows
      current = new Uint8Array(total)
      next = new Uint8Array(total)
      ages = new Uint8Array(total)
      nextAges = new Uint8Array(total)
      energy = new Float32Array(total)
      nextEnergy = new Float32Array(total)
      hues = new Float32Array(total)
      nextHues = new Float32Array(total)
      seedGarden()
    }

    const stepLife = () => {
      generation++
      let population = 0

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = toIndex(x, y)
          let neighbors = 0

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue
              neighbors += current[toIndex(x + dx, y + dy)]
            }
          }

          const alive = current[index] === 1
          const survives = alive && (neighbors === 2 || neighbors === 3)
          const born = !alive && neighbors === 3
          const nextAlive = survives || born
          next[index] = nextAlive ? 1 : 0

          if (nextAlive) {
            population++
            nextAges[index] = alive ? Math.min(ages[index] + 1, 32) : 1
            nextEnergy[index] = alive
              ? Math.min(1.15, energy[index] * 0.88 + 0.22)
              : 1
            nextHues[index] = alive ? hues[index] : averageNeighborHue(x, y)
          } else {
            nextAges[index] = 0
            nextEnergy[index] = Math.max(0, energy[index] * 0.88 - 0.03)
            nextHues[index] = hues[index]
          }
        }
      }

      ;[current, next] = [next, current]
      ;[ages, nextAges] = [nextAges, ages]
      ;[energy, nextEnergy] = [nextEnergy, energy]
      ;[hues, nextHues] = [nextHues, hues]

      if (generation % 160 === 0 || population < cols * rows * 0.014) {
        pulseGarden()
      }
    }

    const draw = (ts) => {
      if (!W || !H) {
        frameId = requestAnimationFrame(draw)
        return
      }

      if (!lastTs) lastTs = ts
      accumulator += ts - lastTs
      lastTs = ts

      while (accumulator >= stepMs) {
        stepLife()
        accumulator -= stepMs
      }

      const t = ts * 0.001
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#030410')
      bg.addColorStop(0.5, '#06081a')
      bg.addColorStop(1, '#090512')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      const ambientA = ctx.createRadialGradient(W * 0.28, H * 0.32, 0, W * 0.28, H * 0.32, W * 0.38)
      ambientA.addColorStop(0, 'rgba(124,109,250,0.12)')
      ambientA.addColorStop(1, 'rgba(124,109,250,0)')
      ctx.fillStyle = ambientA
      ctx.fillRect(0, 0, W, H)

      const ambientB = ctx.createRadialGradient(W * 0.74, H * 0.7, 0, W * 0.74, H * 0.7, W * 0.34)
      ambientB.addColorStop(0, 'rgba(6,182,212,0.1)')
      ambientB.addColorStop(1, 'rgba(6,182,212,0)')
      ctx.fillStyle = ambientB
      ctx.fillRect(0, 0, W, H)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const index = y * cols + x
          const intensity = energy[index]
          if (intensity < 0.04) continue

          const alive = current[index] === 1
          const hue = hues[index] || LIFE_PALETTE[(x + y) % LIFE_PALETTE.length]
          const age = ages[index]
          const px = offsetX + x * cellSize
          const py = offsetY + y * cellSize
          const pulse = 0.82 + 0.18 * Math.sin(t * 2.2 + x * 0.09 + y * 0.05)
          const size = cellSize * (alive ? (0.62 + Math.min(age, 10) * 0.02) : (0.35 + intensity * 0.18)) * pulse
          const pad = (cellSize - size) / 2
          const alpha = alive ? Math.min(0.85, 0.18 + intensity * 0.52) : intensity * 0.16

          if (alive || intensity > 0.24) {
            ctx.fillStyle = `hsla(${hue}, 100%, 62%, ${alpha * 0.28})`
            ctx.fillRect(px + pad - cellSize * 0.14, py + pad - cellSize * 0.14, size + cellSize * 0.28, size + cellSize * 0.28)
          }

          ctx.fillStyle = alive
            ? `hsla(${hue}, 100%, ${60 + Math.min(age, 10) * 1.4}%, ${alpha})`
            : `hsla(${hue}, 82%, 46%, ${alpha})`
          ctx.fillRect(px + pad, py + pad, size, size)

          if (alive && age > 5) {
            ctx.fillStyle = 'rgba(255,255,255,0.14)'
            ctx.fillRect(px + pad + size * 0.18, py + pad + size * 0.18, size * 0.15, size * 0.15)
          }
        }
      }

      const vignette = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.24, W / 2, H / 2, Math.max(W, H) * 0.76)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.5)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)

      frameId = requestAnimationFrame(draw)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    frameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameId)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}
