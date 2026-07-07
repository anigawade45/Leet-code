import { CheckSquare, Terminal, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react'

export function ConsoleHeader({
  consoleOpen,
  setConsoleOpen,
  activeConsoleTab,
  setActiveConsoleTab,
  running,
  submissionResultsLoading,
  consoleMaximized,
  setConsoleMaximized,
}) {
  return (
    <div className={`flex items-center justify-between px-4 bg-background text-xs font-bold ${
      consoleOpen ? 'border-b border-border' : ''
    }`}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => { setActiveConsoleTab('testcase'); if (!consoleOpen) setConsoleOpen(true) }}
          className={`py-3 px-3 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeConsoleTab === 'testcase'
              ? 'text-[#00b8a3] font-bold border-b-2 border-[#00b8a3]'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <CheckSquare size={13} className={activeConsoleTab === 'testcase' ? 'text-[#00b8a3]' : 'text-muted-foreground'} />
          <span>Testcase</span>
        </button>
        
        <span className="text-[#2c2c2c] text-xs select-none">|</span>
        
        <button
          onClick={() => { setActiveConsoleTab('result'); if (!consoleOpen) setConsoleOpen(true) }}
          className={`py-3 px-3 flex items-center gap-1.5 transition-all cursor-pointer ${
            activeConsoleTab === 'result'
              ? 'text-[#00b8a3] font-bold border-b-2 border-[#00b8a3]'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          <Terminal size={13} className={activeConsoleTab === 'result' ? 'text-[#00b8a3]' : 'text-muted-foreground'} />
          <span>Test Result</span>
        </button>
      </div>
      
      <div className="flex items-center gap-1.5">
        {(running || submissionResultsLoading) && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#2a9d8f] mr-2">
            <div className="w-3 h-3 border-2 border-transparent border-t-[#2a9d8f] rounded-full animate-spin"></div>
            <span>Running...</span>
          </div>
        )}
        
        {consoleOpen && (
          <button
            onClick={() => setConsoleMaximized(!consoleMaximized)}
            className="p-1 hover:bg-[#2c2c2c] rounded-lg transition-colors text-muted-foreground hover:text-white"
            title={consoleMaximized ? 'Restore Console' : 'Maximize Console'}
          >
            {consoleMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}

        <button
          onClick={() => setConsoleOpen(!consoleOpen)}
          className="p-1 hover:bg-[#2c2c2c] rounded-lg transition-colors text-muted-foreground hover:text-white cursor-pointer"
          title={consoleOpen ? 'Collapse Console' : 'Expand Console'}
        >
          {consoleOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>
    </div>
  )
}
