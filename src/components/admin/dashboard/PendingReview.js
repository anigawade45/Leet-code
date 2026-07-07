'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle, Clock3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const getDifficultyBadge = (difficulty) => {
  switch (difficulty) {
    case 'EASY': return <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">EASY</span>
    case 'MEDIUM': return <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">MEDIUM</span>
    case 'HARD': return <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">HARD</span>
    default: return <span className="px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-semibold">UNKNOWN</span>
  }
}

export function PendingReview({ recentPending, stats, search }) {
  const filteredPending = useMemo(() => {
    if (!search) return recentPending
    return recentPending.filter(problem => 
      problem.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [recentPending, search])

  return (
    <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Pending Review</h2>
          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">
            {stats?.pending || 0}
          </span>
        </div>
        {recentPending.length > 0 && (
          <Link href="/admin/problems?status=PENDING" className="text-sm text-[#2a9d8f] hover:text-[#34d399] transition-colors font-medium">
            View all →
          </Link>
        )}
      </div>

      {filteredPending.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center bg-background rounded-xl border border-dashed border-border">
          <CheckCircle className="w-10 h-10 text-green-500 mb-2 opacity-80" />
          <p className="text-white font-medium">✅ No pending reviews matching '{search || 'queue'}'</p>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Everything has been reviewed or nothing matches your search.</p>
          <Link href="/admin/problems" className="text-xs px-3 py-1.5 rounded-lg bg-[#2B2F36] hover:bg-muted transition-colors font-medium">
            Go to Problems
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPending.map((problem) => (
            <Link key={problem.id} href={`/admin/problems/${problem.slug}/edit`} className="block p-4 rounded-xl bg-background border border-border hover:border-[#2a9d8f]/50 hover:bg-[#2B2F36]/30 transition-all group">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold group-hover:text-[#2a9d8f] transition-colors line-clamp-1">{problem.title}</p>
                {getDifficultyBadge(problem.difficulty)}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#8b5cf6] bg-[#8b5cf6]/10 px-2 py-1 rounded-md">
                    {problem.category || 'Algorithm'}
                  </span>
                  <p className="text-xs text-muted-foreground">by <span className="text-muted-foreground font-medium">{problem.author?.username || 'Unknown'}</span></p>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {problem.createdAt ? formatDistanceToNow(new Date(problem.createdAt), { addSuffix: true }) : 'Recently'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
