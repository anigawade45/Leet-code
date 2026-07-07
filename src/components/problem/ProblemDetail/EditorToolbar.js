import { useState, useEffect } from 'react'
import { Code2, History, ChevronUp, ChevronDown, AlignLeft, Braces, RotateCcw, Maximize2, Minimize2, Maximize, Minimize } from 'lucide-react'

function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl w-[400px] shadow-2xl p-6 border border-border/30">
        <div className="flex gap-4">
          <div className="w-9 h-9 rounded-full bg-[#4caf50] flex items-center justify-center shrink-0 text-[#1a1a1a] font-serif italic font-bold text-lg">
            i
          </div>
          <div>
            <h3 className="text-white text-[17px] font-medium mb-1.5">{title}</h3>
            <p className="text-muted-foreground text-[13.5px] leading-relaxed mb-6">
              {message}
            </p>
            <div className="flex justify-end gap-2.5">
              <button onClick={onClose} className="px-4 py-2 rounded-lg bg-muted hover:bg-[#4a4e58] text-white text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={() => { onConfirm(); onClose() }} className="px-4 py-2 rounded-lg bg-[#4caf50] hover:bg-[#43a047] text-white text-sm font-semibold transition-colors">
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EditorToolbar({ 
  activeEditorTab, 
  setActiveEditorTab, 
  submissionDetailView, 
  setSubmissionDetailView,
  setSubmissionTestResults,
  router,
  params,
  consoleOpen,
  setConsoleOpen,
  consoleMaximized,
  selectedLanguage,
  setSelectedLanguage,
  availableLanguages,
  handleResetCode,
  handleRetrieveCode,
  getStatusLabel,
  isEditorFolded,
  setIsEditorFolded
}) {
  const [showResetModal, setShowResetModal] = useState(false)
  const [showRetrieveModal, setShowRetrieveModal] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPaneMaximized, setIsPaneMaximized] = useState(false)

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }
  
  const togglePaneMaximized = () => {
    const pane = document.getElementById('right-pane-container')
    if (!pane) return
    if (!isPaneMaximized) {
      pane.classList.add('!fixed', '!inset-0', '!z-50', '!w-full', '!h-full', '!max-w-none')
      setIsPaneMaximized(true)
    } else {
      pane.classList.remove('!fixed', '!inset-0', '!z-50', '!w-full', '!h-full', '!max-w-none')
      setIsPaneMaximized(false)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <>
      <ConfirmModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        onConfirm={handleResetCode} 
        title="Are you sure?" 
        message="Your current code will be discarded and reset to the default code!" 
      />
      
      <ConfirmModal 
        isOpen={showRetrieveModal} 
        onClose={() => setShowRetrieveModal(false)} 
        onConfirm={handleRetrieveCode} 
        title="Are you sure?" 
        message="Your code will be discarded and replaced with your last submission's code!" 
      />

      {/* Custom Code Editor Row 1: Tab + Panel Controls */}
      <div className="flex items-center justify-between px-3 py-0 bg-background border-b border-border h-10 select-none shrink-0">
        <div className="flex items-center h-full">
          {/* Code tab */}
          <button
            onClick={() => setActiveEditorTab('code')}
            className={`flex items-center gap-1.5 px-3 h-full text-xs font-semibold border-b-2 transition-all ${
              activeEditorTab === 'code'
                ? 'border-[#00b8a3] text-white bg-[#1e1e1e]/40'
                : 'border-transparent text-muted-foreground hover:text-white'
            }`}
          >
            <Code2 size={13} className="text-[#00b8a3]" />
            <span>Code</span>
          </button>

          {/* Submission tab — only when a detail is open */}
          {submissionDetailView && (
            <button
              onClick={() => setActiveEditorTab('submission')}
              className={`flex items-center gap-1.5 px-3 h-full text-xs font-semibold border-b-2 transition-all ${
                activeEditorTab === 'submission'
                  ? 'border-[#00b8a3] text-white bg-[#1e1e1e]/40'
                  : 'border-transparent text-muted-foreground hover:text-white'
              }`}
            >
              <History size={13} className={submissionDetailView.status === 'ACCEPTED' ? 'text-[#34d399]' : 'text-[#ef4444]'} />
              <span className={submissionDetailView.status === 'ACCEPTED' ? 'text-[#34d399]' : 'text-[#ef4444]'}>
                {getStatusLabel(submissionDetailView.status)}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  setSubmissionDetailView(null)
                  setSubmissionTestResults(null)
                  setActiveEditorTab('code')
                  router.replace(`/problems/${params.slug}`, { scroll: false })
                }}
                className="ml-0.5 text-muted-foreground hover:text-white cursor-pointer leading-none"
              >×</span>
            </button>
          )}
        </div>

        {/* Right panel controls */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <button
            onClick={togglePaneMaximized}
            className="p-1 hover:bg-[#2c2c2c] rounded-lg transition-colors hover:text-white cursor-pointer"
            title="Maximize Alt +"
          >
            {isPaneMaximized ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
          <button
            onClick={() => {
              setIsEditorFolded(!isEditorFolded)
              if (!isEditorFolded) setConsoleOpen(true)
            }}
            className="p-1 hover:bg-[#2c2c2c] rounded-lg transition-colors hover:text-white" 
            title="Fold Alt -"
          >
            {isEditorFolded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Custom Code Editor Row 2: Settings + Actions */}
      {!isEditorFolded && (
        <div className="flex items-center justify-between px-4 py-2 bg-background border-b border-border select-none text-muted-foreground shrink-0">
          <div className="flex items-center gap-3">
            {/* Language Dropdown Selector */}
            <div className="relative flex items-center">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="appearance-none pr-6 pl-1 py-0.5 bg-transparent hover:text-white rounded text-[#e6e6e6] text-xs font-bold focus:outline-none transition-colors cursor-pointer"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang} className="bg-background text-white">
                    {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : lang.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 pointer-events-none text-xs text-muted-foreground">
                <ChevronDown size={10} />
              </div>
            </div>
          </div>

          {/* Action commands */}
          <div className="flex items-center gap-3 text-muted-foreground">
            <button className="p-1 hover:text-white transition-colors" title="Format Code">
              <AlignLeft size={15} />
            </button>
            <button 
              onClick={() => setShowRetrieveModal(true)}
              className="p-1 hover:text-white transition-colors" 
              title="Retrieve last submitted code"
            >
              <Braces size={15} />
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="p-1 hover:text-white transition-colors"
              title="Reset to default code definition"
            >
              <RotateCcw size={15} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-1 hover:text-white transition-colors" 
              title={isFullscreen ? "Exit Full Screen" : "Full screen"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
