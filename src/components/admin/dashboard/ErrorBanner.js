import { AlertTriangle } from 'lucide-react'

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null

  return (
    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center justify-between text-red-400">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        <span className="text-sm font-semibold">Failed to load dashboard: {error}</span>
      </div>
      <button 
        onClick={onRetry} 
        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
