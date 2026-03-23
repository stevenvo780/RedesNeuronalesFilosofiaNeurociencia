import { useEffect, useRef } from 'react'

// Two-lobe brain-like node distribution
const N = 160

const NODES = Array.from({ length: N }, (_, i) => {
  const isLeft   = i < 65
  const isRight  = i >= 65 && i < 130
  let cx, cy, rx, ry
  if (isLeft)       { cx = 0.33; cy = 0.48; rx = 0.19; ry = 0.30 }
  else if (isRight) { cx = 0.67; cy = 0.48; rx = 0.19; ry = 0.30 }
  else              { cx = 0.50; cy = 0.50; rx = 0.08; ry = 0.14 }

  const angle = (i * 2.39996) % (Math.PI * 2)
  const rad   = Math.sqrt(((i * 5417 + 13) % 100) / 100)
  return {
    x: Math.max(0.04, Math.min(0.96, cx + Math.cos(angle) * rad * rx)),
    y: Math.max(0.04, Math.min(0.96, cy + Math.sin(angle) * rad * ry)),
    vx:    (((i * 1237 + 7)  % 200) / 100 - 1) * 0.000022,
    vy:    (((i * 5417 + 3)  % 200) / 100 - 1) * 0.000022,
    ph:    (i * 2.71828) % (Math.PI * 2),
    r:     1.0 + ((i * 3571) % 10) / 10 * 2.4,
    bright: ((i * 7919) % 100) / 100,
    delay:  ((i * 4637) % 100) / 100 * 3.0,
  }
})

const CONNS = (() => {
  const list = []
  for (let a = 0; a < N; a++) {
    for (let b = a + 1; b < N; b++) {
      const dx = NODES[a].x - NODES[b].x
      const dy = NODES[a].y - NODES[b].y
      if (dx * dx + dy * dy < 0.20 * 0.20) {
        list.push({
          a, b,
          sig:      ((a * 13 + b * 7) % 100) / 100,
          spd:      0.0008 + ((a * 3 + b) % 60) / 60 * 0.005,
          maxAlpha: 0.03 + ((a * b) % 60) / 60 * 0.065,
          delay:    Math.max(NODES[a].delay, NODES[b].delay),
        })
      }
    }
  }
  return list
})()

function BrainAnimation() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return

    const nodes = NODES.map(n => ({ ...n }))
    const conns = CONNS.map(c => ({ ...c }))
    let W = 0, H = 0, startTime = null, animId

    const setSize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    ro.observe(canvas)

    const draw = (timestamp) => {
      if (!W || !H) { animId = requestAnimationFrame(draw); return }
      if (!startTime) startTime = timestamp
      const elapsed = (timestamp - startTime) * 0.001
      const ctx = canvas.getContext('2d')
      const t = timestamp * 0.001

      // Comet-trail fade
      ctx.fillStyle = 'rgba(2,2,18,0.10)'
      ctx.fillRect(0, 0, W, H)

      // Drift
      nodes.forEach(n => {
        n.x = ((n.x + n.vx) + 1) % 1
        n.y = ((n.y + n.vy) + 1) % 1
      })

      // Slow color cycle: violet → cyan → violet (~90s)
      const cycle = (Math.sin(t * 0.035) + 1) / 2
      const cr = Math.round(80  + cycle * 50)
      const cg = Math.round(60  + cycle * 120)
      const cb = Math.round(210 + cycle * 45)

      // Connections
      conns.forEach(c => {
        c.sig = (c.sig + c.spd) % 1
        const formation = Math.min(1, Math.max(0, (elapsed - c.delay) / 2.5))
        if (formation < 0.01) return

        const na = nodes[c.a], nb = nodes[c.b]
        const ax = na.x * W, ay = na.y * H
        const bx = nb.x * W, by = nb.y * H

        ctx.beginPath()
        ctx.moveTo(ax, ay); ctx.lineTo(bx, by)
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${c.maxAlpha * formation})`
        ctx.lineWidth = 0.4
        ctx.stroke()

        // Signal pulse
        const pAlpha = formation * 0.9 * Math.sin(c.sig * Math.PI)
        if (pAlpha > 0.04) {
          const sx = ax + (bx - ax) * c.sig
          const sy = ay + (by - ay) * c.sig
          const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5.5)
          grd.addColorStop(0,   `rgba(${Math.min(255, cr + 90)},${Math.min(255, cg + 70)},255,${pAlpha})`)
          grd.addColorStop(0.5, `rgba(${cr},${cg},${cb},${pAlpha * 0.25})`)
          grd.addColorStop(1,   'rgba(0,0,0,0)')
          ctx.beginPath(); ctx.arc(sx, sy, 5.5, 0, Math.PI * 2)
          ctx.fillStyle = grd; ctx.fill()
        }
      })

      // Nodes
      nodes.forEach((n, i) => {
        const formation = Math.min(1, Math.max(0, (elapsed - n.delay) / 1.5))
        if (formation < 0.02) return

        const x = n.x * W, y = n.y * H
        const pulse     = 0.5 + 0.5 * Math.sin(t * (0.4 + (i % 11) * 0.07) + n.ph)
        const activated = Math.sin(t * (0.25 + n.bright * 0.5) + n.ph * 1.8) > 0.65
        const intensity = formation * (activated ? 0.95 : 0.35 + 0.35 * pulse)
        const r = n.r * (0.7 + 0.5 * pulse)

        // Halo
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 9)
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},${0.18 * intensity})`)
        grd.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(x, y, r * 9, 0, Math.PI * 2)
        ctx.fillStyle = grd; ctx.fill()

        // Core
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${Math.min(255, cr + 80)},${Math.min(255, cg + 60)},255,${intensity * 0.85})`
        ctx.fill()
      })

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animId); ro.disconnect() }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
}

export default function S00_Intro() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#020212', overflow: 'hidden' }}>
      <BrainAnimation />
    </div>
  )
}
