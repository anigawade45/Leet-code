'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Trophy, Clock, Users, ArrowRight, Play, CheckCircle2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

export default function ContestOverviewPage({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  // Use simple polling to keep the timer updated
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    fetch(`/api/contests/${params.id}`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(console.error)

    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [params.id])

  const handleRegister = async () => {
    setRegistering(true)
    try {
      const res = await fetch(`/api/contests/${params.id}/register`, { method: 'POST' })
      if (res.ok) {
        setData(prev => ({ ...prev, isRegistered: true }))
      } else if (res.status === 401) {
        alert('Please login to register')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 bg-[#0f0f0f] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#2a9d8f] rounded-full animate-spin" />
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="flex-1 bg-[#0f0f0f] min-h-screen flex items-center justify-center text-white">
        <h1 className="text-2xl font-bold">Contest not found</h1>
      </div>
    )
  }

  const { contest, isRegistered } = data
  const startTime = new Date(contest.startTime)
  const endTime = new Date(contest.endTime)
  const isUpcoming = now < startTime
  const isLive = now >= startTime && now <= endTime
  const isPast = now > endTime

  const formatCountdown = (targetDate) => {
    const diff = targetDate - now
    if (diff <= 0) return '00:00:00'
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex-1 bg-[#0f0f0f] min-h-screen text-white font-sans p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <div className="text-sm text-muted-foreground mb-8">
          <Link href="/contest" className="hover:text-white transition-colors">Contests</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{contest.title}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-background border border-border rounded-2xl p-8 md:p-12 text-center mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a9d8f]/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-4 text-white">{contest.title}</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
              {contest.description || 'Welcome to this coding challenge! Register now to test your skills and climb the leaderboard.'}
            </p>

            {/* Timer Block */}
            <div className="inline-block bg-[#0f0f0f] border border-border rounded-xl px-8 py-6 mb-8">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isUpcoming ? 'Starts In' : isLive ? 'Ends In' : 'Ended'}
              </div>
              <div className={`text-5xl font-mono font-bold tracking-tight ${isLive ? 'text-red-400' : 'text-white'}`}>
                {isUpcoming ? formatCountdown(startTime) : isLive ? formatCountdown(endTime) : '00:00:00'}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-4">
              {isUpcoming && !isRegistered && (
                <button 
                  onClick={handleRegister}
                  disabled={registering}
                  className="bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors w-full max-w-xs"
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </button>
              )}

              {isUpcoming && isRegistered && (
                <div className="flex items-center gap-2 text-[#2a9d8f] font-bold text-lg bg-[#2a9d8f]/10 px-8 py-3 rounded-lg border border-[#2a9d8f]/20">
                  <CheckCircle2 size={24} />
                  Registered Successfully
                </div>
              )}

              {(isLive || isPast) && (
                <Link href={`/contest/${contest.id}/problems`} className="w-full max-w-xs">
                  <button className="bg-[#2a9d8f] hover:bg-[#238678] text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors w-full flex items-center justify-center gap-2">
                    <Play size={20} fill="currentColor" />
                    Enter Contest
                  </button>
                </Link>
              )}

              <Link href={`/contest/${contest.id}/leaderboard`} className="text-muted-foreground hover:text-white text-sm font-medium transition-colors">
                View Leaderboard →
              </Link>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-background border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-blue-400 mb-4">
              <Clock size={20} />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Time & Duration</div>
            <div className="font-bold text-white mb-1">{format(startTime, 'MMM d, yyyy h:mm a')}</div>
            <div className="text-sm font-medium text-white">{contest.duration} Minutes</div>
          </div>

          <div className="bg-background border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-yellow-400 mb-4">
              <Trophy size={20} />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Format</div>
            <div className="font-bold text-white mb-1">{contest._count?.problems || 0} Problems</div>
            <div className="text-sm font-medium text-white">ACM-ICPC Penalty Rules</div>
          </div>

          <div className="bg-background border border-border rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-green-400 mb-4">
              <Users size={20} />
            </div>
            <div className="text-sm text-muted-foreground mb-1">Participation</div>
            <div className="font-bold text-white mb-1">{contest._count?.participants || 0} Registered</div>
            <div className="text-sm font-medium text-white">Global Ranking</div>
          </div>
        </div>

      </div>
    </div>
  )
}
