import Link from 'next/link'
import { Trophy } from 'lucide-react'

export function ContestBanner() {
  return (
    <div className="flex flex-col gap-1 mb-8">
      <Link href="/contest" className="flex items-center gap-4 py-3 border-b border-border/50 hover:bg-card transition-colors rounded-lg px-2 group">
        <Trophy className="text-[#ffa116]" size={28} />
        <div>
          <div className="text-sm text-muted-foreground mb-0.5">in 2 days</div>
          <div className="text-[15px] font-semibold">
            <span className="text-foreground group-hover:text-primary transition-colors">Join our next Contest</span> <span className="text-primary">Biweekly Contest 186</span>
          </div>
        </div>
      </Link>
      <Link href="/contest" className="flex items-center gap-4 py-3 border-b border-border/50 hover:bg-card transition-colors rounded-lg px-2 group">
        <Trophy className="text-[#ffa116]" size={28} />
        <div>
          <div className="text-sm text-muted-foreground mb-0.5">in 3 days</div>
          <div className="text-[15px] font-semibold">
            <span className="text-foreground group-hover:text-primary transition-colors">Join our next Contest</span> <span className="text-primary">Weekly Contest 509</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
