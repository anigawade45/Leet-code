'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock } from 'lucide-react'

export default function ContestLayout({ children, params: paramsPromise }) {
  const params = use(paramsPromise)
  const pathname = usePathname()
  const [contest, setContest] = useState(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetch(`/api/contests/${params.id}`)
      .then(res => res.json())
      .then(d => setContest(d.contest))
      .catch(console.error)

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [params.id])

  if (!contest) return <div className="min-h-screen bg-[#0f0f0f]" />

  const startTime = new Date(contest.startTime)
  const endTime = new Date(contest.endTime)
  const isLive = now >= startTime && now <= endTime
  const isUpcoming = now < startTime

  const formatCountdown = (targetDate) => {
    const diff = targetDate - now
    if (diff <= 0) return '00:00:00'
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const navLinks = [
    { name: 'Overview', href: `/contest/${params.id}` },
    { name: 'Problems', href: `/contest/${params.id}/problems` }
  ]

  if (contest.showLiveLeaderboard || now > endTime) {
    navLinks.push({ name: 'Leaderboard', href: `/contest/${params.id}/leaderboard` })
  }

  if (contest.enableDiscussion) {
    navLinks.push({ name: 'Discussion', href: `/contest/${params.id}/discussion` })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f] text-white font-sans">
      {/* Top Navbar specifically for contest */}
      <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-6">
          <Link href="/contest" className="text-muted-foreground hover:text-white font-bold tracking-tight">
            ← {contest.title}
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.name === 'Problems')
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-muted/50 text-white' : 'text-muted-foreground hover:text-white hover:bg-card'
                  }`}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3 bg-[#0f0f0f] border border-border/50 px-3 py-1.5 rounded-lg">
          <Clock size={16} className={isLive ? 'text-red-400 animate-pulse' : 'text-muted-foreground'} />
          <span className={`font-mono text-sm font-bold tracking-wider ${isLive ? 'text-red-400' : isUpcoming ? 'text-blue-400' : 'text-muted-foreground'}`}>
            {isUpcoming ? formatCountdown(startTime) : isLive ? formatCountdown(endTime) : 'Ended'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
