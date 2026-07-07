'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ChevronDown, ChevronUp, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProblemRow } from './table/ProblemRow'
import { DailyChallengeCard } from './table/DailyChallengeCard'
import { CalendarWidget } from './table/CalendarWidget'
import { TrendingCompaniesWidget } from './table/TrendingCompaniesWidget'
import { ActionBar } from './table/ActionBar'
import { Pagination } from './table/Pagination'
import { TableSkeleton } from './table/TableSkeleton'
import { CATEGORIES } from '@/constants/problemCategories'
import { useDebounce } from '@/hooks/useDebounce'
import { useClickOutside } from '@/hooks/useClickOutside'

export function ProblemTable({ initialProblems = [], initialTags = [], initialPagination = { page: 1, totalPages: 1 } }) {
  const [allProblems, setAllProblems] = useState(initialProblems)
  const [pagination, setPagination] = useState(initialPagination)
  const [page, setPage] = useState(initialPagination.page)
  const [tags, setTags] = useState(initialTags)
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(initialProblems.length === 0)
  const [dailyChallenge, setDailyChallenge] = useState(null)
  const [calendarData, setCalendarData] = useState({})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  // Filters State
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortBy, setSortBy] = useState('problemNumber')
  const [sortOrder, setSortOrder] = useState('asc')
  const [activeFilters, setActiveFilters] = useState({})
  
  // UI State
  const [tagsExpanded, setTagsExpanded] = useState(false)
  const [showTags, setShowTags] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  
  const sortRef = useRef(null)
  const filterRef = useRef(null)
  const categoriesRef = useRef(null)
  useClickOutside(sortRef, () => setShowSortDropdown(false))
  useClickOutside(filterRef, () => setShowFilterDropdown(false))

  const abortControllerRef = useRef(null)
  const calendarAbortRef = useRef(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const handleScroll = useCallback(() => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }, [])

  useEffect(() => {
    handleScroll()
    window.addEventListener('resize', handleScroll)
    return () => window.removeEventListener('resize', handleScroll)
  }, [handleScroll, tags])

  const slideCategories = (direction) => {
    if (categoriesRef.current) {
      categoriesRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' })
    }
  }

  const pickRandomProblem = () => {
    if (allProblems.length > 0) {
      const randomIndex = Math.floor(Math.random() * allProblems.length)
      const randomProblem = allProblems[randomIndex]
      window.location.href = `/problems/${randomProblem.slug}`
    }
  }

  const fetchProblems = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (activeCategory && activeCategory !== 'all') {
        params.set('category', activeCategory)
      }
      Object.keys(activeFilters).forEach(key => {
        if (activeFilters[key]) params.set(key, activeFilters[key])
      })
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      params.set('page', page)

      const res = await fetch(`/api/problems?${params}`, { signal: abortController.signal })
      if (res.ok) {
        const data = await res.json()
        setAllProblems(data.data)
        setPagination(data.pagination)
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Failed to fetch problems:', e)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [debouncedSearch, sortBy, sortOrder, activeFilters, activeCategory, page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProblems()
    return () => {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
    }
  }, [fetchProblems])

  // Reset page to 1 on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [debouncedSearch, activeFilters, activeCategory, sortBy, sortOrder])

  const fetchCalendarData = useCallback(async (year, month) => {
    if (calendarAbortRef.current) {
      calendarAbortRef.current.abort()
      calendarAbortRef.current = null
    }
    const abortController = new AbortController()
    calendarAbortRef.current = abortController

    try {
      const res = await fetch(`/api/daily-challenge/calendar?year=${year}&month=${month}`, { signal: abortController.signal })
      if (res.ok) {
        const data = await res.json()
        if (data.calendarData) setCalendarData(data.calendarData)
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error('Failed to fetch calendar:', e)
      }
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCalendarData(currentDate.getFullYear(), currentDate.getMonth() + 1)
    return () => {
      calendarAbortRef.current?.abort()
      calendarAbortRef.current = null
    }
  }, [currentDate, fetchCalendarData])

  useEffect(() => {
    const controllers = []

    if (initialTags.length === 0) {
      const controller = new AbortController()
      controllers.push(controller)
      fetch('/api/tags', { signal: controller.signal })
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.tags) setTags(d.tags) })
        .catch(e => {
          if (e.name !== 'AbortError') console.error('Failed to load tags:', e)
        })
    }

    const compController = new AbortController()
    controllers.push(compController)
    fetch('/api/companies', { signal: compController.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.companies) setCompanies(d.companies) })
      .catch(e => {
        if (e.name !== 'AbortError') console.error('Failed to load companies:', e)
      })

    const dailyController = new AbortController()
    controllers.push(dailyController)
    fetch('/api/daily-challenge', { signal: dailyController.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.dailyChallenge) setDailyChallenge(d.dailyChallenge) })
      .catch(e => {
        if (e.name !== 'AbortError') console.error('Failed to load daily challenge:', e)
      })

    const listsController = new AbortController()
    controllers.push(listsController)
    fetch('/api/lists', { signal: listsController.signal })
      .then(r => r.ok ? r.json() : null)
      .then(d => { 
        if (d?.lists) {
          const favList = d.lists.find(l => l.title === 'Favorite')
          if (favList) {
            setFavoriteIds(new Set(favList.problems.map(p => p.problemId)))
          }
        }
      })
      .catch(e => {
        if (e.name !== 'AbortError') console.error('Failed to load lists:', e)
      })

    return () => controllers.forEach(c => c.abort())
  }, [initialTags])

  const solvedData = useMemo(() => {
    const solvedCount = allProblems.filter(p => p.isSolved).length
    const totalCount = allProblems.length
    const pct = totalCount === 0 ? 0 : (solvedCount / totalCount) * 100
    const r = 6
    const circum = 2 * Math.PI * r
    const offset = circum - (pct / 100) * circum
    return { solvedCount, totalCount, circum, offset, r }
  }, [allProblems])

  const toggleFavorite = async (problemId) => {
    try {
      const res = await fetch('/api/lists/toggle-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, listTitle: 'Favorite' })
      })
      if (res.ok) {
        const data = await res.json()
        setFavoriteIds(prev => {
          const next = new Set(prev)
          if (data.added) next.add(problemId)
          else next.delete(problemId)
          return next
        })
      }
    } catch (e) {
      console.error('Failed to toggle favorite', e)
    }
  }

  return (
    <div className="flex-1 bg-background min-h-screen text-muted-foreground font-sans">
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex gap-6 items-start">
        
        <div className="flex-1 min-w-0">
          <div className="relative mb-6">
            <div className={`flex flex-wrap gap-x-6 gap-y-3 pr-24 ${tagsExpanded ? '' : 'h-7 overflow-hidden'}`}>
              {tags.map((tag) => (
                <button 
                  key={tag.id} 
                  onClick={() => {
                    setActiveFilters(prev => ({ ...prev, tags: tag.id, tagsOp: 'is' }))
                    setSearch('')
                  }}
                  className="flex items-center gap-2 group text-sm text-foreground hover:text-blue-500 transition-colors"
                >
                  <span>{tag.name}</span>
                  <span className="bg-muted text-muted-foreground/70 text-[10px] px-1.5 py-0.5 rounded-full group-hover:bg-accent group-hover:text-foreground transition-colors">
                    {tag._count?.problems || 0}
                  </span>
                </button>
              ))}
            </div>
            {tags.length > 0 && (
              <button 
                onClick={() => setTagsExpanded(!tagsExpanded)}
                className="absolute right-0 top-0 h-7 flex items-center gap-1 text-sm hover:text-white transition-colors bg-background pl-4"
                aria-label={tagsExpanded ? "Collapse Tags" : "Expand Tags"}
              >
                {tagsExpanded ? 'Collapse' : 'Expand'}
                {tagsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>

          <div className="relative flex items-center mb-6 w-full">
            {canScrollLeft && (
              <button 
                onClick={() => slideCategories('left')}
                className="absolute left-0 z-10 h-full flex items-center justify-start bg-gradient-to-r from-background via-background to-transparent pr-8 pl-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Scroll left"
              >
                <div className="bg-card/90 backdrop-blur-sm rounded-full p-1 border border-border/50 shadow-sm">
                  <ChevronLeft size={16} />
                </div>
              </button>
            )}
            
            <div 
              ref={categoriesRef}
              onScroll={handleScroll}
              className="flex items-center gap-3 overflow-x-auto scroll-smooth w-full flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1"
            >
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  aria-pressed={activeCategory === cat.id}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-foreground text-background'
                      : 'bg-card border border-border hover:bg-muted text-foreground'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {canScrollRight && (
              <button 
                onClick={() => slideCategories('right')}
                className="absolute right-0 z-10 h-full flex items-center justify-end bg-gradient-to-l from-background via-background to-transparent pl-8 pr-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Scroll right"
              >
                <div className="bg-card/90 backdrop-blur-sm rounded-full p-1 border border-border/50 shadow-sm">
                  <ChevronRight size={16} />
                </div>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-4 relative z-10">
            <ActionBar 
              search={search} setSearch={setSearch}
              showSortDropdown={showSortDropdown} setShowSortDropdown={setShowSortDropdown} sortRef={sortRef}
              showFilterDropdown={showFilterDropdown} setShowFilterDropdown={setShowFilterDropdown} filterRef={filterRef}
              sortBy={sortBy} setSortBy={setSortBy} sortOrder={sortOrder} setSortOrder={setSortOrder}
              showTags={showTags} setShowTags={setShowTags}
              tags={tags} companies={companies} activeFilters={activeFilters} setActiveFilters={setActiveFilters}
            />

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r={solvedData.r} fill="none" stroke="#3e424a" strokeWidth="2" />
                  <circle 
                    cx="8" cy="8" r={solvedData.r} fill="none" 
                    stroke="#007aff" strokeWidth="2" 
                    strokeDasharray={solvedData.circum} 
                    strokeDashoffset={solvedData.offset} 
                    className="transition-all duration-500 ease-in-out" 
                  />
                </svg>
                <span>{solvedData.solvedCount}/{solvedData.totalCount} Solved</span>
              </div>
              <button onClick={pickRandomProblem} className="hover:text-white transition-colors" title="Pick One">
                <ArrowRightLeft size={16} />
              </button>
            </div>
          </div>

          <div className="bg-background">
            <DailyChallengeCard dailyChallenge={dailyChallenge} />

            {loading ? (
              <TableSkeleton rows={10} />
            ) : (
              <div className="flex flex-col">
                {allProblems.map((problem, idx) => (
                  <ProblemRow 
                    key={problem.id} 
                    problem={problem} 
                    idx={idx} 
                    showTags={showTags} 
                    isFavorited={favoriteIds.has(problem.id)}
                    onToggleFavorite={() => toggleFavorite(problem.id)}
                  />
                ))}
                
                {allProblems.length === 0 && (
                  <div className="py-20 text-center text-muted-foreground">
                    No problems found.
                  </div>
                )}

                <Pagination page={page} setPage={setPage} pagination={pagination} />
              </div>
            )}
          </div>
        </div>

        <div className="w-[300px] shrink-0 hidden lg:flex flex-col gap-6">
          <CalendarWidget 
            currentDate={currentDate} 
            setCurrentDate={setCurrentDate} 
            calendarData={calendarData} 
          />
          <TrendingCompaniesWidget />
        </div>

      </div>
    </div>
  )
}
