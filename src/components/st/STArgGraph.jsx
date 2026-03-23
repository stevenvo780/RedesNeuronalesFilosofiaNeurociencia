import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { ST_ARGUMENTO } from '../../data/st_results'

export default function STArgGraph() {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const W = svgRef.current.clientWidth || 800
    const H = svgRef.current.clientHeight || 140

    const nodes = ST_ARGUMENTO.nodes.map((n, i) => ({
      ...n,
      cx: 40 + ((W - 80) / (ST_ARGUMENTO.nodes.length - 1)) * i,
      cy: H / 2 + 10,
    }))

    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

    // Arrows
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 65)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#7c6dfa')

    // Edges
    svg.selectAll('line.edge')
      .data(ST_ARGUMENTO.edges)
      .enter().append('line')
      .attr('class', 'edge')
      .attr('x1', d => nodeMap[d.source].cx)
      .attr('y1', d => nodeMap[d.source].cy)
      .attr('x2', d => nodeMap[d.target].cx)
      .attr('y2', d => nodeMap[d.target].cy)
      .attr('stroke', '#7c6dfa')
      .attr('stroke-width', 2.5)
      .attr('marker-end', 'url(#arrow)')
      .attr('opacity', 0)
      .transition().duration(600).delay((_, i) => i * 300)
      .attr('opacity', 0.8)

    // Nodes
    const g = svg.selectAll('g.node')
      .data(nodes)
      .enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.cx}, ${d.cy})`)
      .attr('opacity', 0)

    // Increase dimensions to fit large words
    const rectW = 120;
    const rectH = 40;

    g.append('rect')
      .attr('x', -rectW / 2)
      .attr('y', -rectH / 2)
      .attr('width', rectW)
      .attr('height', rectH)
      .attr('rx', 8)
      .attr('fill', '#1a1a24')
      .attr('stroke', '#7c6dfa')
      .attr('stroke-width', 2)

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#a78bfa')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text(d => d.label)

    g.transition().duration(400).delay((_, i) => i * 250)
      .attr('opacity', 1)

  }, [])

  return (
    <div className="st-card" style={{ padding: '1.25rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
        ST · 02_Argumento_Global · cadena argumental validada
      </div>
      <svg ref={svgRef} style={{ minWidth: '760px', width: '100%', height: '140px' }} />
    </div>
  )
}
