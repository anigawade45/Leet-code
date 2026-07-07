'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

const STATUS_CONFIG = {
  ACCEPTED:            { label: 'Accepted',             color: 'text-[#34d399]', bg: 'bg-[#34d399]/10 border-[#34d399]/20' },
  WRONG_ANSWER:        { label: 'Wrong Answer',          color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10 border-[#ef4444]/20' },
  RUNTIME_ERROR:       { label: 'Runtime Error',         color: 'text-[#f43f5e]', bg: 'bg-[#f43f5e]/10 border-[#f43f5e]/20' },
  COMPILATION_ERROR:   { label: 'Compilation Error',     color: 'text-[#f97316]', bg: 'bg-[#f97316]/10 border-[#f97316]/20' },
  TIME_LIMIT_EXCEEDED: { label: 'Time Limit Exceeded',   color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10 border-[#a78bfa]/20' },
  PENDING:             { label: 'Pending',                color: 'text-[#72767d]', bg: 'bg-[#72767d]/10 border-[#72767d]/20' },
}

const LANG_LABEL = { javascript: 'JavaScript', python: 'Python', java: 'Java', cpp: 'C++', c: 'C' }

export default function SubmissionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/submissions/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(({ submission }) => {
        const nextRoute = submission?.problem?.slug
          ? `/problems/${submission.problem.slug}/submissions/${submission.id}`
          : '/submissions'

        router.replace(nextRoute)
      })
      .catch(() => router.push('/submissions'))
  }, [id, router])

  const copyCode = () => {
    navigator.clipboard.writeText(submission.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex-1 bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2d2d2d] border-t-[#2a9d8f] rounded-full animate-spin" />
      </div>
    )
  }

  if (!submission) return null

  const cfg = STATUS_CONFIG[submission.status] || STATUS_CONFIG.PENDING
  const isAccepted = submission.status === 'ACCEPTED'

  return (
    <div className="flex-1 bg-background min-h-screen p-8">
      {/* Back Nav */}
      <button
        onClick={() => router.push('/submissions')}
        className="flex items-center gap-1.5 text-[#72767d] hover:text-white text-sm font-semibold mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Back to Submissions
      </button>

      {/* Title */}
      <div className="mb-6">
        <p className="text-[#72767d] text-xs font-mono mb-1">Submission #{submission.id.slice(0, 8).toUpperCase()}</p>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Typo Round' }}>
          {submission.problem?.title || 'Submission Detail'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Meta card */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status card */}
          <div className={`rounded-xl border p-5 ${isAccepted ? 'bg-[#34d399]/5 border-[#34d399]/20' : 'bg-[#ef4444]/5 border-[#ef4444]/15'}`}>
            <p className="text-[#72767d] text-xs font-bold uppercase tracking-wider mb-2">Status</p>
            <span className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</span>
          </div>

          {/* Details card */}
          <div className="rounded-xl border border-border/50 bg-[#212121] p-5 space-y-4">
            <div>
              <p className="text-[#72767d] text-xs font-bold uppercase tracking-wider mb-1">Problem</p>
              <Link
                href={`/problems/${submission.problem?.slug}`}
                className="text-[#2a9d8f] hover:text-[#34d399] font-semibold text-sm transition-colors"
              >
                {submission.problem?.problemNumber}. {submission.problem?.title}
              </Link>
            </div>

            <div>
              <p className="text-[#72767d] text-xs font-bold uppercase tracking-wider mb-1">Language</p>
              <p className="text-white text-sm font-semibold">
                {LANG_LABEL[submission.language] || submission.language?.toUpperCase()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#72767d] text-xs font-bold uppercase tracking-wider mb-1">Runtime</p>
                <p className="text-white text-sm font-semibold">
                  {submission.runtime != null ? `${submission.runtime} ms` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[#72767d] text-xs font-bold uppercase tracking-wider mb-1">Memory</p>
                <p className="text-white text-sm font-semibold">
                  {submission.memory != null ? `${submission.memory} MB` : 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[#72767d] text-xs font-bold uppercase tracking-wider mb-1">Submitted</p>
              <p className="text-white text-sm">
                {new Date(submission.createdAt).toLocaleString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Failed info (non-accepted only) */}
          {!isAccepted && (submission.failedInput || submission.error) && (
            <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/5 p-5 space-y-3">
              <p className="text-[#ef4444] text-xs font-bold uppercase tracking-wider">Failure Details</p>

              {submission.failedInput && (
                <div>
                  <p className="text-[#72767d] text-[11px] mb-1">Input</p>
                  <pre className="p-2 bg-[#0a0a0a] border border-border rounded text-white text-xs whitespace-pre-wrap font-mono select-all">
                    {submission.failedInput}
                  </pre>
                </div>
              )}

              {submission.error && (
                <div>
                  <p className="text-[#ef4444] text-[11px] mb-1">Error</p>
                  <pre className="p-2 bg-[#0a0a0a] border border-[#ef4444]/20 rounded text-[#ef4444] text-xs whitespace-pre-wrap font-mono select-all">
                    {submission.error}
                  </pre>
                </div>
              )}

              {submission.failedActual != null && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[#72767d] text-[11px] mb-1">Your Output</p>
                    <pre className="p-2 bg-[#0a0a0a] border border-[#ef4444]/20 rounded text-[#ef4444] text-xs whitespace-pre-wrap font-mono select-all">
                      {submission.failedActual}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[#72767d] text-[11px] mb-1">Expected</p>
                    <pre className="p-2 bg-[#0a0a0a] border border-[#34d399]/20 rounded text-[#34d399] text-xs whitespace-pre-wrap font-mono select-all">
                      {submission.failedExpected}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Code */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border/50 bg-[#212121] overflow-hidden h-full">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {LANG_LABEL[submission.language] || submission.language?.toUpperCase()}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="text-xs font-semibold px-3 py-1.5 bg-card hover:bg-[#333] border border-border rounded-lg text-muted-foreground hover:text-white transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy Code'}
              </button>
            </div>
            <pre className="p-5 text-[#e6e6e6] text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[600px] select-all leading-relaxed">
              {submission.code}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
