import Link from 'next/link'
import { Check, Star } from 'lucide-react'

export function ProblemRow({ problem, idx, showTags, isFavorited = false, onToggleFavorite }) {
  const isEven = idx % 2 !== 0
  const isSolved = problem.isSolved || false
  
  let acceptance = '-'
  if (problem.submissions && problem._count?.submissions > 0) {
    const total = problem._count.submissions
    const accepted = problem.submissions.filter(s => s.status === 'ACCEPTED').length
    acceptance = ((accepted / total) * 100).toFixed(1) + '%'
  }

  let diffColor = 'text-[#2cbb5d]'
  let diffLabel = 'Easy'
  if (problem.difficulty === 'MEDIUM') { diffColor = 'text-[#ffc01e]'; diffLabel = 'Med.' }
  if (problem.difficulty === 'HARD') { diffColor = 'text-[#ff375f]'; diffLabel = 'Hard' }

  return (
    <Link
      href={`/problems/${problem.slug}`}
      className={`flex items-center px-4 py-3 group ${isEven ? 'bg-background' : 'bg-card'} hover:bg-muted transition-colors rounded`}
    >
      <div className="w-8 flex-shrink-0">
        {isSolved && <Check size={16} className="text-[#2cbb5d]" />}
      </div>

      <div className="flex-1 text-[15px] font-medium text-foreground group-hover:text-primary transition-colors flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          {problem.problemNumber}. {problem.title}
        </div>
        {showTags && problem.tags && problem.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {problem.tags.map(pt => (
              <span key={pt.tag.id} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full group-hover:text-foreground transition-colors">
                {pt.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm">
        <span className="w-12 text-right text-muted-foreground">{acceptance}</span>
        <span className={`w-12 text-center ${diffColor}`}>{diffLabel}</span>
        <div className="w-16 flex items-center justify-end gap-3 text-muted-foreground">
          <button 
            onClick={(e) => {
              e.preventDefault()
              if (onToggleFavorite) onToggleFavorite()
            }}
            className={`transition-colors ${isFavorited ? 'text-[#ffc01e]' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Star size={16} className={isFavorited ? 'fill-current' : ''} />
          </button>
        </div>
      </div>
    </Link>
  )
}
