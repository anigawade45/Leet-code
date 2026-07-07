'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Settings as SettingsIcon, Save } from 'lucide-react'

export default function AdminContestSettings({ params: paramsPromise }) {
  const router = useRouter()
  const params = use(paramsPromise)
  
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [problemSearch, setProblemSearch] = useState('')
  const [hasStarted, setHasStarted] = useState(false)

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
      })
      .catch(console.error)

    // Fetch existing contest data
    fetch(`/api/admin/contests/${params.id}`)
      .then(res => res.json())
      .then(d => {
        if (d.contest) {
          const c = d.contest
          setFormData({
            title: c.title,
            description: c.description || '',
            startTime: new Date(c.startTime).toISOString().slice(0,16),
            endTime: new Date(c.endTime).toISOString().slice(0,16),
            visibility: c.visibility,
            difficulty: c.difficulty,
            registrationOpens: c.registrationOpens ? new Date(c.registrationOpens).toISOString().slice(0,16) : '',
            registrationCloses: c.registrationCloses ? new Date(c.registrationCloses).toISOString().slice(0,16) : '',
            maxParticipants: c.maxParticipants || '',
            showLiveLeaderboard: c.showLiveLeaderboard,
            freezeLeaderboard: c.freezeLeaderboard,
            allowPractice: c.allowPractice,
            showEditorial: c.showEditorial,
            allowLateRegistration: c.allowLateRegistration,
            enableDiscussion: c.enableDiscussion,
            selectedProblems: c.problems.map(p => p.problemId)
          })
          setHasStarted(new Date() > new Date(c.startTime))
        }
        setLoading(false)
      })
      .catch(console.error)
  }, [params.id])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/contests/${params.id}`, {
        method: 'PATCH',
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
        alert('Settings saved successfully!')
      } else {
        const err = await res.json()
        alert('Error: ' + err.error)
      }
    } catch (err) {
      console.error(err)
      alert('Failed to save contest')
    } finally {
      setSaving(false)
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

  // Basic move up / down for ordering
  const moveProblem = (idx, dir) => {
    setFormData(prev => {
      const newProbs = [...prev.selectedProblems]
      if (dir === 'up' && idx > 0) {
        const temp = newProbs[idx - 1]
        newProbs[idx - 1] = newProbs[idx]
        newProbs[idx] = temp
      } else if (dir === 'down' && idx < newProbs.length - 1) {
        const temp = newProbs[idx + 1]
        newProbs[idx + 1] = newProbs[idx]
        newProbs[idx] = temp
      }
      return { ...prev, selectedProblems: newProbs }
    })
  }

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(problemSearch.toLowerCase()) || 
    (p.problemNumber && p.problemNumber.toString().includes(problemSearch))
  )

  const selectedProblemObjs = formData.selectedProblems.map(id => problems.find(p => p.id === id)).filter(Boolean)

  if (loading) return <div className="p-8 text-muted-foreground">Loading settings...</div>

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <SettingsIcon /> Edit Contest
          </h1>
          <p className="text-muted-foreground">Configure visibility, leaderboards, problems, and dates.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8 bg-[#212121] border border-border rounded-xl p-8">
        
        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Title</label>
              <input 
                required
                type="text" 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f]"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Description</label>
              <textarea 
                className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f]"
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
                  disabled={hasStarted}
                  type="datetime-local" 
                  className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f] disabled:opacity-50"
                  value={formData.startTime}
                  onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">End Time</label>
                <input 
                  required
                  disabled={hasStarted}
                  type="datetime-local" 
                  className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f] disabled:opacity-50"
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
                  className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f]"
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
                  className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f]"
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
                  className="w-full bg-[#1e1e1e] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f]"
                  value={formData.maxParticipants}
                  onChange={e => setFormData({ ...formData, maxParticipants: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="pt-8 border-t border-border">
          <h2 className="text-lg font-bold text-white mb-4">Features & Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'showLiveLeaderboard', label: 'Show Live Leaderboard', desc: 'Participants can see rank updates in real-time.' },
              { key: 'freezeLeaderboard', label: 'Freeze Leaderboard', desc: 'Hide rank updates to build suspense.' },
              { key: 'allowPractice', label: 'Allow Practice After Contest', desc: 'Users can submit solutions after contest ends.' },
              { key: 'showEditorial', label: 'Show Editorial After Contest', desc: 'Reveal solution articles once finished.' },
              { key: 'allowLateRegistration', label: 'Allow Late Registration', desc: 'Users can join after start.' },
              { key: 'enableDiscussion', label: 'Enable Discussion', desc: 'Allow users to comment.' }
            ].map(setting => (
              <label key={setting.key} className="flex items-start gap-4 cursor-pointer bg-[#1e1e1e] p-4 rounded-xl border border-border/30 hover:border-border transition-colors">
                <div className="relative mt-1 shrink-0">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formData[setting.key]}
                    onChange={e => setFormData({ ...formData, [setting.key]: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2a9d8f]"></div>
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-1">{setting.label}</div>
                  <div className="text-xs text-muted-foreground">{setting.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Problems */}
        <div className="pt-8 border-t border-border">
          <h2 className="text-lg font-bold text-white mb-4">Contest Problems</h2>
          
          {hasStarted && (
            <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-sm font-semibold">
              The contest has already started. Problems and timings cannot be edited to preserve fairness.
            </div>
          )}

          <label className="block text-sm font-semibold text-muted-foreground mb-2">Selected Problems ({formData.selectedProblems.length})</label>
          <div className="mb-4">
            {formData.selectedProblems.length > 0 ? (
              <div className="space-y-2">
                {selectedProblemObjs.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between bg-[#1e1e1e] border border-border/50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#2a9d8f] w-6">{String.fromCharCode(65 + idx)}</span>
                      <span className="font-semibold text-white">{p.title}</span>
                      <span className="text-xs text-muted-foreground">({p.difficulty})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => moveProblem(idx, 'up')} disabled={hasStarted || idx === 0} className="p-1 text-muted-foreground hover:text-white disabled:opacity-30">
                        ▲
                      </button>
                      <button type="button" onClick={() => moveProblem(idx, 'down')} disabled={hasStarted || idx === formData.selectedProblems.length - 1} className="p-1 text-muted-foreground hover:text-white disabled:opacity-30">
                        ▼
                      </button>
                      <button type="button" onClick={() => toggleProblem(p.id)} disabled={hasStarted} className="p-1 text-red-400 hover:bg-red-400/20 disabled:opacity-30 rounded ml-2">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-[#1e1e1e] border border-border/50 rounded-lg text-muted-foreground text-sm">No problems selected.</div>
            )}
          </div>

          {!hasStarted && (
            <>
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
                      onChange={() => {}} 
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
            </>
          )}
        </div>

        <div className="pt-6 border-t border-border flex justify-end">
          <button 
            type="submit"
            disabled={saving || formData.selectedProblems.length === 0}
            className="bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <Save size={18} /> {saving ? 'Saving...' : 'Save Contest'}
          </button>
        </div>
      </form>
    </div>
  )
}
