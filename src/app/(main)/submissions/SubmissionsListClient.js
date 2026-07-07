'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_CONFIG = {
  ACCEPTED:           { label: 'Accepted',            color: 'text-[#34d399]', bg: 'bg-[#34d399]/10 border-[#34d399]/20' },
  WRONG_ANSWER:       { label: 'Wrong Answer',         color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/20' },
  RUNTIME_ERROR:      { label: 'Runtime Error',        color: 'text-[#f43f5e]', bg: 'bg-[#f43f5e]/10 border-[#f43f5e]/20' },
  COMPILATION_ERROR:  { label: 'Compilation Error',    color: 'text-[#f97316]', bg: 'bg-[#f97316]/10 border-[#f97316]/20' },
  TIME_LIMIT_EXCEEDED:{ label: 'Time Limit Exceeded',  color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10 border-[#a78bfa]/20' },
  PENDING:            { label: 'Pending',               color: 'text-[#72767d]', bg: 'bg-[#72767d]/10 border-[#72767d]/20' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  return new Date(dateStr).toLocaleDateString()
}

const LANG_LABEL = { javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C++', c: 'C' }

export default function SubmissionsListClient({ initialSubmissions = [], initialPagination = { page: 1, limit: 20, totalPages: 1, total: 0 } }) {
  const router = useRouter()
  const [filter, setFilter] = useState('ALL')

  const filtered = filter === 'ALL'
    ? initialSubmissions
    : initialSubmissions.filter(s => s.status === filter)

  return (
    <div className="flex-1 bg-background min-h-screen p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Typo Round' }}>
          Submission History
        </h1>
        <p className="text-[#72767d] text-sm">All your past code submissions</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['ALL', 'ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'COMPILATION_ERROR', 'TIME_LIMIT_EXCEEDED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === s
                ? (STATUS_CONFIG[s]?.bg || 'bg-[#2a9d8f]/10 border-[#2a9d8f]/20') + ' ' + (STATUS_CONFIG[s]?.color || 'text-[#2a9d8f]')
                : 'bg-transparent border-border text-[#72767d] hover:text-white'
            }`}
          >
            {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label}
            {s === 'ALL' && <span className="ml-1.5 text-[10px] opacity-70">{initialSubmissions.length}</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-[#212121] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border text-[10px] font-bold text-[#72767d] uppercase tracking-wider">
          <span>Problem</span>
          <span>Language</span>
          <span>Status</span>
          <span>Runtime</span>
          <span>Submitted</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <span className="text-4xl mb-3">📭</span>
            <p className="font-semibold text-sm">No submissions yet</p>
            <p className="text-xs mt-1">
              <Link href="/problems" className="text-[#2a9d8f] hover:underline">Browse problems</Link> and start coding!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#282828]">
            {filtered.map((sub, i) => {
              const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.PENDING
              const showRatio = sub.passedCount != null && sub.totalCount != null

              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    const submissionRoute = sub.problem?.slug
                      ? `/problems/${sub.problem.slug}/submissions/${sub.id}`
                      : `/submissions/${sub.id}`
                    router.push(submissionRoute)
                  }}
                  className={`grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-4 hover:bg-card/50 cursor-pointer transition-colors ${
                    i % 2 === 0 ? '' : 'bg-[#1e1e1e]/30'
                  }`}
                >
                  {/* Problem */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[#72767d] shrink-0">
                      #{sub.problem?.problemNumber}
                    </span>
                    <span className="text-sm text-white font-medium truncate hover:text-[#2a9d8f] transition-colors">
                      {sub.problem?.title || 'Unknown'}
                    </span>
                  </div>

                  {/* Language */}
                  <div className="flex items-center">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {LANG_LABEL[sub.language] || sub.language?.toUpperCase()}
                    </span>
                  </div>

                  {/* Status & Pass/Fail Ratio */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {showRatio && (
                      <span className="text-[10px] font-semibold text-[#72767d]">
                        {sub.passedCount} / {sub.totalCount}
                      </span>
                    )}
                  </div>

                  {/* Runtime */}
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground">
                      {sub.runtime != null ? `${sub.runtime} ms` : 'N/A'}
                    </span>
                  </div>

                  {/* Submitted */}
                  <div className="flex items-center">
                    <span className="text-xs text-[#72767d]">{timeAgo(sub.createdAt)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {initialPagination && initialPagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border/30 mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(initialPagination.page - 1) * initialPagination.limit + 1} to {Math.min(initialPagination.page * initialPagination.limit, initialPagination.total)} of {initialPagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/submissions?page=${Math.max(1, initialPagination.page - 1)}`)}
                disabled={!initialPagination.hasPrevious}
                className="px-3 py-1.5 rounded-md bg-card text-white hover:bg-[#323232] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-white px-2">Page {initialPagination.page} of {initialPagination.totalPages}</span>
              <button
                onClick={() => router.push(`/submissions?page=${initialPagination.page + 1}`)}
                disabled={!initialPagination.hasNext}
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
