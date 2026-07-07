import { FileText, BookOpen, Lightbulb, History, File, X } from 'lucide-react'

export function ProblemHeader({ activeLeftTab, setActiveLeftTab, isNoteOpen, setIsNoteOpen }) {
  return (
    <div className="flex bg-card p-1.5 gap-1 select-none overflow-x-auto hide-scrollbar shrink-0">
      <button
        onClick={() => setActiveLeftTab('description')}
        className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${activeLeftTab === 'description'
            ? 'bg-background text-white shadow-sm'
            : 'text-muted-foreground hover:bg-[#333] hover:text-white'
          }`}
      >
        <FileText size={13} className={activeLeftTab === 'description' ? 'text-blue-400' : ''} />
        <span>Description</span>
      </button>

      {isNoteOpen && (
        <button
          onClick={() => setActiveLeftTab('note')}
          className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold whitespace-nowrap transition-all group ${
            activeLeftTab === 'note'
              ? 'bg-background text-white shadow-sm'
              : 'text-muted-foreground hover:bg-[#333] hover:text-white'
          }`}
        >
          <File size={13} className={activeLeftTab === 'note' ? 'text-yellow-500' : ''} />
          <span>Note</span>
          <div 
            onClick={(e) => {
              e.stopPropagation()
              setIsNoteOpen(false)
              if (activeLeftTab === 'note') {
                setActiveLeftTab('description')
              }
            }}
            className={`ml-1 p-0.5 rounded-sm transition-colors ${
              activeLeftTab === 'note' 
                ? 'hover:bg-[#333] text-muted-foreground hover:text-white' 
                : 'opacity-0 group-hover:opacity-100 hover:bg-[#444] text-muted-foreground hover:text-white'
            }`}
          >
            <X size={12} />
          </div>
        </button>
      )}

      <button
        onClick={() => setActiveLeftTab('editorial')}
        className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${activeLeftTab === 'editorial'
            ? 'bg-background text-white shadow-sm'
            : 'text-muted-foreground hover:bg-[#333] hover:text-white'
          }`}
      >
        <BookOpen size={13} className={activeLeftTab === 'editorial' ? 'text-blue-400' : ''} />
        <span>Editorial</span>
      </button>

      <button
        onClick={() => setActiveLeftTab('solutions')}
        className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${activeLeftTab === 'solutions'
            ? 'bg-background text-white shadow-sm'
            : 'text-muted-foreground hover:bg-[#333] hover:text-white'
          }`}
      >
        <Lightbulb size={13} className={activeLeftTab === 'solutions' ? 'text-blue-400' : ''} />
        <span>Solutions</span>
      </button>

      <button
        onClick={() => setActiveLeftTab('submissions')}
        className={`flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${activeLeftTab === 'submissions'
            ? 'bg-background text-white shadow-sm'
            : 'text-muted-foreground hover:bg-[#333] hover:text-white'
          }`}
      >
        <History size={13} className={activeLeftTab === 'submissions' ? 'text-blue-400' : ''} />
        <span>Submissions</span>
      </button>
    </div>
  )
}
