import { Search, ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function TrendingCompaniesWidget() {
  const [searchTerm, setSearchTerm] = useState('')
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef(null)

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch('/api/companies')
        if (res.ok) {
          const data = await res.json()
          if (data.companies) {
            setCompanies(data.companies)
          }
        }
      } catch (e) {
        console.error('Failed to fetch companies:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  const filtered = companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="w-full h-[550px] shrink-0 bg-card rounded-xl p-4 flex flex-col relative text-sm border border-border">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="font-semibold text-foreground text-[15px]">Trending Companies</h3>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button className="p-1 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      <div className="relative mb-5 shrink-0">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
          <Search size={14} />
        </div>
        <input 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for a company..."
          className="w-full bg-muted text-foreground text-[13px] placeholder:text-muted-foreground/70 rounded-md py-2 pl-9 pr-3 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div 
        ref={containerRef}
        className="flex flex-wrap gap-2.5 pb-12 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {filtered.map(c => (
          <button key={c.name} className="flex items-center gap-2 bg-muted hover:brightness-110 transition-all rounded-full pl-3 pr-1 py-1 text-[13px] text-foreground font-medium">
            <span>{c.name}</span>
            <span className="bg-[#ffa116] text-[#282828] font-bold rounded-full px-1.5 py-0.5 text-[11px] leading-none flex items-center justify-center min-w-[24px]">
              {c.count}
            </span>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="text-center w-full text-xs text-muted-foreground py-4">No companies found.</div>
        )}
      </div>

      <button 
        onClick={scrollToTop}
        className="absolute bottom-4 right-4 bg-muted/90 backdrop-blur hover:bg-muted p-2 rounded-full text-foreground shadow-lg transition-colors border border-border/50 z-10"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  )
}
