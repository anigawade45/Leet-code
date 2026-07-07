'use client'

import { useEffect, useState, use } from 'react'
import { ListOrdered } from 'lucide-react'

export default function AdminContestProblems({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/contests/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.contest?.problems) {
          setProblems(d.contest.problems)
        }
        setLoading(false)
      })
      .catch(console.error)
  }, [params.id])

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <ListOrdered /> Contest Problems
          </h1>
          <p className="text-muted-foreground">View the problems assigned to this contest in order.</p>
        </div>
      </div>

      <div className="bg-[#212121] border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1e1e1e] border-b border-border">
              <th className="p-4 font-semibold text-muted-foreground w-16 text-center">Order</th>
              <th className="p-4 font-semibold text-muted-foreground">Problem Title</th>
              <th className="p-4 font-semibold text-muted-foreground w-32">Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : problems.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">No problems assigned.</td>
              </tr>
            ) : (
              problems.map((cp) => {
                const letter = String.fromCharCode(65 + cp.order - 1)
                return (
                  <tr key={cp.id} className="border-b border-border hover:bg-card transition-colors">
                    <td className="p-4 text-center font-bold text-xl text-[#2a9d8f]">{letter}</td>
                    <td className="p-4 font-medium text-white text-lg">{cp.problem.title}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        cp.problem.difficulty === 'EASY' ? 'text-[#00b8a3]' :
                        cp.problem.difficulty === 'MEDIUM' ? 'text-[#ffc01e]' :
                        'text-[#ff375f]'
                      }`}>
                        {cp.problem.difficulty}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        
        <div className="p-4 bg-[#1e1e1e] border-t border-border text-sm text-muted-foreground">
          To add, remove, or reorder problems, please navigate to the general settings or recreate the problem list. (Drag-and-drop coming soon).
        </div>
      </div>
    </div>
  )
}
