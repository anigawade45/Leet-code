import { useEffect } from 'react'

export function useProblemShortcuts({
  selectedIds,
  problems,
  searchRef,
  onApprove,
  onReject,
  onDelete
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K for search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
      
      // Ignore other shortcuts if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      // Handle shortcuts only when there are selected items
      if (selectedIds.size > 0) {
        if (e.key === 'Delete') {
          onDelete()
        }
        if (e.key === 'a' || e.key === 'A') {
          onApprove()
        }
        if (e.key === 'r' || e.key === 'R') {
          onReject()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, problems, searchRef, onApprove, onReject, onDelete])
}
