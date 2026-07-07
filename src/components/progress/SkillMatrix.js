'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import * as d3Hierarchy from 'd3-hierarchy'
import * as d3Force from 'd3-force'
import * as d3Drag from 'd3-drag'
import * as d3Selection from 'd3-selection'
import { ZoomIn, X, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

function BubbleChart({ data, width, height }) {
  const router = useRouter()
  // Use pack to get initial good packing and optimal radii
  const initialNodes = useMemo(() => {
    if (!data || data.length === 0) return []
    const rootData = { name: 'root', children: data }
    
    const root = d3Hierarchy.hierarchy(rootData)
      .sum(d => d.total || 0)
      .sort((a, b) => b.value - a.value)
      
    const pack = d3Hierarchy.pack()
      .size([width, height])
      .padding(width > 400 ? 5 : 3)
      
    pack(root)
    
    return root.leaves().map(leaf => ({
      topic: leaf.data,
      r: leaf.r,
      x: leaf.x,
      y: leaf.y,
      fx: null,
      fy: null
    }))
  }, [data, width, height])

  const [hoveredNode, setHoveredNode] = useState(null)
  const nodeRefs = useRef([])
  const containerRef = useRef()

  useEffect(() => {
    if (initialNodes.length === 0 || !containerRef.current) return

    // Clone nodes for physics simulation
    const nodes = initialNodes.map(n => ({ ...n }))

    const simulation = d3Force.forceSimulation(nodes)
      .force('collide', d3Force.forceCollide().radius(d => d.r + (width > 400 ? 3 : 2)).iterations(3))
      .force('center', d3Force.forceCenter(width / 2, height / 2).strength(0.05))
      .force('charge', d3Force.forceManyBody().strength(d => -d.r * 0.1))
      .alphaDecay(0.05)

    simulation.on('tick', () => {
      nodes.forEach((node, i) => {
        // Enforce bounding box constraints so bubbles don't go outside the container
        node.x = Math.max(node.r + 2, Math.min(width - node.r - 2, node.x))
        node.y = Math.max(node.r + 2, Math.min(height - node.r - 2, node.y))
        
        const el = nodeRefs.current[i]
        if (el) {
          el.style.left = `${node.x}px`
          el.style.top = `${node.y}px`
        }
      })
      // Update tooltip position if hovering over a moving node
      setHoveredNode(prev => {
        if (prev) {
          // Find updated node data
          const updatedNode = nodes.find(n => n.topic.name === prev.topic.name)
          if (updatedNode) {
            return { topic: updatedNode.topic, x: updatedNode.x, y: updatedNode.y }
          }
        }
        return prev
      })
    })

    const drag = d3Drag.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        // Constrain dragging to the container bounds
        d.fx = Math.max(d.r + 2, Math.min(width - d.r - 2, event.x))
        d.fy = Math.max(d.r + 2, Math.min(height - d.r - 2, event.y))
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    // Attach drag behavior
    d3Selection.select(containerRef.current).selectAll('.bubble-node')
      .data(nodes)
      .call(drag)

    return () => {
      simulation.stop()
    }
  }, [initialNodes, width, height])

  return (
    <div ref={containerRef} className="relative" style={{ width: width + 'px', height: height + 'px' }}>
      {initialNodes.map((node, i) => {
        const { r, topic } = node
        const fillPercentage = topic.total > 0 ? (topic.solved / topic.total) * 100 : 0
        
        return (
          <div
            key={topic.name}
            ref={el => nodeRefs.current[i] = el}
            className="bubble-node absolute rounded-full flex flex-col items-center justify-center text-center leading-tight cursor-grab active:cursor-grabbing border border-[#4a4a4a] overflow-hidden group shadow-sm hover:border-white/30"
            style={{
              width: `${r * 2}px`,
              height: `${r * 2}px`,
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#383838',
              touchAction: 'none' // Prevent scrolling while dragging on mobile
            }}
            onMouseEnter={() => setHoveredNode({ topic, x: nodeRefs.current[i]?.style.left ? parseFloat(nodeRefs.current[i].style.left) : node.x, y: nodeRefs.current[i]?.style.top ? parseFloat(nodeRefs.current[i].style.top) : node.y })}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={() => router.push(`/problem-list/${encodeURIComponent(topic.name.toLowerCase().replace(/ /g, '-'))}`)}
          >
            {/* Green Fill background at the bottom */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-[#c7f2c6]"
              style={{ height: `${fillPercentage}%`, transition: 'height 1s ease-in-out' }}
            />
            
            {/* Tag Name */}
            {r >= (width > 400 ? 25 : 18) && (
              <span 
                className="relative z-10 font-medium px-1 truncate w-full transition-colors select-none pointer-events-none" 
                style={{ 
                  color: '#00b8a3', 
                  fontSize: width > 400 ? '12px' : '9px' 
                }}
              >
                {topic.name}
              </span>
            )}
          </div>
        )
      })}
      
      {/* Custom Tooltip */}
      {hoveredNode && (
        <div 
          className="absolute pointer-events-none bg-[#333333] border border-[#4a4a4a] text-white p-2.5 rounded-lg shadow-2xl z-50 whitespace-nowrap"
          style={{ 
            left: `${hoveredNode.x}px`, 
            top: `${hoveredNode.y}px`,
            transform: 'translate(-50%, -120%)',
            minWidth: '80px',
            transition: 'opacity 0.15s ease'
          }}
        >
          <div className="font-bold mb-1 text-[13px] text-center">{hoveredNode.topic.name}</div>
          <div className="text-[14px] text-center">
            <span className="font-bold">{hoveredNode.topic.solved}</span> 
            <span className="text-white/40 font-medium"> / {hoveredNode.topic.total}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export function SkillMatrix({ data = [] }) {
  const [showModal, setShowModal] = useState(false)
  
  if (!data || data.length === 0) {
    return <div className="bg-[#212121] rounded-2xl p-4 min-h-[300px] flex items-center justify-center text-muted-foreground border border-border">No skill data available</div>
  }

  return (
    <>
      <div className="bg-[#212121] rounded-2xl border border-border shadow-md overflow-hidden relative min-h-[380px] flex flex-col p-4">
        {/* Zoom icon top right */}
        <div 
          onClick={() => setShowModal(true)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white cursor-pointer border border-[#3e3e3e] bg-[#2a2a2a] p-1.5 rounded-lg transition-colors z-20"
        >
          <ZoomIn size={16} />
        </div>
        
        {/* Bubble Chart rendering */}
        <div className="flex-1 flex items-center justify-center pt-2">
          <BubbleChart data={data} width={340} height={340} />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 md:p-8"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-[#282828] rounded-2xl border border-[#3e3e3e] shadow-2xl w-[95%] max-w-[850px] aspect-square max-h-[85vh] relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="absolute top-6 right-6 flex items-center gap-4 z-20">
              <a href="#" className="flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors text-sm font-semibold">
                All Topics <ExternalLink size={16} />
              </a>
              <div className="w-[1px] h-4 bg-[#4a4a4a]"></div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-[#a0a0a0] hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Large Bubble Chart */}
            <div className="flex-1 flex items-center justify-center overflow-hidden p-4 md:p-8">
              <div className="w-full h-full flex items-center justify-center min-w-[500px]">
                <BubbleChart data={data} width={700} height={700} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
