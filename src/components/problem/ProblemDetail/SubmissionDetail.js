import { ChevronLeft, CheckCircle2, Sparkles, SquarePen, Share2, Activity } from 'lucide-react'
import Image from 'next/image'

function formatSubmittedAt(dateInput) {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month} ${day}, ${year} ${hours}:${minutes}`
}

export function SubmissionDetail({
  submissionDetailView,
  setSubmissionDetailView,
  setSubmissionTestResults,
  setActiveEditorTab,
  router,
  params,
  getStatusLabel,
  problem,
  user,
  handleGenerateAnalysis,
  analysisLoading,
  analysisData,
  setSelectedLanguage,
  setEditorCodes,
  CodeEditor
}) {
  if (!submissionDetailView) return null

  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#1e1e1e] z-10">
      {/* nav bar */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-[#1e1e1e] z-10">
        <button
          onClick={() => {
            setSubmissionDetailView(null)
            setSubmissionTestResults(null)
            setActiveEditorTab('code')
            router.replace(`/problems/${params.slug}`, { scroll: false })
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
          All Submissions
        </button>
      </div>

      {/* status + meta */}
      <div className="px-6 py-5 border-b border-border space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-baseline gap-2.5">
              <span className={`text-2xl font-bold ${
                submissionDetailView.status === 'ACCEPTED' ? 'text-[#34d399]' :
                submissionDetailView.status === 'WRONG_ANSWER' ? 'text-[#ef4444]' :
                'text-[#f97316]'
              }`}>
                {getStatusLabel(submissionDetailView.status)}
              </span>
              {(() => {
                const totalTC = submissionDetailView.totalCount ?? problem?.testCases?.length ?? 0;
                const passedTC = submissionDetailView.passedCount ?? (submissionDetailView.status === 'ACCEPTED' ? totalTC : 0);
                if (totalTC > 0) {
                  return (
                    <span className="text-sm text-muted-foreground">
                      {passedTC} / {totalTC} testcases passed
                    </span>
                  )
                }
                return null
              })()}
            </div>
            {/* User avatar + username + timestamp row */}
            {(() => {
              const displayUser = submissionDetailView.user || user;
              if (!displayUser) return null;
              return (
                <div className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                  {displayUser.avatar ? (
                    <Image
                      src={displayUser.avatar}
                      alt={displayUser.username}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-white font-bold uppercase">
                        {displayUser.username?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="font-semibold text-white">
                    {displayUser.username}
                  </span>
                  <span>
                    submitted at {formatSubmittedAt(submissionDetailView.createdAt)}
                  </span>
                </div>
              )
            })()}
          </div>
          
          {/* Analysis and Solution buttons */}
          <div className="flex items-center gap-3">
            {submissionDetailView.status === 'ACCEPTED' && (
              <button
                onClick={handleGenerateAnalysis}
                disabled={analysisLoading || analysisData}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border border-transparent ${
                  analysisData ? 'bg-[#2a273b] text-[#8e84f5] border-[#443658] cursor-default' :
                  analysisLoading ? 'bg-[#2a273b] text-[#8e84f5] border-[#443658] animate-pulse cursor-not-allowed' :
                  'bg-gradient-to-r from-[#3e3252] to-[#2f3148] hover:from-[#443658] hover:to-[#383a54] text-[#8e84f5] border-[#443658]'
                }`}
              >
                <Sparkles size={14} className={analysisLoading ? "animate-spin" : ""} /> 
                {analysisLoading ? "Analyzing..." : "Analysis"}
              </button>
            )}
            <button
              onClick={() => {
                setSelectedLanguage(submissionDetailView.language)
                setEditorCodes(prev => ({ ...prev, [submissionDetailView.language]: submissionDetailView.code }))
                setSubmissionDetailView(null)
                setSubmissionTestResults(null)
                setActiveEditorTab('code')
                router.replace(`/problems/${params.slug}`, { scroll: false })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <SquarePen size={14} /> Solution
            </button>
          </div>
        </div>

        {/* meta row: id + lang */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono bg-card px-2 py-0.5 rounded text-muted-foreground">
            #{submissionDetailView.id.slice(0, 8)}
          </span>
          <span className="px-2 py-0.5 rounded bg-[#2a2e35] text-muted-foreground font-semibold">
            {submissionDetailView.language === 'cpp' ? 'C++'
              : submissionDetailView.language === 'javascript' ? 'JavaScript'
              : submissionDetailView.language === 'python' ? 'Python3'
              : submissionDetailView.language.toUpperCase()}
          </span>
        </div>
        {/* runtime + memory */}
        <div className="flex gap-4 pt-1">
          <div className="flex-1 bg-card rounded-xl p-4">
            <p className="text-muted-foreground text-xs mb-1">Runtime</p>
            <p className="text-white font-bold">{submissionDetailView.runtime ?? 'N/A'} ms</p>
          </div>
          <div className="flex-1 bg-card rounded-xl p-4">
            <p className="text-muted-foreground text-xs mb-1">Memory</p>
            <p className="text-white font-bold">{submissionDetailView.memory ?? 'N/A'} MB</p>
          </div>
        </div>
      </div>

      {/* AI Analysis Panel */}
      {analysisData && (
        <div className="mx-6 my-5 bg-[#201e2a] border border-[#3e3252] rounded-xl overflow-hidden shadow-lg">
          <div className="px-5 py-4 border-b border-[#3e3252]/50">
            <div className="flex items-center gap-4 text-[#8e84f5] text-sm mb-3">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Approach</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Efficiency</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> Code Style</span>
            </div>
            <p className="text-[#8e84f5] text-[13px]">
              Congratulations! You passed this attempt. AI has analyzed your code to help you improve.
            </p>
          </div>

          <div className="p-5 space-y-8">
            {/* Approach Section */}
            <div className="space-y-3 text-sm">
              <h3 className="flex items-center gap-2 text-[#8e84f5] text-base font-semibold mb-3">
                <Share2 size={18} /> Approach
              </h3>
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <span className="text-muted-foreground">Current:</span>
                <span className="text-white font-medium">{analysisData?.approach?.current ?? '-'}</span>
                <span className="text-muted-foreground">Suggested:</span>
                <span className="text-[#4caf50] font-medium">{analysisData?.approach?.suggested ?? '-'}</span>
              </div>
              <div className="pt-1 space-y-2">
                <p className="text-white"><span className="text-muted-foreground">Key Idea:</span> {analysisData?.approach?.keyIdea ?? ''}</p>
                <p className="text-white"><span className="text-muted-foreground">Consider:</span> {analysisData?.approach?.consider ?? ''}</p>
              </div>
            </div>

            <hr className="border-[#3e3252]/30" />

            {/* Efficiency Section */}
            <div className="space-y-3 text-sm flex justify-between">
              <div className="space-y-3 max-w-[70%]">
                <h3 className="flex items-center gap-2 text-[#8e84f5] text-base font-semibold mb-3">
                  <Activity size={18} /> Efficiency
                </h3>
                <div className="grid grid-cols-[150px_1fr] gap-2">
                  <span className="text-muted-foreground">Current complexity:</span>
                  <span className="text-white font-medium">{analysisData?.efficiency?.currentComplexity ?? '-'}</span>
                  <span className="text-muted-foreground">Suggested complexity:</span>
                  <span className="text-[#4caf50] font-medium">{analysisData?.efficiency?.suggestedComplexity ?? '-'}</span>
                </div>
                <p className="text-white pt-1"><span className="text-muted-foreground">Suggestions:</span> {analysisData?.efficiency?.suggestions ?? ''}</p>
              </div>
              <div className="w-[120px] h-[100px] border-l border-b border-border relative">
                <svg className="w-full h-full text-muted-foreground" viewBox="0 0 100 100">
                  <polyline points="0,100 100,0" fill="none" stroke="currentColor" strokeWidth="2" />
                  <polyline points="0,100 20,80 30,50 40,20 50,5" fill="none" stroke="#4a4e58" strokeWidth="1" />
                  <polyline points="0,100 50,90 80,85 100,80" fill="none" stroke="#4a4e58" strokeWidth="1" />
                </svg>
                <span className="absolute top-0 right-0 text-white font-serif italic pr-2 pt-1">{analysisData?.efficiency?.suggestedComplexity ?? ''}</span>
              </div>
            </div>

            <hr className="border-[#3e3252]/30" />

            {/* Code Style Section */}
            <div className="space-y-3 text-sm">
              <h3 className="flex items-center gap-2 text-[#8e84f5] text-base font-semibold mb-3">
                <SquarePen size={18} /> Code Style
              </h3>
              <div className="space-y-2">
                <p className="text-white"><span className="text-muted-foreground">Readability:</span> {analysisData?.codeStyle?.readability ?? ''}</p>
                <p className="text-white"><span className="text-muted-foreground">Structure:</span> {analysisData?.codeStyle?.structure ?? ''}</p>
                <p className="text-white"><span className="text-muted-foreground">Suggestions:</span> {analysisData?.codeStyle?.suggestions ?? ''}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* failed case error */}
      {submissionDetailView.status !== 'ACCEPTED' && submissionDetailView.error && (
        <div className="px-6 py-4 border-b border-border">
          <p className="text-[10px] font-bold text-[#ef4444] uppercase mb-2">Error</p>
          <pre className="p-3 bg-[#0a0a0a] border border-[#ef4444]/20 text-[#ef4444] rounded-lg text-xs font-mono whitespace-pre-wrap">{submissionDetailView.error}</pre>
        </div>
      )}

      {/* source code */}
      <div className="px-6 py-5 pb-10">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Source Code</p>
        <div
          className="rounded-xl border border-border overflow-hidden"
          style={{ height: `${Math.min(600, Math.max(200, submissionDetailView.code.split('\n').length * 22 + 24))}px` }}
        >
          <CodeEditor
            languages={[submissionDetailView.language]}
            selectedLanguage={submissionDetailView.language}
            onLanguageChange={() => {}}
            code={submissionDetailView.code}
            onCodeChange={() => {}}
            hideHeader={true}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  )
}
