'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Filter, ChevronDown, ChevronUp, Check, RefreshCcw } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'

export function PracticeHistory({ history }) {
  const router = useRouter()
  const [expandedRow, setExpandedRow] = useState(history.length > 0 ? history[0].id : null)
  const [expandedPage, setExpandedPage] = useState(1)
  
  // Pagination for problems
  const [problemPage, setProblemPage] = useState(1)
  const PROBLEMS_PER_PAGE = 20
  
  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const filterRef = useRef(null)
  
  const [statusFilter, setStatusFilter] = useState(null) // 'SOLVED', 'ATTEMPTED', null
  const [diffFilter, setDiffFilter] = useState(null) // 'EASY', 'MEDIUM', 'HARD', null
  const [showTags, setShowTags] = useState(false)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleRow = (id) => {
    if (expandedRow !== id) {
      setExpandedRow(id)
      setExpandedPage(1)
    } else {
      setExpandedRow(null)
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'text-[#00b8a3]'
      case 'MEDIUM': return 'text-[#ffc01e]'
      case 'HARD': return 'text-[#ff375f]'
      default: return 'text-white'
    }
  }

  const getResultColor = (status) => {
    return status === 'ACCEPTED' ? 'text-[#2cbb5d]' : 'text-[#ef4743]'
  }
  
  const resetFilters = () => {
    setStatusFilter(null)
    setDiffFilter(null)
    setShowTags(false)
  }

  // Filter logic
  const filteredHistory = useMemo(() => {
    return history.filter(sub => {
      // Difficulty filter
      if (diffFilter && sub.problem.difficulty !== diffFilter) return false
      
      // Status filter
      if (statusFilter) {
        const hasAccepted = sub.submissions.some(s => s.status === 'ACCEPTED')
        if (statusFilter === 'SOLVED' && !hasAccepted) return false
        if (statusFilter === 'ATTEMPTED' && hasAccepted) return false
      }
      
      return true
    })
  }, [history, statusFilter, diffFilter])
  
  const totalPages = Math.ceil(filteredHistory.length / PROBLEMS_PER_PAGE) || 1
  const currentProblems = filteredHistory.slice((problemPage - 1) * PROBLEMS_PER_PAGE, problemPage * PROBLEMS_PER_PAGE)
  
  // Reset page if filtered items are fewer
  useEffect(() => {
    if (problemPage > totalPages) setProblemPage(1)
  }, [filteredHistory.length, totalPages, problemPage])

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4 relative" ref={filterRef}>
        <h2 className="text-[22px] font-bold text-white">Practice History</h2>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-1.5 border rounded-full text-sm transition-colors ${showFilters || statusFilter || diffFilter || showTags ? 'bg-muted/30 border-muted text-white' : 'bg-transparent border-border hover:bg-muted/30 text-muted-foreground'}`}
        >
          <Filter size={14} />
          <span>Filter</span>
        </button>
        
        {/* Filter Dropdown */}
        {showFilters && (
          <div className="absolute top-full right-0 mt-2 w-[280px] bg-[#2a2a2a] border border-border shadow-xl rounded-xl p-5 z-50">
            {/* Status */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-white mb-3">Status</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${statusFilter === 'SOLVED' ? 'border-[#2cbb5d]' : 'border-muted-foreground group-hover:border-[#2cbb5d]/50'}`}>
                    {statusFilter === 'SOLVED' && <div className="w-2.5 h-2.5 rounded-full bg-[#2cbb5d]" />}
                  </div>
                  <input type="radio" className="hidden" checked={statusFilter === 'SOLVED'} onChange={() => setStatusFilter(statusFilter === 'SOLVED' ? null : 'SOLVED')} />
                  Solved
                </label>
                <label className="flex items-center gap-2 text-sm text-white cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${statusFilter === 'ATTEMPTED' ? 'border-[#ffc01e]' : 'border-muted-foreground group-hover:border-[#ffc01e]/50'}`}>
                    {statusFilter === 'ATTEMPTED' && <div className="w-2.5 h-2.5 rounded-full bg-[#ffc01e]" />}
                  </div>
                  <input type="radio" className="hidden" checked={statusFilter === 'ATTEMPTED'} onChange={() => setStatusFilter(statusFilter === 'ATTEMPTED' ? null : 'ATTEMPTED')} />
                  Attempted
                </label>
              </div>
            </div>
            
            {/* Difficulty */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-white mb-3">Difficulty</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer text-white hover:text-[#00b8a3] transition-colors">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${diffFilter === 'EASY' ? 'border-[#00b8a3] bg-[#00b8a3]/20' : 'border-muted-foreground'}`}>
                    {diffFilter === 'EASY' && <Check size={12} className="text-[#00b8a3]" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={diffFilter === 'EASY'} onChange={() => setDiffFilter(diffFilter === 'EASY' ? null : 'EASY')} />
                  Easy
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-white hover:text-[#ffc01e] transition-colors">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${diffFilter === 'MEDIUM' ? 'border-[#ffc01e] bg-[#ffc01e]/20' : 'border-muted-foreground'}`}>
                    {diffFilter === 'MEDIUM' && <Check size={12} className="text-[#ffc01e]" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={diffFilter === 'MEDIUM'} onChange={() => setDiffFilter(diffFilter === 'MEDIUM' ? null : 'MEDIUM')} />
                  Med.
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-white hover:text-[#ff375f] transition-colors">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${diffFilter === 'HARD' ? 'border-[#ff375f] bg-[#ff375f]/20' : 'border-muted-foreground'}`}>
                    {diffFilter === 'HARD' && <Check size={12} className="text-[#ff375f]" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={diffFilter === 'HARD'} onChange={() => setDiffFilter(diffFilter === 'HARD' ? null : 'HARD')} />
                  Hard
                </label>
              </div>
            </div>
            
            {/* Tags */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-white mb-3">Tags</h3>
              <label className="flex items-center gap-2 text-sm text-white cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showTags ? 'border-white bg-white/20' : 'border-muted-foreground group-hover:border-white/50'}`}>
                  {showTags && <Check size={12} className="text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={showTags} onChange={() => setShowTags(!showTags)} />
                Show tags
              </label>
            </div>
            
            {/* Reset */}
            <button 
              onClick={resetFilters}
              className="w-full py-2 bg-[#3e3e3e] hover:bg-[#4a4a4a] text-white rounded-lg flex justify-center items-center gap-2 text-sm font-medium transition-colors"
            >
              <RefreshCcw size={14} />
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[minmax(140px,2fr)_minmax(250px,5fr)_minmax(120px,2fr)_minmax(120px,2fr)] gap-4 px-6 py-4 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          <div>Last Submitted</div>
          <div>Problem</div>
          <div>Last Result</div>
          <div className="flex items-center gap-1">Submissions <ChevronUp size={12} className="opacity-50" /></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#3e424a]/50 flex-1">
          {currentProblems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No matching practice history.
            </div>
          ) : (
            currentProblems.map((sub, index) => {
              const isExpanded = expandedRow === sub.id
              const timeAgo = formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })
              const formattedDate = format(new Date(sub.createdAt), 'yyyy.MM.dd')
              const dayOfWeek = format(new Date(sub.createdAt), 'EEE')
              
              const isRecent = new Date() - new Date(sub.createdAt) < 24 * 60 * 60 * 1000
              const timeDisplay = index === 0 && problemPage === 1 && isRecent ? timeAgo : dayOfWeek

              return (
                <div key={sub.id} className="flex flex-col bg-card hover:bg-[#2c2c2c] transition-colors">
                  {/* Main Row */}
                  <div 
                    className="grid grid-cols-[minmax(140px,2fr)_minmax(250px,5fr)_minmax(120px,2fr)_minmax(120px,2fr)] gap-4 px-6 py-5 items-center cursor-pointer"
                    onClick={() => toggleRow(sub.id)}
                  >
                    <div className="text-[15px] text-muted-foreground leading-tight pr-4 break-words">{timeDisplay}</div>
                    
                    <div className="flex items-start gap-2 pt-0.5 min-w-0">
                      {sub.submissions.some(s => s.status === 'ACCEPTED') && <Check size={16} className="text-[#2cbb5d] shrink-0 mt-0.5" strokeWidth={2.5} />}
                      <div className="flex flex-col gap-1 min-w-0 w-full">
                        <div className="flex items-center gap-2">
                          <div className="text-[15px] font-bold text-foreground truncate pr-4">
                            {sub.problem.problemNumber}. {sub.problem.title}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`text-[13px] font-medium ${getDifficultyColor(sub.problem.difficulty)}`}>
                            {sub.problem.difficulty.charAt(0) + sub.problem.difficulty.slice(1).toLowerCase()}
                          </div>
                          {showTags && sub.problem.tags && sub.problem.tags.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {sub.problem.tags.map(t => (
                                <span key={t.tag.name} className="px-1.5 py-0.5 bg-[#3e3e3e] rounded-md text-[11px] text-muted-foreground whitespace-nowrap">
                                  {t.tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={`text-[15px] font-medium ${getResultColor(sub.lastResult)}`}>
                      {sub.lastResult === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                    </div>

                    <div className="text-[15px] text-muted-foreground flex items-center">
                      {sub.submissionsCount} 
                      <span className="ml-2 opacity-60">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 bg-card">
                      <div className="bg-background rounded-lg border border-border p-4 text-[13px]">
                        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] gap-4 text-muted-foreground mb-4 font-medium">
                          <div>Date</div>
                          <div>Result</div>
                          <div>Language</div>
                          <div>Runtime</div>
                          <div>Memory</div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {sub.submissions.slice((expandedPage - 1) * 5, expandedPage * 5).map((detail) => (
                            <div 
                              key={detail.id} 
                              onClick={() => router.push(`/submissions/${detail.id}`)}
                              className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr] gap-4 items-center p-2 -mx-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <div className="text-muted-foreground">
                                {format(new Date(detail.createdAt), 'yyyy.MM.dd')}
                              </div>
                              <div className={`font-medium ${getResultColor(detail.status)}`}>
                                {detail.status === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                              </div>
                              <div>
                                <span className="px-2 py-0.5 bg-muted rounded text-[11px] text-foreground capitalize">
                                  {detail.language}
                                </span>
                              </div>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <span className="opacity-70">⏱</span> {detail.runtime || 0} ms
                              </div>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <span className="opacity-70">🖬</span> {(detail.memory / 1024 / 1024).toFixed(1) || 0} MB
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Submissions Pagination */}
                        <div className="flex justify-end items-center gap-3 mt-4 pt-3 border-t border-border/50 text-muted-foreground">
                          <button 
                            className="hover:text-white disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                            disabled={expandedPage === 1}
                            onClick={(e) => { e.stopPropagation(); setExpandedPage(p => p - 1); }}
                          >
                            <ChevronDown size={14} className="rotate-90" />
                          </button>
                          
                          <span className="text-[13px] font-medium min-w-[30px] text-center">
                            {expandedPage}/{Math.ceil(sub.submissions.length / 5) || 1}
                          </span>
                          
                          <button 
                            className="hover:text-white disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
                            disabled={expandedPage >= Math.ceil(sub.submissions.length / 5)}
                            onClick={(e) => { e.stopPropagation(); setExpandedPage(p => p + 1); }}
                          >
                            <ChevronDown size={14} className="rotate-[-90deg]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
        
        {/* Problems Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 py-4 border-t border-border bg-card/50">
            <button 
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-white disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
              disabled={problemPage === 1}
              onClick={() => setProblemPage(p => p - 1)}
            >
              <ChevronDown size={16} className="rotate-90" /> Prev
            </button>
            <span className="text-sm font-semibold text-white">
              {problemPage} / {totalPages}
            </span>
            <button 
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-white disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
              disabled={problemPage >= totalPages}
              onClick={() => setProblemPage(p => p + 1)}
            >
              Next <ChevronDown size={16} className="rotate-[-90deg]" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
