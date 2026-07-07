'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Activity, ListOrdered, Users, TerminalSquare, 
  Trophy, Settings, BarChart3, ChevronLeft 
} from 'lucide-react'

export default function AdminContestLayout({ children, params: paramsPromise }) {
  const params = use(paramsPromise)
  const pathname = usePathname()
  const [contest, setContest] = useState(null)

  useEffect(() => {
    fetch(`/api/admin/contests/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.contest) setContest(d.contest)
      })
      .catch(console.error)
  }, [params.id])

  if (!contest) return <div className="min-h-screen bg-background" />

  const links = [
    { name: 'Overview', href: `/admin/contests/${params.id}/overview`, icon: Activity },
    { name: 'Problems', href: `/admin/contests/${params.id}/problems`, icon: ListOrdered },
    { name: 'Participants', href: `/admin/contests/${params.id}/participants`, icon: Users },
    { name: 'Submissions', href: `/admin/contests/${params.id}/submissions`, icon: TerminalSquare },
    { name: 'Leaderboard', href: `/admin/contests/${params.id}/leaderboard`, icon: Trophy },
    { name: 'Results', href: `/admin/contests/${params.id}/results`, icon: BarChart3 },
    { name: 'Settings', href: `/admin/contests/${params.id}/settings`, icon: Settings },
  ]

  return (
    <div className="flex bg-background min-h-screen text-white font-sans">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-[#212121] flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/admin/contests" className="text-muted-foreground hover:text-white mb-4 inline-flex items-center text-sm font-semibold transition-colors">
            <ChevronLeft size={16} className="mr-1" /> All Contests
          </Link>
          <h2 className="text-xl font-bold truncate" title={contest.title}>{contest.title}</h2>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">
            Contest Management
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map(link => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            const Icon = link.icon
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-[#2a9d8f]/20 text-[#2a9d8f]' : 'text-muted-foreground hover:bg-card hover:text-white'
                }`}
              >
                <Icon size={18} /> {link.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-background">
        {children}
      </div>
    </div>
  )
}
