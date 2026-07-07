import { AlertTriangle, X } from 'lucide-react'

export function DeleteDialog({ isOpen, problems, onClose, onConfirm, isDeleting }) {
  if (!isOpen || !problems || problems.length === 0) return null

  const isBulk = problems.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete {isBulk ? 'Problems' : 'Problem'}?
          </h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 text-muted-foreground text-sm space-y-4">
          <p>
            Are you sure you want to permanently delete {isBulk ? (
              <strong className="text-foreground">{problems.length} problems</strong>
            ) : (
              <strong className="text-foreground">{problems[0].title}</strong>
            )}?
          </p>
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 font-medium flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>This cannot be undone. All submissions and test cases associated with {isBulk ? 'these problems' : 'this problem'} will also be deleted.</p>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-[#181a20]/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a2e35] transition-colors text-foreground"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
