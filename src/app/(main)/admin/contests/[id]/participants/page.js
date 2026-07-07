'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Image from 'next/image'
import { Search, Trash2, Download } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminContestParticipants({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [participants, setParticipants] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchParticipants = useCallback((q = '') => {
    setLoading(true)
    fetch(`/api/admin/contests/${params.id}/participants?q=${q}`)
      .then(res => res.json())
      .then(d => {
        if (d.participants) setParticipants(d.participants)
        setLoading(false)
      })
      .catch(console.error)
  }, [params.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchParticipants(search)
  }, [params.id, search, fetchParticipants])

  const handleRemove = async (userId) => {
    if (!confirm('Are you sure you want to remove this participant?')) return
    try {
      const res = await fetch(`/api/admin/contests/${params.id}/participants/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setParticipants(prev => prev.filter(p => p.userId !== userId))
      } else {
        alert('Failed to remove participant')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Username,Email,Registered At,Solved Count\n"
      + participants.map(p => `${p.user.username},${p.user.email},${new Date(p.joinedAt).toISOString()},${p.solvedCount}`).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `contest_${params.id}_participants.csv`)
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(link)
      try {
        link.click()
      } finally {
        if (link.parentNode) link.parentNode.removeChild(link)
      }
    } else {
      window.open(encodedUri, '_blank')
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Participants</h1>
          <p className="text-muted-foreground">Manage users registered for this contest.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search username..." 
              className="bg-[#212121] border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-[#2a9d8f] text-sm text-white w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExport}
            className="bg-[#212121] hover:bg-card border border-border text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-[#212121] border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1e1e1e] border-b border-border">
              <th className="p-4 font-semibold text-muted-foreground">User</th>
              <th className="p-4 font-semibold text-muted-foreground">Registered At</th>
              <th className="p-4 font-semibold text-muted-foreground text-center">Problems Solved</th>
              <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">Loading...</td>
              </tr>
            ) : participants.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">No participants found.</td>
              </tr>
            ) : (
              participants.map(p => (
                <tr key={p.userId} className="border-b border-border hover:bg-card transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {p.user.avatar ? (
                        <Image src={p.user.avatar} width={32} height={32} alt={p.user.username} className="w-8 h-8 rounded-full bg-muted" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#2a9d8f] flex items-center justify-center text-white text-xs font-bold">
                          {p.user.username[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{p.user.username}</div>
                        <div className="text-xs text-muted-foreground">{p.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {format(new Date(p.joinedAt), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 text-white font-bold text-sm">
                      {p.solvedCount}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleRemove(p.userId)}
                      className="p-2 bg-muted/50 hover:bg-muted rounded-lg text-red-400 transition-colors inline-flex"
                      title="Remove Participant"
                    >
                      <Trash2 size={16} />
                    </button>
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
