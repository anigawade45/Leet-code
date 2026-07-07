'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SaveToListModal({ problem, onClose }) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [error, setError] = useState('')
  
  const router = useRouter()

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists')
      const data = await res.json()
      if (data.success) {
        setLists(data.lists)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLists()
  }, [])

  const handleToggle = async (list) => {
    try {
      // Optimistically update UI
      const isCurrentlyInList = list.problems?.some(p => p.problemId === problem.id)
      
      setLists(prev => prev.map(l => {
        if (l.id === list.id) {
          if (isCurrentlyInList) {
            return { ...l, problems: l.problems.filter(p => p.problemId !== problem.id) }
          } else {
            return { ...l, problems: [...(l.problems || []), { problemId: problem.id }] }
          }
        }
        return l
      }))

      const res = await fetch('/api/lists/toggle-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: list.title, problemId: problem.id })
      })
      
      if (!res.ok) {
        // Revert on failure
        fetchLists()
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      fetchLists()
    }
  }

  const handleCreateList = async (e) => {
    e.preventDefault()
    if (!newListTitle.trim()) return

    setCreating(true)
    setError('')
    try {
      // Create list
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newListTitle.trim(), isPublic: false })
      })
      
      const data = await res.json()
      if (res.ok && data.success) {
        // After creating, automatically add the problem to it
        await fetch('/api/lists/toggle-problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newListTitle.trim(), problemId: problem.id })
        })
        
        setNewListTitle('')
        fetchLists()
        router.refresh()
      } else {
        setError(data.message || 'Failed to create list')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Save to List</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {lists.map(list => {
                const isInList = list.problems?.some(p => p.problemId === problem.id)
                return (
                  <button
                    key={list.id}
                    onClick={() => handleToggle(list)}
                    className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                  >
                    <span className="text-sm font-medium text-foreground">{list.title}</span>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isInList ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground group-hover:border-foreground'}`}>
                      {isInList && <Check size={14} />}
                    </div>
                  </button>
                )
              })}
              {lists.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  You don't have any lists yet.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/30">
          <form onSubmit={handleCreateList} className="flex gap-2">
            <input
              type="text"
              placeholder="Create new list..."
              value={newListTitle}
              onChange={e => setNewListTitle(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={creating || !newListTitle.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Create
            </button>
          </form>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
