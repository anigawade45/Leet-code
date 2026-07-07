'use client'

import { useEffect, useState, use, useCallback } from 'react'
import { format } from 'date-fns'

export default function AdminContestSubmissions({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSubmissions = useCallback(() => {
    fetch(`/api/admin/contests/${params.id}/submissions?limit=100`)
      .then(res => res.json())
      .then(d => {
        if (d.submissions) setSubmissions(d.submissions)
        setLoading(false)
      })
      .catch(console.error)
  }, [params.id])

  useEffect(() => {
    fetchSubmissions()
    const timer = setInterval(fetchSubmissions, 5000)
    return () => clearInterval(timer)
  }, [fetchSubmissions])

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'text-green-400'
      case 'PENDING': return 'text-yellow-400'
      default: return 'text-red-400'
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Live Submissions</h1>
          <p className="text-muted-foreground">Real-time stream of incoming submissions (auto-refreshes every 5s).</p>
        </div>
      </div>

      <div className="bg-[#212121] border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1e1e1e] border-b border-border">
              <th className="p-4 font-semibold text-muted-foreground">Time</th>
              <th className="p-4 font-semibold text-muted-foreground">User</th>
              <th className="p-4 font-semibold text-muted-foreground">Problem</th>
              <th className="p-4 font-semibold text-muted-foreground">Language</th>
              <th className="p-4 font-semibold text-muted-foreground">Status</th>
              <th className="p-4 font-semibold text-muted-foreground">Runtime</th>
            </tr>
          </thead>
          <tbody>
            {loading && submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">No submissions yet.</td>
              </tr>
            ) : (
              submissions.map(sub => (
                <tr key={sub.id} className="border-b border-border hover:bg-card transition-colors">
                  <td className="p-4 text-muted-foreground whitespace-nowrap">
                    {format(new Date(sub.submittedAt), 'h:mm:ss a')}
                  </td>
                  <td className="p-4 font-semibold text-white">{sub.user.username}</td>
                  <td className="p-4 text-blue-400 font-medium">{sub.problem.title}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-muted/50 rounded text-xs font-mono text-[#e6e6e6]">
                      {sub.language}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${getStatusColor(sub.status)}`}>
                    {sub.status.replace(/_/g, ' ')}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {sub.runtime ? `${sub.runtime} ms` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
