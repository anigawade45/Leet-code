import { memo } from 'react'
import Link from 'next/link'
import { List, Book, PieChart, Coins } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export const ProfileGrid = memo(function ProfileGrid({ onClose }) {
  const { user } = useAuth()
  return (
    <div className="grid grid-cols-2 gap-2 p-3 border-b border-border">
      <Link href={user ? `/problem-list/${user.username}` : '/login'} onClick={onClose} className="flex flex-col items-center gap-1.5 p-2 bg-background hover:bg-background/80 rounded-lg transition-colors group">
        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500/20 transition-colors">
          <List size={16} />
        </div>
        <span className="text-muted-foreground text-xs">My Lists</span>
      </Link>
      <Link href="/notes" onClick={onClose} className="flex flex-col items-center gap-1.5 p-2 bg-background hover:bg-background/80 rounded-lg transition-colors group">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500/20 transition-colors">
          <Book size={16} />
        </div>
        <span className="text-muted-foreground text-xs">Notebook</span>
      </Link>
      <Link href="/progress" onClick={onClose} className="flex flex-col items-center gap-1.5 p-2 bg-background hover:bg-background/80 rounded-lg transition-colors group">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500/20 transition-colors">
          <PieChart size={16} />
        </div>
        <span className="text-muted-foreground text-xs">Progress</span>
      </Link>
      <Link href="/points" onClick={onClose} className="flex flex-col items-center gap-1.5 p-2 bg-background hover:bg-background/80 rounded-lg transition-colors group">
        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500/20 transition-colors">
          <Coins size={16} />
        </div>
        <span className="text-muted-foreground text-xs">Points</span>
      </Link>
    </div>
  )
})
