'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, ChevronRight, Lock } from 'lucide-react'

export default function ContestProblemsPage({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/contests/${params.id}/problems`)
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(console.error)
  }, [params.id])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-[#2a9d8f] rounded-full animate-spin" />
      </div>
    )
  }

  if (data?.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <Lock size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">{data.error}</p>
        <Link href={`/contest/${params.id}`} className="mt-6 text-[#2a9d8f] hover:underline">
          Go back to overview
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">Contest Problems</h2>
        
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#0f0f0f]">
                <th className="p-4 text-sm font-semibold text-muted-foreground w-16 text-center">Status</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground">Problem</th>
                <th className="p-4 text-sm font-semibold text-muted-foreground w-32">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {data.problems.map((problem) => (
                <tr key={problem.id} className="border-b border-border hover:bg-card/50 transition-colors group">
                  <td className="p-4 text-center">
                    {problem.isSolved ? (
                      <CheckCircle2 size={20} className="text-green-500 mx-auto" />
                    ) : problem.isAttempted ? (
                      <XCircle size={20} className="text-red-500 mx-auto" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-border mx-auto" />
                    )}
                  </td>
                  <td className="p-4">
                    <Link href={`/contest/${params.id}/problems/${problem.slug}`} className="flex items-center group-hover:text-[#2a9d8f] transition-colors">
                      <span className="font-bold text-lg mr-4 w-6">{problem.displayLetter}</span>
                      <span className="font-medium">{problem.title}</span>
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      problem.difficulty === 'EASY' ? 'text-[#00b8a3]' :
                      problem.difficulty === 'MEDIUM' ? 'text-[#ffc01e]' :
                      'text-[#ff375f]'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
