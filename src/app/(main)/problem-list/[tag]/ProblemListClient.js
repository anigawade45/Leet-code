'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Search, Shuffle, Play, Star, ExternalLink, GitFork, Filter, ArrowDownUp, ArrowUpDown, Check, Lock, Video } from 'lucide-react'
import Link from 'next/link'
import { ProblemFilterDropdown } from '@/components/problem/table/ProblemFilterDropdown'

export function ProblemListClient({ tag, problems, stats }) {
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [sortBy, setSortBy] = useState('custom') // custom, id, title, difficulty, acceptance
  const [sortOrder, setSortOrder] = useState('asc') // asc, desc

  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const sortRef = useRef(null)
  const filterRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false)
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Apply active filters
  const applyFilterOp = (val, filterVal, op) => {
    if (filterVal === undefined || filterVal === '') return true;
    if (op === 'is') return val === filterVal;
    if (op === 'is_not') return val !== filterVal;
    return true;
  }

  // Combined Filtering and Sorting
  const processedProblems = useMemo(() => {
    let result = [...problems]

    // 1. Search
    if (search) {
      result = result.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.problemNumber.toString().includes(search))
    }

    // 2. Advanced Filters
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter(p => {
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

    // 4. Sorting
    if (sortBy !== 'custom') {
      result.sort((a, b) => {
        if (sortBy === 'difficulty') {
          const diffMap = { EASY: 1, MEDIUM: 2, HARD: 3 }
          return sortOrder === 'asc' 
            ? diffMap[a.difficulty] - diffMap[b.difficulty]
            : diffMap[b.difficulty] - diffMap[a.difficulty]
        }
        if (sortBy === 'acceptance') {
          const getAcc = (p) => {
            if (!p.submissions || !p._count?.submissions) return 0
            return p.submissions.filter(s => s.status === 'ACCEPTED').length / p._count.submissions
          }
          return sortOrder === 'asc' ? getAcc(a) - getAcc(b) : getAcc(b) - getAcc(a)
        }
        if (sortBy === 'id') {
          return sortOrder === 'asc' ? a.problemNumber - b.problemNumber : b.problemNumber - a.problemNumber
        }
        if (sortBy === 'title') {
          return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
        }
        return 0
      })
    }

    return result
  }, [problems, search, activeFilters, sortBy, sortOrder])

  const dynamicStats = useMemo(() => {
    let solved = 0, total = processedProblems.length
    let easy = { solved: 0, total: 0 }
    let med = { solved: 0, total: 0 }
    let hard = { solved: 0, total: 0 }

    processedProblems.forEach(p => {
      const isSolved = p.isSolved
      if (isSolved) solved++
      if (p.difficulty === 'EASY') {
        easy.total++
        if (isSolved) easy.solved++
      } else if (p.difficulty === 'MEDIUM') {
        med.total++
        if (isSolved) med.solved++
      } else if (p.difficulty === 'HARD') {
        hard.total++
        if (isSolved) hard.solved++
      }
    })

    return { total, solved, easy, med, hard }
  }, [processedProblems])


  // Circular progress calculations (3/4 dashboard style gauge)
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const solvedPercent = dynamicStats.total === 0 ? 0 : (dynamicStats.solved / dynamicStats.total) * 100
  
  // 3/4 circle (270 degrees) arc
  const arcLength = circumference * 0.75
  const progressArcLength = arcLength * (solvedPercent / 100)
  const offset = arcLength - progressArcLength

  return (
    <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8 flex gap-8 items-start">
      
      {/* Left Sidebar (Matching UserListSidebar) */}
      <div className="w-[320px] shrink-0 bg-[#282828] rounded-xl p-5 shadow-none border-none">
        
        {/* Header section */}
        <div className="mb-6">
          <div className="w-[72px] h-[72px] bg-gradient-to-br from-[#4a3434] to-[#2d1b2e] rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
             <div className="w-6 h-1.5 bg-[#ff6b6b] rounded-full absolute top-5 left-4 shadow-[0_0_8px_rgba(255,107,107,0.5)]" />
             <div className="w-8 h-1.5 bg-[#ff6b6b]/80 rounded-full absolute top-8 left-4 shadow-[0_0_8px_rgba(255,107,107,0.5)]" />
             <div className="w-5 h-1.5 bg-[#ff6b6b]/60 rounded-full absolute top-11 left-4 shadow-[0_0_8px_rgba(255,107,107,0.5)]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1.5">{tag.name}</h1>
          <div className="text-[13px] text-[#e5e5e5] mb-6">
            <span className="font-medium">LeetCode</span> <span className="text-[#8c8c8c]">• {stats.total} questions</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="flex-1 bg-white text-black hover:bg-gray-100 font-semibold py-2 rounded-full flex items-center justify-center gap-2 text-sm transition-colors">
              <Play size={15} className="fill-black" />
              Practice
            </button>
            <button className="w-10 h-10 rounded-full bg-[#3e3e3e] flex items-center justify-center hover:bg-[#4e4e4e] text-[#b3b3b3] hover:text-white transition-colors">
              <Star size={16} />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#3e3e3e] flex items-center justify-center hover:bg-[#4e4e4e] text-[#b3b3b3] hover:text-white transition-colors">
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        <hr className="border-[#3e3e3e] mb-6" />

        {/* Progress section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-white">Progress</h2>
            <button className="text-[#8c8c8c] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-[#333333] rounded-lg flex flex-col items-center justify-center relative min-h-[150px]">
              <svg className="w-[100px] h-[100px]" style={{ transform: 'rotate(135deg)' }}>
                <circle 
                  cx="50" cy="50" r={radius} fill="none" 
                  stroke="#464646" strokeWidth="3" 
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeLinecap="round"
                />
                <circle 
                  cx="50" cy="50" r={radius} fill="none" 
                  stroke="#2cbb5d" strokeWidth="3" 
                  strokeDasharray={`${arcLength} ${circumference}`} 
                  strokeDashoffset={offset} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-in-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center mt-2">
                <div className="text-[28px] font-medium text-white leading-none tracking-tight">
                  {dynamicStats.solved}<span className="text-base text-[#8c8c8c] font-normal">/{dynamicStats.total}</span>
                </div>
                <div className="text-[11px] text-white mt-1.5 flex items-center gap-1">
                  <Check size={12} className="text-[#2cbb5d]" strokeWidth={3} />
                  Solved
                </div>
              </div>
            </div>

            <div className="w-[72px] flex flex-col gap-2">
              <div className="bg-[#333333] rounded-lg py-2 flex flex-col items-center justify-center text-xs h-[46px]">
                <span className="text-[#00b8a3] font-medium mb-0.5">Easy</span>
                <span className="text-white font-medium">
                  {dynamicStats.easy.total > 0 ? (
                    <>{dynamicStats.easy.solved}<span className="text-[#8c8c8c]">/{dynamicStats.easy.total}</span></>
                  ) : '0'}
                </span>
              </div>
              <div className="bg-[#333333] rounded-lg py-2 flex flex-col items-center justify-center text-xs h-[46px]">
                <span className="text-[#ffc01e] font-medium mb-0.5">Med.</span>
                <span className="text-white font-medium">
                  {dynamicStats.med.total > 0 ? (
                    <>{dynamicStats.med.solved}<span className="text-[#8c8c8c]">/{dynamicStats.med.total}</span></>
                  ) : '0'}
                </span>
              </div>
              <div className="bg-[#333333] rounded-lg py-2 flex flex-col items-center justify-center text-xs h-[46px]">
                <span className="text-[#ff375f] font-medium mb-0.5">Hard</span>
                <span className="text-white font-medium">
                  {dynamicStats.hard.total > 0 ? (
                    <>{dynamicStats.hard.solved}<span className="text-[#8c8c8c]">/{dynamicStats.hard.total}</span></>
                  ) : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content (Matching UserListContent) */}
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
                onClick={() => setShowSort(!showSort)}
                className={`w-[38px] h-[38px] flex items-center justify-center rounded-xl bg-[#282828] hover:bg-[#333] transition-colors border border-[#3e3e3e] ${showSort ? 'text-white border-white/30' : 'text-[#8c8c8c] hover:text-white'}`}
              >
                <ArrowUpDown size={16} />
              </button>
              {showSort && (
                <div className="absolute top-12 left-0 w-48 bg-[#282828] border border-[#3e3e3e] rounded-xl shadow-2xl py-2 z-50">
                  {[
                    { id: 'custom', label: 'Custom' },
                    { id: 'id', label: 'Question ID' },
                    { id: 'title', label: 'Title' },
                    { id: 'difficulty', label: 'Difficulty' },
                    { id: 'acceptance', label: 'Acceptance' }
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
                        setShowSort(false)
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
                onClick={() => setShowFilters(!showFilters)}
                className={`w-[38px] h-[38px] flex items-center justify-center rounded-xl bg-[#282828] hover:bg-[#333] transition-colors border border-[#3e3e3e] ${Object.keys(activeFilters).some(k => k !== 'matchType' && activeFilters[k]) ? 'text-[#ffa116] border-[#ffa116]/30' : 'text-[#8c8c8c] hover:text-white'}`}
              >
                <Filter size={16} />
              </button>
              {showFilters && (
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
        <div className="flex flex-col gap-0">
          {processedProblems.map((p, idx) => {
            const isSolved = p.isSolved || false
            let acceptance = '-'
            if (p.submissions && p._count?.submissions > 0) {
              const total = p._count.submissions
              const accepted = p.submissions.filter(s => s.status === 'ACCEPTED').length
              acceptance = ((accepted / total) * 100).toFixed(1) + '%'
            }
            let diffColor = 'text-[#2cbb5d]'
            let diffLabel = 'Easy'
            if (p.difficulty === 'MEDIUM') { diffColor = 'text-[#ffc01e]'; diffLabel = 'Med.' }
            if (p.difficulty === 'HARD') { diffColor = 'text-[#ff375f]'; diffLabel = 'Hard' }

            return (
              <div 
                key={p.id}
                className={`group flex items-center px-4 py-2.5 transition-colors ${idx % 2 === 0 ? 'bg-[#282828] rounded-lg' : 'bg-transparent'} hover:bg-[#333333] hover:rounded-lg relative cursor-pointer`}
              >
                
                <div className="w-12 flex-shrink-0 flex items-center gap-2">
                  {isSolved && <Check size={16} className="text-[#2cbb5d]" />}
                </div>

                <Link href={`/problems/${p.slug}`} className="flex-1 flex items-center gap-2 text-[15px] font-medium text-white group-hover:text-primary transition-colors">
                  <span className="text-white font-normal group-hover:font-bold">{p.problemNumber}.</span> {p.title}
                </Link>

                <div className="flex items-center gap-8 text-sm">
                  <span className="w-12 text-right text-[#8c8c8c]">{acceptance}</span>
                  <span className={`w-12 text-center ${diffColor}`}>{diffLabel}</span>
                  <div className="w-16 flex items-center justify-end text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <Lock size={14} className="mr-2 text-[#8c8c8c]" />
                  </div>
                </div>
              </div>
            )
          })}

          {processedProblems.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No problems found.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
