'use client'

import { useEffect, useState, use } from 'react'
import { BarChart3, Medal, Trophy } from 'lucide-react'

export default function AdminContestResults({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [data, setData] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/contests/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.contest) setData(d.contest)
      })
      .catch(console.error)

    fetch(`/api/admin/contests/${params.id}/submissions?limit=10`) // limit 10 is fine just to get the stats object
      .then(res => res.json())
      .then(d => {
        if (d.stats) setStats(d.stats)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading || !data || !stats) {
    return <div className="p-8 text-muted-foreground">Loading results...</div>
  }

  const isEnded = new Date() > new Date(data.endTime)
  const participantsCount = data._count?.participants || 0
  
  // Fake stats based on real data for presentation
  const averageSolved = participantsCount > 0 ? (stats.accepted / participantsCount).toFixed(1) : 0
  const highestScore = Array.isArray(data.problems) ? data.problems.length : (data.problems && data.problems.data) ? data.problems.data.length : 0

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart3 /> Contest Results
          </h1>
          <p className="text-muted-foreground">Post-contest summary and actions.</p>
        </div>
        {!isEnded && (
          <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-lg font-bold text-sm">
            Contest has not ended yet.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#212121] border border-border rounded-xl p-6 text-center">
          <div className="text-muted-foreground text-sm font-semibold mb-2">Total Participants</div>
          <div className="text-4xl font-bold text-white">{participantsCount}</div>
        </div>

        <div className="bg-[#212121] border border-border rounded-xl p-6 text-center">
          <div className="text-muted-foreground text-sm font-semibold mb-2">Average Solved</div>
          <div className="text-4xl font-bold text-blue-400">{averageSolved}</div>
        </div>

        <div className="bg-[#212121] border border-border rounded-xl p-6 text-center">
          <div className="text-muted-foreground text-sm font-semibold mb-2">Average Runtime</div>
          <div className="text-4xl font-bold text-[#2a9d8f]">{stats.avgRuntime} ms</div>
        </div>
      </div>

      <div className="bg-[#212121] border border-border rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Post-Contest Actions</h2>
        
        <div className="space-y-4 max-w-xl">
          <button 
            disabled={!isEnded}
            className="w-full bg-muted/50 hover:bg-muted disabled:opacity-50 border border-border text-white px-6 py-4 rounded-lg font-bold transition-colors flex items-center justify-between"
            onClick={() => alert('Publishing results... (Feature coming soon)')}
          >
            <span className="flex items-center gap-3"><Trophy size={20} /> Publish Final Results</span>
            <span className="text-muted-foreground text-xs font-normal">Notifies all participants</span>
          </button>
        </div>
      </div>
    </div>
  )
}
