import { Search, ChevronDown, ChevronUp, Check, Filter } from 'lucide-react'
import { ProblemFilterDropdown } from './ProblemFilterDropdown'

const SORT_OPTIONS = [
  { id: 'problemNumber', label: 'Question ID' },
  { id: 'difficulty', label: 'Difficulty' },
  { id: 'submissions', label: 'Acceptance' },
  { id: 'createdAt', label: 'Last Submitted Time' },
  { id: 'tags_toggle', label: 'Tags', isToggle: true, hiddenIcon: true },
]

export function ActionBar({
  search, setSearch,
  showSortDropdown, setShowSortDropdown, sortRef,
  showFilterDropdown, setShowFilterDropdown, filterRef,
  sortBy, setSortBy, sortOrder, setSortOrder,
  showTags, setShowTags,
  tags, companies, activeFilters, setActiveFilters
}) {
  return (
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-muted hover:bg-accent rounded-full px-4 py-2 w-64 transition-colors focus-within:bg-accent">
          <Search size={16} className="text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions"
            className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground w-full"
          />
        </div>

        <div className="relative" ref={sortRef}>
          <button 
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showSortDropdown ? 'bg-accent' : 'bg-muted hover:bg-accent'}`}
            aria-label="Sort options"
          >
            <div className="flex flex-col items-center justify-center -space-y-[3px]">
              <ChevronUp size={14} className="text-muted-foreground" />
              <ChevronDown size={14} className="text-muted-foreground" />
            </div>
          </button>

          {showSortDropdown && (
            <div className="absolute top-12 left-0 w-56 bg-card border border-border rounded-lg shadow-xl py-2 z-50">
              {SORT_OPTIONS.map((opt, i) => {
                const isActive = !opt.isToggle && sortBy === opt.id
                const isChecked = isActive || (opt.isToggle && showTags)
                return (
                  <button 
                    key={i}
                    onClick={() => {
                      if (opt.isToggle) {
                        if (opt.id === 'tags_toggle') setShowTags(!showTags)
                      } else {
                        if (isActive) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                        } else {
                          setSortBy(opt.id)
                          setSortOrder('asc')
                        }
                      }
                      setShowSortDropdown(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-muted transition-colors group text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      {opt.label}
                      {isActive && (
                        <span className="text-[10px] text-muted-foreground">
                          ({sortOrder.toUpperCase()})
                        </span>
                      )}
                    </span>
                    {isChecked && <Check size={16} className="text-foreground" />}
                    {!isChecked && opt.hiddenIcon && <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center"><div className="w-3 h-[1px] bg-border rotate-45" /></div>}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="relative" ref={filterRef}>
          <button 
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showFilterDropdown ? 'bg-accent' : 'bg-muted hover:bg-accent'}`}
            aria-label="Filter options"
          >
            <Filter size={16} className="text-muted-foreground" />
          </button>

          {showFilterDropdown && (
            <ProblemFilterDropdown 
              availableTags={tags}
              availableCompanies={companies}
              initialFilters={activeFilters}
              onApply={(newFilters) => setActiveFilters(newFilters)}
              onReset={() => setActiveFilters({})}
            />
          )}
        </div>
      </div>
    </div>
  )
}
