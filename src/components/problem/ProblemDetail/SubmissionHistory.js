import { History } from 'lucide-react'

export function SubmissionHistory({ submissionsLoading, submissions, openSubmissionDetail, handleRestoreCode }) {
  if (submissionsLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-[#2d2d2d] border-t-[#2a9d8f] rounded-full animate-spin" />
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <History size={32} className="mb-3 text-muted-foreground/40" />
        <p className="font-semibold text-sm">No submissions yet</p>
        <p className="text-xs mt-1 text-muted-foreground/70">Submit your code to see history here</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center px-5 py-2.5 border-b border-border bg-background">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          Status
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </span>
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-24 text-center flex items-center gap-1">
          Language
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
        </span>
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-20 text-center">Runtime</span>
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider w-20 text-center">Memory</span>
      </div>

      {submissions.map((sub, idx) => {
        const rowNum = idx + 1
        const statusColor = sub.status === 'ACCEPTED' ? 'text-[#34d399]'
          : sub.status === 'WRONG_ANSWER' ? 'text-[#ef4444]'
          : sub.status === 'RUNTIME_ERROR' ? 'text-[#f43f5e]'
          : sub.status === 'TIME_LIMIT_EXCEEDED' ? 'text-[#a78bfa]'
          : sub.status === 'COMPILATION_ERROR' ? 'text-[#f97316]'
          : 'text-[#72767d]'
        const statusLabel = sub.status === 'ACCEPTED' ? 'Accepted'
          : sub.status === 'WRONG_ANSWER' ? 'Wrong Answer'
          : sub.status === 'RUNTIME_ERROR' ? 'Runtime Error'
          : sub.status === 'TIME_LIMIT_EXCEEDED' ? 'Time Limit Exceeded'
          : sub.status === 'COMPILATION_ERROR' ? 'Compilation Error'
          : sub.status
        const langLabel = sub.language === 'javascript' ? 'JavaScript'
          : sub.language === 'python' ? 'Python3'
          : sub.language === 'java' ? 'Java'
          : sub.language === 'cpp' ? 'C++'
          : sub.language === 'c' ? 'C'
          : sub.language
        const dateStr = new Date(sub.createdAt).toLocaleDateString('en-US', {
          month: 'short', day: '2-digit', year: 'numeric'
        })
        return (
          <div
            key={sub.id}
            onClick={async () => {
              await openSubmissionDetail(sub, { updateRoute: true, navigationMode: 'push' })
            }}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center px-5 py-3.5 border-b border-[#1e1e1e] hover:bg-[#222222] cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[#4a4a4a] text-xs font-mono w-4 shrink-0 select-none">{rowNum}</span>
              <div>
                <p className={`text-sm font-semibold leading-tight ${statusColor}`}>{statusLabel}</p>
                <div className="flex items-center gap-2 mt-0.5 select-none">
                  <span className="text-[11px] text-[#72767d]">{dateStr}</span>
                  <span className="text-[#3e424a]">•</span>
                  <button
                    onClick={(e) => handleRestoreCode(e, sub.code, sub.language)}
                    className="text-[11px] font-bold text-[#2a9d8f] hover:text-[#3dbdb0] transition-colors hover:underline"
                    title="Restore this submission code into the editor"
                  >
                    ↺ Restore
                  </button>
                </div>
              </div>
            </div>

            <div className="w-24 flex justify-center">
              <span className="px-3 py-1 rounded-full bg-[#2a2e35] text-muted-foreground text-xs font-semibold">
                {langLabel}
              </span>
            </div>

            <div className="w-20 flex items-center justify-center gap-1.5 text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-xs">{sub.runtime != null ? `${sub.runtime} ms` : 'N/A'}</span>
            </div>

            <div className="w-20 flex items-center justify-center gap-1.5 text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground">
                <rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 6V4M10 6V4M14 6V4M18 6V4M6 18v2M10 18v2M14 18v2M18 18v2"/>
              </svg>
              <span className="text-xs">{sub.memory != null ? `${sub.memory} MB` : 'N/A'}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
