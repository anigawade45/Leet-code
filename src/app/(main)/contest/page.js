'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy, Clock, Users, ArrowRight, Activity, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'

export default function ContestsPage() {
  const { user } = useAuth()
  const [contests, setContests] = useState({ upcoming: [], live: [], past: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/contests')
      .then(res => res.json())
      .then(data => {
        setContests(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex-1 bg-[#0f0f0f] min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#2a9d8f] rounded-full animate-spin" />
      </div>
    )
  }

  const ContestCard = ({ contest, status }) => {
    const isLive = status === 'live'
    const isUpcoming = status === 'upcoming'
    
    let statusColor = 'text-gray-400'
    let statusBg = 'bg-gray-400/10'
    if (isLive) {
      statusColor = 'text-red-400'
      statusBg = 'bg-red-400/10'
    } else if (isUpcoming) {
      statusColor = 'text-blue-400'
      statusBg = 'bg-blue-400/10'
    }

    return (
      <div className="bg-background border border-border rounded-xl p-6 hover:border-border transition-colors group">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-3 ${statusColor} ${statusBg}`}>
              {isLive && <Activity size={12} className="animate-pulse" />}
              {status}
            </div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#2a9d8f] transition-colors">
              {contest.title}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 max-w-xl">
              {contest.description || 'Join this contest and compete with others on the leaderboard!'}
            </p>
          </div>
          <Link href={`/contest/${contest.id}`}>
            <button className="bg-card hover:bg-muted text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              View Details <ArrowRight size={16} />
            </button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-6 pt-4 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{format(new Date(contest.startTime), 'MMM d, yyyy • h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={16} />
            <span>{contest.duration} Minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>{contest._count?.participants || 0} Participants</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#0f0f0f] min-h-screen text-white font-sans p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contests</h1>
            <p className="text-muted-foreground">Compete against others, improve your rating, and climb the leaderboard.</p>
          </div>
          {user?.role === 'ADMIN' && (
            <Link href="/admin/contests/create">
              <button className="bg-[#2a9d8f] hover:bg-[#238678] text-white px-5 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-[#2a9d8f]/20">
                <Plus size={18} /> Create Contest
              </button>
            </Link>
          )}
        </div>

        {contests.live.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-400">
              <Activity size={20} className="animate-pulse" /> Live Now
            </h2>
            <div className="space-y-4">
              {contests.live.map(c => <ContestCard key={c.id} contest={c} status="live" />)}
            </div>
          </section>
        )}

        {contests.upcoming.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
              Upcoming Contests
            </h2>
            <div className="space-y-4">
              {contests.upcoming.map(c => <ContestCard key={c.id} contest={c} status="upcoming" />)}
            </div>
          </section>
        )}

        {contests.past.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 text-gray-400">Past Contests</h2>
            <div className="space-y-4 opacity-75">
              {contests.past.map(c => <ContestCard key={c.id} contest={c} status="past" />)}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
