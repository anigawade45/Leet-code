import { memo, useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

const MAX_HISTORY = 10
const HISTORY_KEY = 'leetcode-search-history'

export const SearchBar = memo(function SearchBar() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [history, setHistory] = useState([])
  const containerRef = useRef(null)

  useEffect(() => {
    // Load history from localStorage on mount
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) setHistory(JSON.parse(stored))
    } catch (e) {
      console.error('Failed to load search history', e)
    }

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveToHistory = useCallback((query) => {
    if (!query) return
    setHistory(prev => {
      // Remove if it exists to push it to the top
      const filtered = prev.filter(q => q.toLowerCase() !== query.toLowerCase())
      const newHistory = [query, ...filtered].slice(0, MAX_HISTORY)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const handleSearch = useCallback((e) => {
    e?.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      saveToHistory(searchQuery.trim())
      router.push(`/problems?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }, [searchQuery, router, saveToHistory])

  const executeSearch = (query) => {
    setSearchQuery(query)
    setShowSuggestions(false)
    saveToHistory(query)
    router.push(`/problems?search=${encodeURIComponent(query)}`)
  }

  const removeHistoryItem = (e, query) => {
    e.stopPropagation()
    setHistory(prev => {
      const newHistory = prev.filter(q => q !== query)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory))
      return newHistory
    })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem(HISTORY_KEY)
  }

  return (
    <div className="relative hidden lg:block flex-1 max-w-[240px]" ref={containerRef}>
      <form 
        onSubmit={handleSearch}
        className="flex items-center gap-2 bg-card focus-within:bg-card hover:bg-card border border-border transition-colors rounded-full px-3 py-1.5"
      >
        <Search size={16} className="text-muted-foreground shrink-0" />
        <input 
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          className="bg-transparent border-none outline-none text-foreground text-[14px] w-full placeholder:text-muted-foreground"
        />
      </form>

      {showSuggestions && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl py-3 px-4 z-50 min-w-[280px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground">Search History</span>
            <button 
              onClick={clearHistory}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {history.map((query, i) => (
              <button 
                key={i}
                onClick={() => executeSearch(query)}
                className="flex items-center gap-2 bg-background hover:bg-background/80 border border-border transition-colors rounded-full px-3 py-1 text-sm text-foreground group"
              >
                <span className="max-w-[150px] truncate">{query}</span>
                <div 
                  onClick={(e) => removeHistoryItem(e, query)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X size={12} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
