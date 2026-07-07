'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Users, CheckCircle, ListOrdered, Play, Check } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'

export default function ContestLeaderboardPage({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [leaderboard, setLeaderboard] = useState([])
  const [problems, setProblems] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = useCallback(() => {
    setLoading(true)
    fetch(`/api/contests/${params.id}/leaderboard?page=${page}&limit=50`)
      .then(res => res.json())
      .then(res => {
        if (res.data) {
          if (res.data.leaderboard) setLeaderboard(res.data.leaderboard)
          if (res.data.problems) {
            const problemsArray = Array.isArray(res.data.problems) ? res.data.problems : (res.data.problems && Array.isArray(res.data.problems.data)) ? res.data.problems.data : []
            setProblems(problemsArray)
          }
          if (res.data.stats) setStats(res.data.stats)
        }
        if (res.pagination) setPagination(res.pagination)
        setLoading(false)
      })
      .catch(console.error)
  }, [params.id, page])

  const { joinRoom } = useSocket('leaderboard:update', (payload) => {
    if (payload.contestId === params.id && page === 1) {
      fetchLeaderboard() // Instantly refresh leaderboard on update if on page 1
    }
  })

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard()
  }, [fetchLeaderboard])

  useEffect(() => {
    joinRoom(`contest:${params.id}`)
  }, [params.id, joinRoom])

  if (loading && !stats) {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-8 w-48 bg-card animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-card animate-pulse rounded-xl" />)}
          </div>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-16 bg-card animate-pulse rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Trophy size={28} className="text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        </div>

        {/* Quick Stats Banner */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Participants</div>
                <div className="text-xl font-bold text-white">{stats.participants}</div>
              </div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <ListOrdered size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Problems</div>
                <div className="text-xl font-bold text-white">{stats.problems}</div>
              </div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                <CheckCircle size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Accepted</div>
                <div className="text-xl font-bold text-white">{stats.accepted}</div>
              </div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Play size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase">Submissions</div>
                <div className="text-xl font-bold text-white">{stats.submissions}</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-background border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="border-b border-border bg-[#0f0f0f]">
                <th className="p-4 text-sm font-semibold text-muted-foreground w-16 text-center">Rank</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground min-w-[200px]">User</th>
                
                {/* Dynamic Problem Columns */}
                {problems.map((p, idx) => (
                  <th key={p.id} className="p-4 text-sm font-bold text-muted-foreground w-16 text-center" title={p.title}>
                    {String.fromCharCode(65 + idx)}
                  </th>
                ))}

                <th className="p-4 text-sm font-semibold text-muted-foreground w-24 text-center">Solved</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground w-24 text-center">Penalty</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4 + problems.length} className="p-8 text-center text-muted-foreground">
                    No submissions yet. Be the first!
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, idx) => (
                  <tr key={entry.user.id} className="border-b border-border hover:bg-card/50 transition-colors">
                    <td className="p-4 text-center font-bold">
                      {idx === 0 ? <span className="text-yellow-400">1</span> :
                       idx === 1 ? <span className="text-gray-400">2</span> :
                       idx === 2 ? <span className="text-amber-600">3</span> :
                       <span className="text-muted-foreground">{idx + 1}</span>}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {entry.user.avatar ? (
                          <Image src={entry.user.avatar} alt={entry.user.username} width={32} height={32} className="w-8 h-8 rounded-full bg-muted" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#2a9d8f] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {entry.user.username[0].toUpperCase()}
                          </div>
                        )}
                        <Link href={`/u/${entry.user.username}`} className="font-semibold hover:text-[#2a9d8f] transition-colors truncate max-w-[150px]">
                          {entry.user.username}
                        </Link>
                      </div>
                    </td>

                    {/* Problem Status Cells */}
                    {problems.map(p => {
                      const pStat = entry.problems[p.id]
                      return (
                        <td key={p.id} className="p-4 text-center">
                          {pStat && pStat.solved ? (
                            <div className="flex flex-col items-center">
                              <Check size={20} className="text-[#2a9d8f] mb-1" />
                              <span className="text-[10px] text-muted-foreground leading-none">
                                {pStat.timeMinutes}m
                                {pStat.wrongAttempts > 0 && ` (+${pStat.wrongAttempts})`}
                              </span>
                            </div>
                          ) : pStat && pStat.wrongAttempts > 0 ? (
                            <span className="text-red-400 font-bold text-sm">
                              -{pStat.wrongAttempts}
                            </span>
                          ) : (
                            <span className="text-[#3e424a]">-</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="p-4 text-center font-bold text-white">{entry.solvedCount}</td>
                    <td className="p-4 text-center text-muted-foreground">{entry.penalty}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border border-border/30 border-t-0 rounded-b-xl bg-background">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pagination.limit + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevious}
                className="px-3 py-1.5 rounded-md bg-card text-white hover:bg-[#323232] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-white px-2">Page {page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 rounded-md bg-card text-white hover:bg-[#323232] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
