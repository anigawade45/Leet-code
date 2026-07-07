'use client'

import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'

export function AddQuestionsModal({ list, isOpen, onClose, onAdd }) {
  const [search, setSearch] = useState('')
  const [problems, setProblems] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch problems when modal opens
  useEffect(() => {
    if (isOpen && problems.length === 0) {
      setIsLoading(true)
      fetch('/api/problems?limit=500')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setProblems(data.data)
          }
        })
        .catch(err => console.error('Error fetching problems:', err))
        .finally(() => setIsLoading(false))
    }
  }, [isOpen])

  if (!isOpen) return null

  // Exclude problems that are already in the list
  const existingIds = new Set(list?.problems?.map(p => p.id) || [])
  const availableProblems = problems.filter(p => !existingIds.has(p.id))
  
  const filteredProblems = availableProblems.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.problemNumber.toString().includes(search)
  )

  const toggleSelection = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSave = async () => {
    if (selectedIds.size === 0) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/lists/${list.id}/add-problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemIds: Array.from(selectedIds) })
      })
      if (res.ok) {
        onAdd() // callback to refresh list
        onClose()
        setSelectedIds(new Set())
      } else {
        console.error('Failed to add problems')
      }
    } catch (error) {
      console.error('Error saving list', error)
    } finally {
      setIsSaving(false)
    }
  }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 py-12">
      <div className="bg-[#282828] w-full max-w-3xl h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/10 shrink-0">
          <h2 className="text-lg font-semibold text-white">Add Questions</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 bg-[#3e3e3e] border border-transparent focus:border-blue-500 rounded-full pl-9 pr-4 py-2 text-sm text-white outline-none transition-colors"
              placeholder="Search questions"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-10">Loading questions...</div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredProblems.map((p) => {
                const isSelected = selectedIds.has(p.id)
                return (
                  <div 
                    key={p.id}
                    onClick={() => toggleSelection(p.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                      isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 flex justify-center">
                        {/* Mocking solved status for simplicity in modal, in real app we might fetch user progress */}
                        {p.isSolved && <span className="text-[#2cbb5d] text-xs">✓</span>}
                      </div>
                      <span className="text-[15px] font-medium text-white">
                        <span className="text-muted-foreground font-normal">{p.problemNumber}.</span> {p.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-sm ${getDifficultyColor(p.difficulty)}`}>
                        {getDifficultyLabel(p.difficulty)}
                      </span>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected 
                          ? 'bg-blue-500 border-blue-500 text-white' 
                          : 'border-muted-foreground/50 text-transparent'
                      }`}>
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredProblems.length === 0 && (
                <div className="text-center text-muted-foreground py-10">No questions found.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/10 flex items-center justify-end shrink-0 bg-[#282828]">
          <button 
            onClick={handleSave}
            disabled={isSaving || selectedIds.size === 0}
            className="px-5 py-2 text-sm font-medium bg-white text-black hover:bg-white/90 disabled:opacity-50 rounded-full transition-colors"
          >
            {isSaving ? 'Adding...' : 'Add to List'}
          </button>
        </div>

      </div>
    </div>
  )
}
