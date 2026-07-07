'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, RefreshCw, Download, Lock, Unlock, Users, ListOrdered, CheckCircle, Play, Check, Globe } from 'lucide-react'

export default function AdminContestLeaderboard({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [leaderboard, setLeaderboard] = useState([])
  const [problems, setProblems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contest, setContest] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeaderboard = useCallback(() => {
    fetch(`/api/contests/${params.id}/leaderboard`)
      .then(res => res.json())
      .then(d => {
        if (d.leaderboard) setLeaderboard(d.leaderboard)
        if (d.problems) {
          const problemsArray = Array.isArray(d.problems) ? d.problems : (d.problems && Array.isArray(d.problems.data)) ? d.problems.data : []
          setProblems(problemsArray)
        }
        if (d.stats) setStats(d.stats)
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }, [params.id])

  const fetchContest = useCallback(() => {
    fetch(`/api/admin/contests/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.contest) setContest(d.contest)
      })
      .catch(console.error)
  }, [params.id])
  useEffect(() => {
    fetchLeaderboard()
    fetchContest()
  }, [fetchLeaderboard, fetchContest])

  const toggleFreeze = async () => {
    if (!contest) return
    try {
      const res = await fetch(`/api/admin/contests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freezeLeaderboard: !contest.freezeLeaderboard })
      })
      if (res.ok) {
        setContest(prev => ({ ...prev, freezeLeaderboard: !prev.freezeLeaderboard }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const publishResults = async () => {
    if (!contest || !confirm('Are you sure you want to publish the final results? This will unfreeze the leaderboard and make it public.')) return
    try {
      const res = await fetch(`/api/admin/contests/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          freezeLeaderboard: false,
          showLiveLeaderboard: true,
          visibility: 'PUBLIC'
        })
      })
      if (res.ok) {
        setContest(prev => ({ ...prev, freezeLeaderboard: false, showLiveLeaderboard: true, visibility: 'PUBLIC' }))
        fetchLeaderboard()
        alert('Results published successfully!')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Rank,Username,Solved,Penalty\n"
      + leaderboard.map((l, i) => `${i + 1},${l.user.username},${l.solvedCount},${l.penalty}`).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `contest_${params.id}_leaderboard.csv`)
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(link)
      try {
        link.click()
      } finally {
        if (link.parentNode) link.parentNode.removeChild(link)
      }
    } else {
      // Fallback: attempt to open the CSV in a new tab
      window.open(encodedUri, '_blank')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Trophy className="text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-muted-foreground">View and manage the contest rankings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => { setRefreshing(true); fetchLeaderboard(); }}
            className="p-2 bg-[#212121] hover:bg-card border border-border rounded-lg text-white transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <button 
            onClick={handleExport}
            className="bg-[#212121] hover:bg-card border border-border text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </button>
          <div className="h-6 w-px bg-muted mx-2"></div>
          <button 
            onClick={toggleFreeze}
            className={`px-4 py-2 border rounded-lg font-medium transition-colors flex items-center gap-2 ${
              contest?.freezeLeaderboard 
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
                : 'bg-[#212121] hover:bg-card border-border text-white'
            }`}
          >
            {contest?.freezeLeaderboard ? <Lock size={16} /> : <Unlock size={16} />}
            {contest?.freezeLeaderboard ? 'Unfreeze' : 'Freeze'}
          </button>
          <button 
            onClick={publishResults}
            className="bg-[#2a9d8f] hover:bg-[#238678] text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <Globe size={16} /> Publish Final Results
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#212121] border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Users size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Participants</div>
              <div className="text-xl font-bold text-white">{stats.participants}</div>
            </div>
          </div>
          <div className="bg-[#212121] border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ListOrdered size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Problems</div>
              <div className="text-xl font-bold text-white">{stats.problems}</div>
            </div>
          </div>
          <div className="bg-[#212121] border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase">Accepted</div>
              <div className="text-xl font-bold text-white">{stats.accepted}</div>
            </div>
          </div>
          <div className="bg-[#212121] border border-border rounded-xl p-4 flex items-center gap-4">
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

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-border border-t-[#2a9d8f] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-[#212121] border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-200">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-sm font-semibold text-muted-foreground w-16 text-center">Rank</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground min-w-50">User</th>
                
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
                    No submissions found.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, idx) => (
                  <tr key={entry.user.id} className="border-b border-border hover:bg-card transition-colors">
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
                        <Link href={`/u/${entry.user.username}`} className="font-semibold text-white hover:text-[#2a9d8f] transition-colors truncate max-w-37.5">
                          {entry.user.username}
                        </Link>
                      </div>
                    </td>

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
      )}
    </div>
  )
}
