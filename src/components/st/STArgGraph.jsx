import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ST_ARGUMENTO } from '../../data/st_results'

export default function STArgGraph() {
  const svgRef = useRef(null)

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    const VB_W = 900, VB_H = 80
    svg.attr('viewBox', `0 0 ${VB_W} ${VB_H}`)

    const FONT_SIZE = 9, charW = FONT_SIZE * 0.62, PX = 14, PY = 7
    const nodes = ST_ARGUMENTO.nodes.map((n, i) => ({
      ...n,
      cx: 75 + ((VB_W - 150) / (ST_ARGUMENTO.nodes.length - 1)) * i,
      cy: VB_H / 2,
      hw: (n.label.length * charW + PX * 2) / 2,
    }))
    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

    // Arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'st-arrow').attr('viewBox', '0 -4 8 8')
      .attr('refX', 8).attr('refY', 0)
      .attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path').attr('d', 'M0,-4L8,0L0,4').attr('fill', '#7c6dfa')

    // Edges — use requestAnimationFrame for staggered fade-in instead of d3 transitions
    ST_ARGUMENTO.edges.forEach((e, idx) => {
      const s = nodeMap[e.source], t = nodeMap[e.target]
      const line = svg.append('line')
        .attr('x1', s.cx + s.hw + 3).attr('y1', s.cy)
        .attr('x2', t.cx - t.hw - 3).attr('y2', t.cy)
        .attr('stroke', '#7c6dfa').attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#st-arrow)')
        .attr('opacity', 0)
      setTimeout(() => { line.attr('opacity', 0.9) }, idx * 200 + 100)
    })

    // Nodes — stagger with setTimeout for reliability
    const g = svg.selectAll('g.node').data(nodes).enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.cx},${d.cy})`)
      .attr('opacity', 0)

    g.each(function(d) {
      const el = d3.select(this)
      const rw = d.hw * 2, rh = FONT_SIZE + PY * 2
      el.append('rect')
        .attr('x', -rw/2).attr('y', -rh/2).attr('width', rw).attr('height', rh)
        .attr('rx', 5).attr('fill', '#12121c').attr('stroke', '#7c6dfa').attr('stroke-width', 1.2)
      el.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em')
        .attr('fill', '#a78bfa').attr('font-size', FONT_SIZE + 'px')
        .attr('font-weight', 'bold').attr('font-family', '"JetBrains Mono", monospace')
        .text(d.label)
    })

    g.each(function(_, i) {
      const el = d3.select(this)
      setTimeout(() => { el.attr('opacity', 1) }, i * 150 + 50)
    })

    return () => {
      // Cancel any pending d3 transitions on cleanup to prevent ghost state
      svg.selectAll('*').interrupt()
    }
  }, [])

  return (
    <div style={{ width: '100%' }}>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginBottom: '0.2rem', fontFamily: 'monospace' }}>
        ST · 02_Argumento_Global
      </div>
      <svg ref={svgRef} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  )
}
