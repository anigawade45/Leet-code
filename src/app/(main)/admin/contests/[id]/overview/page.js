'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { Activity, Users, CheckCircle2, TerminalSquare, Clock, Loader2 } from 'lucide-react'

export default function AdminContestOverview({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [now, setNow] = useState(new Date())

  const fetchData = useCallback(() => {
    fetch(`/api/admin/contests/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.contest) setData(d.contest)
      })
      .catch(console.error)

    fetch(`/api/admin/contests/${params.id}/submissions?limit=1`)
      .then(res => res.json())
      .then(d => {
        if (d.stats) setStats(d.stats)
      })
      .catch(console.error)
  }, [params.id])

  useEffect(() => {
    fetchData()
    const pollTimer = setInterval(fetchData, 5000)
    const clockTimer = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(pollTimer)
      clearInterval(clockTimer)
    }
  }, [fetchData])

  if (!data || !stats) {
    return <div className="p-8 text-muted-foreground">Loading overview...</div>
  }

  const start = new Date(data.startTime)
  const end = new Date(data.endTime)
  const isLive = now >= start && now <= end
  const isPast = now > end

  const formatCountdown = (diff) => {
    if (diff <= 0) return '00:00:00'
    const h = Math.floor(diff / (1000 * 60 * 60))
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((diff % (1000 * 60)) / 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Live Monitor</h1>
          <p className="text-muted-foreground">Real-time statistics for this contest.</p>
        </div>
        <div className="bg-[#212121] border border-border rounded-lg px-6 py-3 flex items-center gap-4">
          <Clock size={20} className="text-muted-foreground" />
          <div className="font-mono text-xl font-bold tracking-wider text-white">
            {isLive ? formatCountdown(end - now) : isPast ? 'Ended' : formatCountdown(start - now)}
          </div>
          {isLive && <div className="px-2 py-1 bg-red-400/10 text-red-400 text-xs font-bold uppercase tracking-wider rounded animate-pulse">Live</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#212121] border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users size={64} />
          </div>
          <div className="text-muted-foreground text-sm font-semibold mb-2">Participants</div>
          <div className="text-3xl font-bold text-white">{data._count?.participants || 0}</div>
        </div>

        <div className="bg-[#212121] border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TerminalSquare size={64} />
          </div>
          <div className="text-muted-foreground text-sm font-semibold mb-2">Submissions</div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>

        <div className="bg-[#212121] border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-green-400">
            <CheckCircle2 size={64} />
          </div>
          <div className="text-muted-foreground text-sm font-semibold mb-2">Accepted</div>
          <div className="text-3xl font-bold text-green-400">{stats.accepted}</div>
        </div>

        <div className="bg-[#212121] border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-400">
            <Loader2 size={64} />
          </div>
          <div className="text-muted-foreground text-sm font-semibold mb-2">Queue (Pending)</div>
          <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
      </div>

      {/* Basic Platform Health / Debug Info */}
      <div className="bg-[#212121] border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity size={20} className="text-[#2a9d8f]" /> Platform Health
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-muted-foreground text-sm mb-1">Avg Accepted Runtime</div>
            <div className="text-xl font-bold text-white">{stats.avgRuntime} ms</div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Acceptance Rate</div>
            <div className="text-xl font-bold text-white">
              {stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-sm mb-1">Total Problems</div>
            <div className="text-xl font-bold text-white">{data.problems.length}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
