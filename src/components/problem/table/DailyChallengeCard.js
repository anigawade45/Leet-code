import Link from 'next/link'
import { Calendar, Lock, Star } from 'lucide-react'

export function DailyChallengeCard({ dailyChallenge }) {
  if (!dailyChallenge) return null
  
  return (
    <Link href={`/problems/${dailyChallenge.problem.slug}`} className="block mb-2 group">
      <div className="bg-card hover:bg-muted transition-colors rounded-xl flex items-center justify-between p-4 px-6 border border-border/30">
        <div className="flex items-center gap-4">
          <Calendar size={18} className="text-blue-500" />
          <span className="font-semibold text-foreground group-hover:text-blue-400 transition-colors">
            {dailyChallenge.problem.problemNumber}. {dailyChallenge.problem.title}
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-muted-foreground">{dailyChallenge.problem.acceptanceRate}%</span>
          <span className={`w-12 text-center font-medium ${
            dailyChallenge.problem.difficulty === 'EASY' ? 'text-[#00b8a3]' :
            dailyChallenge.problem.difficulty === 'MEDIUM' ? 'text-[#ffc01e]' :
            'text-[#ff375f]'
          }`}>
            {dailyChallenge.problem.difficulty === 'EASY' ? 'Easy' : dailyChallenge.problem.difficulty === 'MEDIUM' ? 'Med.' : 'Hard'}
          </span>
          <div className="flex items-center gap-3 text-muted-foreground">
            <Lock size={16} />
            <Star size={16} className="hover:text-[#ffc01e] transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  )
}
