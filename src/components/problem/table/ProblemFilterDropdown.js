import { useState, useEffect } from 'react'
import { ChevronDown, Check, Database, Layers, FileCode, Trash2, ArrowRightLeft, Lock } from 'lucide-react'

export function ProblemFilterDropdown({ 
  onApply, 
  onReset,
  availableTags = [],
  availableCompanies = [],
  initialFilters = {}
}) {
  const [filters, setFilters] = useState([
    { id: 'status', label: 'Status', icon: <Check size={14} />, op: initialFilters.statusOp || 'is', val: initialFilters.status || '', options: [{v: 'solved', l: 'Solved'}, {v: 'unsolved', l: 'Unsolved'}] },
    { id: 'difficulty', label: 'Difficulty', icon: <Database size={14} />, op: initialFilters.difficultyOp || 'is', val: initialFilters.difficulty || '', options: [{v: 'EASY', l: 'Easy'}, {v: 'MEDIUM', l: 'Medium'}, {v: 'HARD', l: 'Hard'}] },
    { id: 'tags', label: 'Topics', icon: <Layers size={14} />, op: initialFilters.tagsOp || 'is', val: initialFilters.tags || '', options: availableTags.map(t => ({v: t.id, l: t.name})) },
    { id: 'companies', label: 'Companies', icon: <Lock size={14} />, op: initialFilters.companiesOp || 'is', val: initialFilters.companies || '', options: availableCompanies.map(c => ({v: c.id, l: c.name})) },
    { id: 'language', label: 'Language', icon: <FileCode size={14} />, op: initialFilters.languageOp || 'is', val: initialFilters.language || '', options: [{v: 'javascript', l: 'JavaScript'}, {v: 'python', l: 'Python'}, {v: 'java', l: 'Java'}, {v: 'cpp', l: 'C++'}] },
  ])

  const [matchType, setMatchType] = useState(initialFilters.matchType || 'all')

  const updateFilter = (index, key, value) => {
    const newFilters = [...filters]
    newFilters[index][key] = value
    setFilters(newFilters)
  }

  const clearFilter = (index) => {
    const newFilters = [...filters]
    newFilters[index].val = ''
    newFilters[index].op = 'is'
    setFilters(newFilters)
  }

  // Auto-apply when changes happen
  useEffect(() => {
    const activeFilters = {}
    filters.forEach(f => {
      if (f.val) {
        activeFilters[f.id] = f.val
        activeFilters[`${f.id}Op`] = f.op
      }
    })
    activeFilters.matchType = matchType
    onApply(activeFilters)
  }, [filters, matchType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setFilters(filters.map(f => ({ ...f, val: '', op: 'is' })))
    setMatchType('all')
    onReset()
  }

  return (
    <div className="absolute top-12 left-0 w-[500px] bg-card border border-border rounded-xl shadow-xl p-4 z-50">
      <div className="flex items-center gap-2 text-sm mb-6 text-foreground">
        <span>Match</span>
        <select 
          value={matchType}
          onChange={e => setMatchType(e.target.value)}
          className="bg-muted hover:bg-accent px-3 py-1.5 rounded-md w-24 outline-none cursor-pointer appearance-none text-center"
        >
          <option value="all" className="bg-card text-foreground">All</option>
          <option value="any" className="bg-card text-foreground">Any</option>
        </select>
        <span>of the following filters:</span>
      </div>

      <div className="space-y-4 mb-4">
        {filters.map((row, i) => (
          <div key={row.id} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-28 text-sm text-muted-foreground">
              {row.icon}
              {row.label}
            </div>
            
            <select 
              value={row.op}
              onChange={e => updateFilter(i, 'op', e.target.value)}
              className="bg-muted hover:bg-accent px-3 py-1.5 rounded-md w-24 text-sm text-foreground outline-none cursor-pointer appearance-none"
            >
              <option value="is" className="bg-card text-foreground">is</option>
              <option value="is_not" className="bg-card text-foreground">is not</option>
            </select>

            <select 
              value={row.val}
              onChange={e => updateFilter(i, 'val', e.target.value)}
              className="flex-1 bg-muted hover:bg-accent px-3 py-1.5 rounded-md text-sm text-foreground outline-none cursor-pointer appearance-none"
            >
              <option value="" className="bg-card text-foreground">Any</option>
              {row.options.map(o => (
                <option key={o.v} value={o.v} className="bg-card text-foreground">{o.l}</option>
              ))}
            </select>

            <button 
              onClick={() => clearFilter(i)}
              className={`text-muted-foreground/70 hover:text-foreground transition-opacity ${row.val ? 'opacity-100' : 'opacity-0 cursor-default'}`}
              disabled={!row.val}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      
      <button className="text-sm text-muted-foreground hover:text-white flex items-center gap-1 mb-6">
        + <span className="underline">Add filter</span>
      </button>

      <div className="border-t border-border pt-4 mt-6">
        <button 
          onClick={handleReset}
          className="w-full py-2 flex items-center justify-center gap-2 bg-muted hover:bg-accent text-white rounded-lg transition-colors text-sm font-medium"
        >
          <ArrowRightLeft size={14} /> Reset
        </button>
      </div>
    </div>
  )
}
