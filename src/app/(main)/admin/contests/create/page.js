'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

export default function CreateContestPage() {
  const router = useRouter()
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [problemSearch, setProblemSearch] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    visibility: 'PUBLIC',
    difficulty: 'MIXED',
    registrationOpens: '',
    registrationCloses: '',
    maxParticipants: '',
    showLiveLeaderboard: true,
    freezeLeaderboard: false,
    allowPractice: true,
    showEditorial: true,
    allowLateRegistration: true,
    enableDiscussion: false,
    selectedProblems: []
  })

  useEffect(() => {
    // Fetch available problems to select from
    fetch('/api/problems')
      .then(res => res.json())
      .then(data => {
        const problemsArray = Array.isArray(data.problems)
          ? data.problems
          : Array.isArray(data.data)
            ? data.data
            : (data.problems && Array.isArray(data.problems.data))
              ? data.problems.data
              : []
        setProblems(problemsArray)
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString(),
          visibility: formData.visibility,
          difficulty: formData.difficulty,
          registrationOpens: formData.registrationOpens ? new Date(formData.registrationOpens).toISOString() : null,
          registrationCloses: formData.registrationCloses ? new Date(formData.registrationCloses).toISOString() : null,
          maxParticipants: formData.maxParticipants,
          showLiveLeaderboard: formData.showLiveLeaderboard,
          freezeLeaderboard: formData.freezeLeaderboard,
          allowPractice: formData.allowPractice,
          showEditorial: formData.showEditorial,
          allowLateRegistration: formData.allowLateRegistration,
          enableDiscussion: formData.enableDiscussion,
          problemIds: formData.selectedProblems
        })
      })

      if (res.ok) {
        alert('Contest created successfully!')
        router.push('/contest')
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to create contest')
    }
  }

  const toggleProblem = (id) => {
    setFormData(prev => {
      if (prev.selectedProblems.includes(id)) {
        return { ...prev, selectedProblems: prev.selectedProblems.filter(p => p !== id) }
      } else {
        return { ...prev, selectedProblems: [...prev.selectedProblems, id] }
      }
    })
  }

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(problemSearch.toLowerCase()) || 
    (p.problemNumber && p.problemNumber.toString().includes(problemSearch))
  )

  const selectedProblemObjs = problems.filter(p => formData.selectedProblems.includes(p.id))

  if (loading) return <div className="p-8 text-white">Loading problems...</div>

  return (
    <div className="flex-1 bg-background min-h-screen p-8 text-white font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/admin" className="text-muted-foreground hover:text-white mb-2 inline-block">← Back to Admin</Link>
          <h1 className="text-3xl font-bold">Create Contest</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-[#212121] p-6 rounded-xl border border-border">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Title</label>
            <input 
              required
              type="text" 
              className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Description</label>
            <textarea 
              className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Start Time</label>
              <input 
                required
                type="datetime-local" 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">End Time</label>
              <input 
                required
                type="datetime-local" 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Registration Opens (Optional)</label>
              <input 
                type="datetime-local" 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
                value={formData.registrationOpens}
                onChange={e => setFormData({ ...formData, registrationOpens: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Registration Closes (Optional)</label>
              <input 
                type="datetime-local" 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
                value={formData.registrationCloses}
                onChange={e => setFormData({ ...formData, registrationCloses: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Visibility</label>
              <select 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
                value={formData.visibility}
                onChange={e => setFormData({ ...formData, visibility: e.target.value })}
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Difficulty</label>
              <select 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
                value={formData.difficulty}
                onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Max Participants</label>
              <input 
                type="number"
                placeholder="Unlimited" 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 focus:outline-none focus:border-[#2a9d8f]"
                value={formData.maxParticipants}
                onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-lg font-bold mb-4">Contest Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'showLiveLeaderboard', label: 'Show Live Leaderboard' },
                { key: 'freezeLeaderboard', label: 'Freeze Leaderboard (Last 30m)' },
                { key: 'allowPractice', label: 'Allow Practice After Contest' },
                { key: 'showEditorial', label: 'Show Editorial After Contest' },
                { key: 'allowLateRegistration', label: 'Allow Registration After Start' },
                { key: 'enableDiscussion', label: 'Enable Discussion' }
              ].map(setting => (
                <label key={setting.key} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData[setting.key]}
                      onChange={e => setFormData({ ...formData, [setting.key]: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a9d8f]"></div>
                  </div>
                  <span className="text-sm font-medium text-white">{setting.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Selected Problems ({formData.selectedProblems.length})</label>
            {formData.selectedProblems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-[#1e1e1e] border border-border/50 rounded-lg">
                {selectedProblemObjs.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-[#2a9d8f]/20 text-[#2a9d8f] px-3 py-1.5 rounded-full text-sm font-bold border border-[#2a9d8f]/30">
                    <span>{p.title}</span>
                    <button type="button" onClick={() => toggleProblem(p.id)} className="hover:text-red-400">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="block text-sm font-semibold text-muted-foreground mb-2">Search & Add Problems</label>
            <div className="relative mb-3">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by title or number..." 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-[#2a9d8f] text-sm"
                value={problemSearch}
                onChange={e => setProblemSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto border border-border/50 rounded-lg bg-[#1e1e1e] p-2">
              {filteredProblems.map(problem => (
                <div key={problem.id} className="flex items-center gap-3 p-2 hover:bg-card rounded cursor-pointer" onClick={() => toggleProblem(problem.id)}>
                  <input 
                    type="checkbox" 
                    checked={formData.selectedProblems.includes(problem.id)}
                    onChange={() => {}} // handled by parent div
                    className="w-4 h-4 accent-[#2a9d8f]"
                  />
                  <span>
                    <span className="text-muted-foreground font-mono mr-2">#{problem.problemNumber || '?'}</span>
                    {problem.title} 
                    <span className="ml-2 text-muted-foreground text-xs">({problem.difficulty})</span>
                  </span>
                </div>
              ))}
              {filteredProblems.length === 0 && <div className="text-muted-foreground p-2 text-sm">No problems found.</div>}
            </div>
          </div>

          <button 
            type="submit"
            disabled={formData.selectedProblems.length === 0}
            className="w-full bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Create Contest
          </button>
        </form>
      </div>
    </div>
  )
}
