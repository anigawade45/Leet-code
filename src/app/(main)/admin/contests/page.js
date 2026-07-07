'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

export default function AdminContestsPage() {
  const [contests, setContests] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchContests = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/contests?page=${page}&limit=20`)
      .then(res => res.json())
      .then(res => {
        if (res.data) setContests(res.data)
        if (res.pagination) setPagination(res.pagination)
        setLoading(false)
      })
      .catch(console.error)
  }, [page])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContests()
  }, [fetchContests])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contest? All submissions and participants will be lost.')) return
    try {
      const res = await fetch(`/api/admin/contests/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setContests(prev => prev.filter(c => c.id !== id))
      } else {
        alert('Failed to delete contest')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handlePublish = async (id) => {
    try {
      const res = await fetch(`/api/admin/contests/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: 'PUBLIC' })
      })
      if (res.ok) {
        setContests(prev => prev.map(c => c.id === id ? { ...c, visibility: 'PUBLIC' } : c))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDuplicate = async (id) => {
    try {
      const res = await fetch(`/api/admin/contests/${id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setContests(prev => [data.contest, ...prev])
      } else {
        alert('Failed to duplicate contest')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getStatus = (c) => {
    const now = new Date()
    const start = new Date(c.startTime)
    const end = new Date(c.endTime)
    if (now < start) return { label: 'Upcoming', color: 'text-blue-400 bg-blue-400/10' }
    if (now > end) return { label: 'Ended', color: 'text-gray-400 bg-gray-400/10' }
    return { label: 'Live', color: 'text-red-400 bg-red-400/10' }
  }

  if (loading && !contests.length) {
    return (
      <div className="flex-1 bg-background min-h-screen p-8 text-white font-sans">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="h-8 w-64 bg-card animate-pulse rounded mb-2" />
              <div className="h-4 w-96 bg-card animate-pulse rounded" />
            </div>
            <div className="h-10 w-32 bg-card animate-pulse rounded-lg" />
          </div>
          <div className="bg-[#212121] border border-border rounded-xl overflow-hidden p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-card animate-pulse rounded" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background min-h-screen p-8 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contest Management</h1>
            <p className="text-muted-foreground">Manage, monitor, and configure all platform contests.</p>
          </div>
          <Link href="/admin/contests/create">
            <button className="bg-[#2a9d8f] hover:bg-[#238678] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2">
              <Plus size={18} /> New Contest
            </button>
          </Link>
        </div>

        <div className="bg-[#212121] border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e1e1e] border-b border-border">
                <th className="p-4 font-semibold text-muted-foreground">Title</th>
                <th className="p-4 font-semibold text-muted-foreground">Status</th>
                <th className="p-4 font-semibold text-muted-foreground">Participants</th>
                <th className="p-4 font-semibold text-muted-foreground">Problems</th>
                <th className="p-4 font-semibold text-muted-foreground">Start Time</th>
                <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">No contests found.</td>
                </tr>
              ) : (
                contests.map(c => {
                  const status = getStatus(c)
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-card transition-colors">
                      <td className="p-4 font-medium">{c.title}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{c._count?.participants || 0}</td>
                      <td className="p-4 text-muted-foreground">{c._count?.problems || 0}</td>
                      <td className="p-4 text-muted-foreground whitespace-nowrap">{format(new Date(c.startTime), 'MMM d, yyyy h:mm a')}</td>
                      <td className="p-4 text-right space-x-2">
                        {c.visibility === 'PRIVATE' && (
                          <button 
                            onClick={() => handlePublish(c.id)}
                            className="p-2 bg-muted/50 hover:bg-muted rounded-lg text-green-400 transition-colors inline-flex"
                            title="Publish"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m3 15 2 2 4-4"/></svg>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDuplicate(c.id)}
                          className="p-2 bg-muted/50 hover:bg-muted rounded-lg text-purple-400 transition-colors inline-flex"
                          title="Duplicate"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                        <button 
                          onClick={() => router.push(`/admin/contests/${c.id}/overview`)}
                          className="p-2 bg-muted/50 hover:bg-muted rounded-lg text-blue-400 transition-colors inline-flex"
                          title="Manage"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-2 bg-muted/50 hover:bg-muted rounded-lg text-red-400 transition-colors inline-flex"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })
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
