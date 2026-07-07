'use client'

import { Search, ArrowUpDown, Filter, Shuffle, Check, Lock, MoreHorizontal, Trash2, Star, ArrowUp, Menu } from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Reorder } from 'framer-motion'
import { ProblemFilterDropdown } from '@/components/problem/table/ProblemFilterDropdown'
import { SaveToListModal } from './SaveToListModal'

export function UserListContent({ list }) {
  const [search, setSearch] = useState('')
  const [localProblems, setLocalProblems] = useState(list.problems || [])

  useEffect(() => {
    setLocalProblems(list.problems || [])
  }, [list.problems])

  // Sort state
  const [sortBy, setSortBy] = useState('custom')
  const [sortOrder, setSortOrder] = useState('asc')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const sortRef = useRef(null)

  // Filter state
  const [activeFilters, setActiveFilters] = useState({})
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const filterRef = useRef(null)
  
  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [problemForSaveModal, setProblemForSaveModal] = useState(null)
  const menuRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSortDropdown(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilterDropdown(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) setActiveMenuId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRemoveFromList = async (problemId) => {
    try {
      const res = await fetch('/api/lists/toggle-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: list.title, problemId })
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (e) {
      console.error('Failed to remove from list', e)
    } finally {
      setActiveMenuId(null)
    }
  }

  const handleMoveToTop = async (problemId) => {
    try {
      const res = await fetch(`/api/lists/${list.id}/problems/${problemId}/move-to-top`, {
        method: 'POST'
      })
      if (res.ok) {
        setSortBy('custom')
        router.refresh()
      }
    } catch (e) {
      console.error('Failed to move to top', e)
    } finally {
      setActiveMenuId(null)
    }
  }

  const handleReorder = async (newOrder) => {
    setLocalProblems(newOrder)

    // Fire and forget to backend to persist order
    const problemIds = newOrder.map(p => p.id)
    try {
      await fetch(`/api/lists/${list.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemIds })
      })
    } catch (e) {
      console.error('Failed to reorder', e)
    }
  }

  let filteredProblems = [...localProblems]

  if (search) {
    filteredProblems = filteredProblems.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.problemNumber.toString().includes(search)
    )
  }

  // Apply active filters
  const applyFilterOp = (val, filterVal, op) => {
    if (filterVal === undefined || filterVal === '') return true;
    if (op === 'is') return val === filterVal;
    if (op === 'is_not') return val !== filterVal;
    return true;
  }

  if (Object.keys(activeFilters).length > 0) {
    filteredProblems = filteredProblems.filter(p => {
      const matchType = activeFilters.matchType || 'all'
      const conditions = []

      if (activeFilters.status) {
        const isSolved = activeFilters.status === 'solved'
        conditions.push(applyFilterOp(p.isSolved, isSolved, activeFilters.statusOp))
      }
      if (activeFilters.difficulty) {
        conditions.push(applyFilterOp(p.difficulty, activeFilters.difficulty, activeFilters.difficultyOp))
      }
      
      if (conditions.length === 0) return true
      if (matchType === 'all') return conditions.every(c => c)
      return conditions.some(c => c)
    })
  }

  filteredProblems.sort((a, b) => {
    if (sortBy === 'custom') return 0 // Preserve backend sort order (addedAt desc)
    let diff = 0
    if (sortBy === 'problemNumber') diff = a.problemNumber - b.problemNumber
    else if (sortBy === 'title') diff = a.title.localeCompare(b.title)
    else if (sortBy === 'acceptanceRate') diff = (a.acceptanceRate || 0) - (b.acceptanceRate || 0)
    else if (sortBy === 'difficulty') {
      const rank = { EASY: 1, MEDIUM: 2, HARD: 3 }
      diff = rank[a.difficulty] - rank[b.difficulty]
    }
    return sortOrder === 'asc' ? diff : -diff
  })

  const getDifficultyColor = (diff) => {
    if (diff === 'EASY') return 'text-[#2cbb5d]'
    if (diff === 'MEDIUM') return 'text-[#ffc01e]'
    if (diff === 'HARD') return 'text-[#ff375f]'
    return 'text-foreground'
  }

  const getDifficultyLabel = (diff) => {
    if (diff === 'EASY') return 'Easy'
    if (diff === 'MEDIUM') return 'Med.'
    if (diff === 'HARD') return 'Hard'
    return diff
  }

  return (
    <>
    <div className="flex-1 min-w-0">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c8c8c]" />
            <input 
              type="text" 
              placeholder="Search questions" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#282828] border border-[#3e3e3e] text-sm text-white placeholder-[#8c8c8c] rounded-full pl-10 pr-4 py-2 focus:outline-none focus:border-white/20 hover:border-[#555] w-[280px] transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortRef}>
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className={`w-[38px] h-[38px] flex items-center justify-center rounded-xl bg-[#282828] hover:bg-[#333] transition-colors border border-[#3e3e3e] ${showSortDropdown ? 'text-white border-white/30' : 'text-[#8c8c8c] hover:text-white'}`}
            >
              <ArrowUpDown size={16} />
            </button>
            {showSortDropdown && (
              <div className="absolute top-12 left-0 w-48 bg-[#282828] border border-[#3e3e3e] rounded-xl shadow-2xl py-2 z-50">
                {[
                  { id: 'custom', label: 'Custom' },
                  { id: 'problemNumber', label: 'Question ID' },
                  { id: 'title', label: 'Title' },
                  { id: 'difficulty', label: 'Difficulty' },
                  { id: 'acceptanceRate', label: 'Acceptance' }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => {
                      if (sortBy === opt.id) {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortBy(opt.id)
                        setSortOrder('asc')
                      }
                      setShowSortDropdown(false)
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm text-[#8c8c8c] hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>{opt.label} {sortBy === opt.id && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                    {sortBy === opt.id && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`w-[38px] h-[38px] flex items-center justify-center rounded-xl bg-[#282828] hover:bg-[#333] transition-colors border border-[#3e3e3e] ${Object.keys(activeFilters).some(k => k !== 'matchType' && activeFilters[k]) ? 'text-[#ffa116] border-[#ffa116]/30' : 'text-[#8c8c8c] hover:text-white'}`}
            >
              <Filter size={16} />
            </button>
            {showFilterDropdown && (
              <div className="absolute top-12 left-0 z-50">
                <ProblemFilterDropdown 
                  onApply={(filters) => setActiveFilters(filters)}
                  onReset={() => setActiveFilters({})}
                  availableTags={[]}
                  availableCompanies={[]}
                  initialFilters={activeFilters}
                />
              </div>
            )}
          </div>
        </div>

        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Shuffle size={16} />
        </button>
      </div>

      {/* List */}
      <Reorder.Group 
        axis="y" 
        values={filteredProblems} 
        onReorder={handleReorder}
        className="flex flex-col gap-0"
      >
        {filteredProblems.map((p, idx) => {
          const canDrag = sortBy === 'custom' && !search && Object.keys(activeFilters).length === 0
          return (
            <Reorder.Item 
              key={p.id} 
              value={p}
              dragListener={canDrag}
              className={`group flex items-center px-4 py-2.5 transition-colors ${idx % 2 === 0 ? 'bg-[#282828] rounded-lg' : 'bg-transparent'} hover:bg-[#333333] hover:rounded-lg ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} relative`}
            >
              
              <div className="w-12 flex-shrink-0 flex items-center gap-2">
                {canDrag && <Menu size={14} className="text-[#8c8c8c] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />}
                {p.isSolved && <Check size={16} className="text-[#2cbb5d]" />}
              </div>

              <Link href={`/problems/${p.slug}`} className="flex-1 flex items-center gap-2 text-[15px] font-medium text-white group-hover:text-primary transition-colors">
                <span className="text-white font-normal group-hover:font-bold">{p.problemNumber}.</span> {p.title}
              </Link>

              <div className="flex items-center gap-8 text-sm">
                <span className="w-12 text-right text-[#8c8c8c]">{p.acceptanceRate > 0 ? `${p.acceptanceRate.toFixed(1)}%` : '-'}</span>
                <span className={`w-12 text-center ${getDifficultyColor(p.difficulty)}`}>{getDifficultyLabel(p.difficulty)}</span>
                <div className="w-16 flex items-center justify-end text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Lock icon stays static next to the menu */}
                  <Lock size={14} className="mr-2 text-[#8c8c8c]" />
                  
                  <div className="relative" ref={activeMenuId === p.id ? menuRef : null}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        setActiveMenuId(activeMenuId === p.id ? null : p.id)
                      }}
                      className="p-1.5 hover:bg-[#464646] rounded-md text-[#8c8c8c] hover:text-white transition-colors"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {activeMenuId === p.id && (
                      <div className="absolute right-0 top-8 w-48 bg-[#282828] border border-[#3e3e3e] rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFromList(p.id); }}
                          className="w-full px-4 py-2 text-sm text-[#8c8c8c] hover:bg-[#333] hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <Trash2 size={16} /> Remove from List
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProblemForSaveModal(p); setActiveMenuId(null); }}
                          className="w-full px-4 py-2 text-sm text-[#8c8c8c] hover:bg-[#333] hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <Star size={16} /> Add to List
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMoveToTop(p.id); }}
                          className="w-full px-4 py-2 text-sm text-[#8c8c8c] hover:bg-[#333] hover:text-white flex items-center gap-3 transition-colors"
                        >
                          <ArrowUp size={16} /> Move to Top
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Reorder.Item>
          )
        })}

        {filteredProblems.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            No problems found in this list.
          </div>
        )}
      </Reorder.Group>

    </div>
      {problemForSaveModal && (
        <SaveToListModal 
          problem={problemForSaveModal} 
          onClose={() => setProblemForSaveModal(null)} 
        />
      )}
    </>
  )
}
