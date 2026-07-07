import { memo } from 'react'
import Link from 'next/link'
import { Check, X, Pencil, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const ProblemRow = memo(function ProblemRow({ 
  problem, 
  isSelected, 
  onToggleSelect, 
  onApprove, 
  onReject, 
  onDelete, 
  actionLoading 
}) {
  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Easy</span>
      case 'MEDIUM': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>Medium</span>
      case 'HARD': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Hard</span>
      default: return null
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED': return <span className="text-green-400 font-medium">Approved</span>
      case 'REJECTED': return <span className="text-red-400 font-medium">Rejected</span>
      default: return <span className="text-yellow-400 font-medium">Pending</span>
    }
  }

  const isLoading = actionLoading === problem.id

  return (
    <div className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-border transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-[#2a2e35]/30'}`}>
      <div className="col-span-4 flex items-center gap-4">
        <input 
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(problem.id)}
          aria-label={`Select ${problem.title}`}
          className="w-4 h-4 rounded border-border bg-card accent-primary cursor-pointer"
        />
        <div>
          <h3 className="font-semibold text-foreground">
            <Link href={`/problems/${problem.slug}`} className="hover:text-primary transition-colors">
              {problem.problemNumber}. {problem.title}
            </Link>
          </h3>
          <p className="text-muted-foreground text-xs mt-1">
            {problem.slug} • {problem.category}
          </p>
        </div>
      </div>
      
      <div className="col-span-2 flex items-center">
        <span className="text-muted-foreground font-medium text-sm">
          {problem.author?.username || 'System'}
        </span>
      </div>
      
      <div className="col-span-1">
        {getDifficultyBadge(problem.difficulty)}
      </div>
      
      <div className="col-span-1">
        {getStatusBadge(problem.status)}
      </div>
      
      <div className="col-span-2">
        <span className="text-muted-foreground text-xs" title={new Date(problem.createdAt).toLocaleString()}>
          {formatDistanceToNow(new Date(problem.createdAt), { addSuffix: true })}
        </span>
      </div>
      
      <div className="col-span-2 flex items-center justify-end gap-2">
        {problem.status === 'PENDING' && (
          <>
            <button
              onClick={() => onApprove(problem.id, problem.title)}
              disabled={isLoading}
              className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => onReject(problem.id, problem.title)}
              disabled={isLoading}
              className="p-1.5 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reject"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        )}
        <Link
          href={`/admin/problems/edit?id=${problem.id}`}
          className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(problem)}
          disabled={isLoading}
          className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
})
