import { memo } from 'react'
import { Check, X, Trash2, ArrowLeft, ArrowRight, MoreHorizontal } from 'lucide-react'

export const ProblemToolbar = memo(function ProblemToolbar({
  selectedCount,
  pagination,
  setPage,
  onBulkApprove,
  onBulkReject,
  onBulkDelete
}) {
  const generatePages = () => {
    const total = pagination.totalPages || 1
    const current = pagination.page
    const pages = []

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(total)
      } else if (current >= total - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = total - 4; i <= total; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(current - 1, current, current + 1)
        pages.push('...')
        pages.push(total)
      }
    }
    return pages
  }

  return (
    <div className="border-t border-border bg-[#181a20]/50 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{selectedCount} selected</span>
            <div className="h-4 w-px bg-border mx-2"></div>
            <button onClick={onBulkApprove} className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded transition-colors flex items-center gap-1"><Check className="w-3 h-3" /> Approve</button>
            <button onClick={onBulkReject} className="text-xs px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Reject</button>
            <button onClick={onBulkDelete} className="text-xs px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            Total {pagination.total || 0} problems
          </span>
        )}
      </div>
      
      {pagination.totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevious}
            className="p-1 rounded hover:bg-[#2a2e35] disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {generatePages().map((p, i) => (
            p === '...' ? (
              <span key={`dots-${i}`} className="w-8 flex justify-center items-center text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors flex items-center justify-center ${
                  pagination.page === p
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-[#2a2e35] text-muted-foreground hover:text-foreground'
                }`}
              >
                {p}
              </button>
            )
          ))}

          <button 
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={!pagination.hasNext}
            className="p-1 rounded hover:bg-[#2a2e35] disabled:opacity-50 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
})
