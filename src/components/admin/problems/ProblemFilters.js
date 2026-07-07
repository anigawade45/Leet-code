import { Search, SlidersHorizontal } from 'lucide-react'
import { memo } from 'react'

export const ProblemFilters = memo(function ProblemFilters({ 
  status, setStatus, 
  search, setSearch, 
  sortBy, setSortBy, 
  sortOrder, setSortOrder,
  searchRef
}) {
  const TABS = [
    { key: null, label: 'All' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
  ]

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      {/* Tabs */}
      <div className="flex p-1 bg-[#2a2e35]/50 rounded-xl overflow-x-auto w-full md:w-auto">
        {TABS.map(tab => (
          <button
            key={tab.key || 'all'}
            onClick={() => setStatus(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
              status === tab.key
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#2a2e35]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Sort */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            ref={searchRef}
            type="text" 
            placeholder="Search title, author, slug..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground ml-2" />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-sm py-2 px-1 focus:outline-none text-foreground cursor-pointer"
          >
            <option value="createdAt" className="bg-card">Date</option>
            <option value="difficulty" className="bg-card">Difficulty</option>
            <option value="problemNumber" className="bg-card">ID</option>
          </select>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            className="bg-transparent text-sm py-2 pr-2 focus:outline-none text-foreground cursor-pointer"
          >
            <option value="desc" className="bg-card">↓</option>
            <option value="asc" className="bg-card">↑</option>
          </select>
        </div>
      </div>
    </div>
  )
})
