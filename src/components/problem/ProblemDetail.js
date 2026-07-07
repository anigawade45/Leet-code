'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProblemEngagement } from '@/hooks/useProblemEngagement'
import { useSubmissions } from '@/hooks/useSubmissions'
import { useEditor } from '@/hooks/useEditor'
import { useResizablePanels } from '@/hooks/useResizablePanels'
import { ProblemForm } from './ProblemForm'
import { ConsolePanel } from '../editor/ConsolePanel'
import dynamic from 'next/dynamic'

import { ProblemHeader } from './ProblemDetail/ProblemHeader'
import { DescriptionPanel } from './ProblemDetail/DescriptionPanel'
import { EditorialPanel } from './ProblemDetail/EditorialPanel'
import { SolutionsPanel } from './ProblemDetail/SolutionsPanel'
import { SubmissionHistory } from './ProblemDetail/SubmissionHistory'
import { SubmissionDetail } from './ProblemDetail/SubmissionDetail'
import { NotePanel } from './ProblemDetail/NotePanel'
import { EditorToolbar } from './ProblemDetail/EditorToolbar'
import { ProblemNavbar } from './ProblemNavbar'

const CodeEditor = dynamic(
  () => import('../editor/CodeEditor').then((mod) => mod.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e] text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2d2d2d] border-t-[#2a9d8f] rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Initializing Editor...</span>
        </div>
      </div>
    ),
  }
)
import {
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Star,
  Share2,
} from 'lucide-react'

export function ProblemDetail({ initialProblem, initialSubmissions = [], initialSubmissionDetail = null, contestId = null }) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [problem, setProblem] = useState(initialProblem)
  const [loading, setLoading] = useState(!initialProblem)
  const [showEdit, setShowEdit] = useState(false)
  const [activeLeftTab, setActiveLeftTab] = useState(() => {
    return initialSubmissionDetail ? 'submissions' : 'description'
  })
  const [isNoteOpen, setIsNoteOpen] = useState(false)

  const { engagement, isReacting, handleReaction } = useProblemEngagement(problem, user)

  const [activeEditorTab, setActiveEditorTab] = useState(() => {
    return initialSubmissionDetail ? 'submission' : 'code'
  })

  const {
    submissions,
    setSubmissions,
    submissionsLoading,
    submissionDetailView,
    setSubmissionDetailView,
    submissionTestResults,
    setSubmissionTestResults,
    unlockedBadges,
    setUnlockedBadges,
    submissionTestLoading,
    analysisData,
    setAnalysisData,
    analysisLoading,
    handleGenerateAnalysis,
    openSubmissionDetail
  } = useSubmissions(
    problem,
    initialSubmissions,
    initialSubmissionDetail,
    user,
    activeLeftTab,
    setActiveEditorTab
  )

  const {
    editorCodes,
    setEditorCodes,
    selectedLanguage,
    setSelectedLanguage,
    availableLanguages,
    consoleOpen,
    setConsoleOpen,
    isRunning,
    isSubmitting,
    runResults,
    consoleError,
    consoleMaximized,
    setConsoleMaximized,
    isEditorFolded,
    setIsEditorFolded,
    isSubmitMode,
    hiddenFailedCase,
    customTestCases,
    setCustomTestCases,
    rawTestCasesText,
    setRawTestCasesText,
    handleResetCode,
    handleRetrieveCode,
    handleRestoreCode,
    handleRunCode,
    handleSubmitCode
  } = useEditor(
    initialProblem,
    problem,
    user,
    submissions,
    setSubmissions,
    setSubmissionTestResults
  )

  const {
    leftWidth,
    editorHeight,
    isResizingWidth,
    isResizingHeight,
    startResizingWidth,
    startResizingHeight
  } = useResizablePanels()


  const getStatusLabel = (status) => {
    if (status === 'ACCEPTED') return 'Accepted'
    if (status === 'WRONG_ANSWER') return 'Wrong Answer'
    if (status === 'TIME_LIMIT_EXCEEDED') return 'Time Limit Exceeded'
    if (status === 'MEMORY_LIMIT_EXCEEDED') return 'Memory Limit Exceeded'
    if (status === 'RUNTIME_ERROR') return 'Runtime Error'
    if (status === 'COMPILATION_ERROR') return 'Compilation Error'
    return status || 'Pending'
  }

  return (
    <div className="flex-1 bg-background h-screen flex flex-col font-sans overflow-hidden">
      <ProblemNavbar
        problem={problem}
        user={user}
        handleRunCode={handleRunCode}
        handleSubmitCode={handleSubmitCode}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        onNotesClick={() => {
          setIsNoteOpen(true)
          setActiveLeftTab('note')
        }}
      />
      <div className="flex-1 flex overflow-hidden p-2 gap-2 relative">
        <section
          id="left-pane-container"
          style={{ width: `${leftWidth}%`, pointerEvents: isResizingWidth || isResizingHeight ? 'none' : 'auto' }}
          className="flex flex-col bg-background border border-border rounded-xl overflow-hidden relative min-w-[20%]"
        >
          <ProblemHeader 
            activeLeftTab={activeLeftTab} 
            setActiveLeftTab={setActiveLeftTab} 
            isNoteOpen={isNoteOpen}
            setIsNoteOpen={setIsNoteOpen}
          />

          {activeLeftTab === 'description' && <DescriptionPanel problem={problem} user={user} isSolved={user && submissions.some(sub => sub.status === 'ACCEPTED')} />}
          {activeLeftTab === 'editorial' && <EditorialPanel problem={problem} />}
          {activeLeftTab === 'solutions' && <SolutionsPanel />}
          {activeLeftTab === 'note' && <NotePanel problem={problem} user={user} />}
          {activeLeftTab === 'submissions' && (
            <SubmissionHistory
              submissionsLoading={submissionsLoading}
              submissions={submissions}
              openSubmissionDetail={openSubmissionDetail}
              handleRestoreCode={handleRestoreCode}
            />
          )}

          {/* Left panel footer bar - Only show on description tab */}
          {activeLeftTab === 'description' && (
            <div className="h-11 border-t border-border bg-background flex items-center justify-between px-4 select-none text-xs text-muted-foreground min-h-11 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReaction('LIKE')}
                  disabled={!user || isReacting}
                  className={`flex items-center gap-1.5 transition-colors ${engagement.userReaction === 'LIKE' ? 'text-[#00b8a3]' : 'hover:text-white'} ${(!user || isReacting) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <ThumbsUp size={14} />
                  <span>{engagement.likes}</span>
                </button>
                <button
                  onClick={() => handleReaction('DISLIKE')}
                  disabled={!user || isReacting}
                  className={`flex items-center gap-1.5 transition-colors ${engagement.userReaction === 'DISLIKE' ? 'text-[#ef4444]' : 'hover:text-white'} ${(!user || isReacting) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <ThumbsDown size={14} />
                  <span>{engagement.dislikes}</span>
                </button>
                <span className="text-[#282828]">|</span>
                <button 
                  onClick={() => {
                    const el = document.getElementById('section-discussion')
                    if (el) {
                      el.open = true
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <MessageSquare size={14} />
                  <span>{problem?._count?.discussions > 0 ? (problem._count.discussions >= 1000 ? (problem._count.discussions / 1000).toFixed(1) + 'K' : problem._count.discussions) : '0'}</span>
                </button>
                <span className="text-[#282828]">|</span>
                <button className="hover:text-white transition-colors"><Star size={14} /></button>
                <button className="hover:text-white transition-colors"><Share2 size={14} /></button>
                <button className="hover:text-white transition-colors"><HelpCircle size={14} /></button>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#00b8a3] animate-pulse"></span>
                <span className="text-[#00b8a3] font-bold">{engagement.currentSolving} live</span>
              </div>
            </div>
          )}
        </section>

        {/* Vertical Drag Handle */}
        <div
          onMouseDown={startResizingWidth}
          className={`w-1.5 hover:w-2 active:w-2 h-full cursor-col-resize flex items-center justify-center relative z-30 transition-all duration-150 group select-none ${isResizingWidth ? 'bg-[#1a8cff]' : ''
            }`}
        >
          <div className={`w-0.5 h-full transition-all duration-150 ${isResizingWidth ? 'bg-[#1a8cff]' : 'bg-transparent group-hover:bg-[#1a8cff]'
            }`}></div>
        </div>

        {/* Right Side Pane */}
        <section
          id="right-pane-container"
          style={{
            width: `${100 - leftWidth}%`,
            pointerEvents: isResizingWidth || isResizingHeight ? 'none' : 'auto'
          }}
          className="flex flex-col overflow-hidden h-full min-w-[20%]"
        >
          <div
            style={{
              height: isEditorFolded
                ? '40px'
                : consoleOpen
                  ? consoleMaximized
                    ? '15%'
                    : `calc(${editorHeight}% - 3px)`
                  : 'calc(100% - 42px)'
            }}
            className="flex flex-col bg-background border border-border rounded-xl overflow-hidden relative min-h-[40px] shrink-0"
          >
            <EditorToolbar
              activeEditorTab={activeEditorTab}
              setActiveEditorTab={setActiveEditorTab}
              submissionDetailView={submissionDetailView}
              setSubmissionDetailView={setSubmissionDetailView}
              setSubmissionTestResults={setSubmissionTestResults}
              router={router}
              params={params}
              consoleOpen={consoleOpen}
              setConsoleOpen={setConsoleOpen}
              consoleMaximized={consoleMaximized}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              availableLanguages={availableLanguages}
              handleResetCode={handleResetCode}
              handleRetrieveCode={handleRetrieveCode}
              getStatusLabel={getStatusLabel}
              editorCodes={editorCodes}
              setEditorCodes={setEditorCodes}
              isEditorFolded={isEditorFolded}
              setIsEditorFolded={setIsEditorFolded}
            />

            {!isEditorFolded && (
              <div className="flex-1 overflow-hidden relative">
                {activeEditorTab === 'submission' && submissionDetailView ? (
                  <SubmissionDetail
                    submissionDetailView={submissionDetailView}
                    setSubmissionDetailView={setSubmissionDetailView}
                    setSubmissionTestResults={setSubmissionTestResults}
                    setActiveEditorTab={setActiveEditorTab}
                    router={router}
                    params={params}
                    getStatusLabel={getStatusLabel}
                    problem={problem}
                    user={user}
                    handleGenerateAnalysis={handleGenerateAnalysis}
                    analysisLoading={analysisLoading}
                    analysisData={analysisData}
                    setSelectedLanguage={setSelectedLanguage}
                    setEditorCodes={setEditorCodes}
                    CodeEditor={CodeEditor}
                  />
                ) : (
                  <CodeEditor
                    languages={availableLanguages}
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={setSelectedLanguage}
                    code={editorCodes[selectedLanguage] || ''}
                    onCodeChange={(code) => setEditorCodes({ ...editorCodes, [selectedLanguage]: code })}
                    onReset={handleResetCode}
                    hideHeader={true}
                  />
                )}
              </div>
            )}
          </div>

          {consoleOpen && !consoleMaximized && !isEditorFolded && (
            <div
              onMouseDown={startResizingHeight}
              className={`h-1.5 hover:h-2 active:h-2 w-full cursor-row-resize flex items-center justify-center relative z-30 transition-all duration-150 group select-none ${isResizingHeight ? 'bg-[#1a8cff]' : ''
                }`}
            >
              <div className={`h-0.5 w-full transition-all duration-150 ${isResizingHeight ? 'bg-[#1a8cff]' : 'bg-transparent group-hover:bg-[#1a8cff]'
                }`}></div>
            </div>
          )}

          <div
            style={{
              height: isEditorFolded
                ? 'calc(100% - 40px)'
                : consoleOpen
                  ? consoleMaximized
                    ? 'calc(85% - 3px)'
                    : `calc(${100 - editorHeight}% - 3px)`
                  : '42px',
            }}
            className="flex flex-col bg-background border border-border rounded-xl overflow-hidden relative shrink-0"
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <ConsolePanel
                testCases={customTestCases}
                results={runResults}
                running={isRunning || isSubmitting}
                error={consoleError}
                consoleOpen={consoleOpen}
                setConsoleOpen={setConsoleOpen}
                consoleMaximized={consoleMaximized}
                setConsoleMaximized={setConsoleMaximized}
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                problem={problem}
                rawTestCasesText={rawTestCasesText}
                setRawTestCasesText={setRawTestCasesText}
                isSubmitMode={isSubmitMode}
                hiddenFailedCase={hiddenFailedCase}
                submissionResults={submissionTestResults}
                submissionResultsLoading={submissionTestLoading}
              />
            </div>
          </div>
        </section>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-background max-w-5xl max-h-[90vh] overflow-auto rounded-lg">
            <ProblemForm
              initialData={{
                ...problem,
                examples: JSON.stringify(problem.examples, null, 2),
                starterCode: JSON.stringify(problem.starterCode, null, 2),
              }}
            />
            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 text-muted-foreground hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
