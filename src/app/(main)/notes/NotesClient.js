'use client'

import React, { useState } from 'react'
import { FileText, ExternalLink, ChevronDown, ChevronUp, Trash2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

export function NotesClient({ initialNotes, totalPages, currentPage }) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [expandedNoteIds, setExpandedNoteIds] = useState(new Set())
  const [showDescription, setShowDescription] = useState(false)
  const [hoveredNoteId, setHoveredNoteId] = useState(null)
  const [noteToDelete, setNoteToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedNoteIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedNoteIds(newExpanded)
  }

  const handleDelete = async () => {
    if (!noteToDelete) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/problems/${noteToDelete.problem.slug}/note`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setNotes((prev) => prev.filter(n => n.id !== noteToDelete.id))
        setNoteToDelete(null)
      }
    } catch (e) {
      console.error('Failed to delete note:', e)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto notes-print-area">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2 print-hidden">
        <FileText size={28} className="text-[#ffa116]" />
        <h1 className="text-2xl font-semibold text-foreground">My Notes</h1>
      </div>

      {/* Instructions Box */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-background border border-border border-l-4 border-l-[#1a8cff] p-5 shadow-sm rounded-r-md print-hidden">
        <div className="text-sm text-foreground">
          <p className="font-semibold text-[#1a8cff] mb-2 text-base">Instructions</p>
          <p className="mb-2">Here you can review all your notes.</p>
          <p>You can have all your notes <button className="text-[#1a8cff] hover:underline" onClick={() => window.print()}>printed as PDF</button>.</p>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="showDesc" 
            checked={showDescription}
            onChange={(e) => setShowDescription(e.target.checked)}
            className="w-4 h-4 rounded border-border cursor-pointer accent-[#1a8cff]"
          />
          <label htmlFor="showDesc" className="text-sm text-foreground cursor-pointer select-none">
            Show Description
          </label>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex flex-col gap-3 mt-4 print-gap-4">
        {notes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card/20 rounded-lg border border-border/50 print-hidden">
            You don't have any notes yet. Go to a problem to create one!
          </div>
        ) : (
          notes.map((note) => {
            const isExpanded = expandedNoteIds.has(note.id)
            
            return (
              <div key={note.id} className="border border-border/50 bg-background rounded-md transition-all hover:border-border print:border print:border-gray-300 print:mb-4 print:break-inside-avoid print:shadow-none">
                {/* Accordion Header */}
                <div className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors print:bg-gray-100">
                  <div 
                    className="flex items-center gap-2 text-[15px] font-medium text-foreground cursor-pointer relative"
                    onClick={() => toggleExpand(note.id)}
                    onMouseEnter={() => setHoveredNoteId(note.id)}
                    onMouseLeave={() => setHoveredNoteId(null)}
                  >
                    {note.problem.problemNumber}. {note.problem.title}
                    <Link href={`/problems/${note.problem.slug}`} onClick={(e) => e.stopPropagation()} className="text-[#1a8cff] hover:text-[#1a8cff]/80 transition-colors print-hidden">
                      <ExternalLink size={14} />
                    </Link>

                    {/* Problem Description Hover */}
                    {showDescription && hoveredNoteId === note.id && (
                      <div 
                        className="absolute left-0 top-full mt-2 w-[400px] z-[9999] bg-popover border border-border rounded-lg shadow-xl p-4 transition-all print-hidden"
                        onClick={(e) => e.stopPropagation()}
                        style={{ cursor: 'auto' }}
                      >
                        <div 
                          className="prose dark:prose-invert prose-sm max-h-[300px] overflow-y-auto pointer-events-auto"
                          dangerouslySetInnerHTML={{ __html: note.problem.description }} 
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground print-hidden">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setNoteToDelete(note) }} 
                      className="p-1 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleExpand(note.id) }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Accordion Body */}
                <div className={`${isExpanded ? 'block' : 'hidden'} print:block p-6 border-t border-border/50 bg-card text-card-foreground print:bg-white print:text-black print:border-gray-200`}>
                  <div className="prose dark:prose-invert prose-sm max-w-none print:prose-slate print:max-w-full">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {note.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 print-hidden text-sm">
          <button 
            disabled={currentPage <= 1}
            onClick={() => router.push(`/notes?page=${currentPage - 1}`)}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors font-medium"
          >
            Previous
          </button>
          <span className="text-muted-foreground font-medium">Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => router.push(`/notes?page=${currentPage + 1}`)}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors font-medium"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm print-hidden">
          <div className="bg-background rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full border-4 border-orange-200 text-orange-400 flex items-center justify-center mb-6">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>
            
            <h2 className="text-xl font-medium text-foreground mb-4">
              Are you sure you want to delete the note "{noteToDelete.problem.problemNumber}. {noteToDelete.problem.title}"?
            </h2>
            
            <p className="text-muted-foreground mb-8 text-sm">
              You will not be able to recover this note!
            </p>
            
            <div className="flex items-center justify-center gap-3 w-full">
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="flex-1 bg-[#d9534f] hover:bg-[#c9302c] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button 
                onClick={() => setNoteToDelete(null)} 
                disabled={isDeleting}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg font-medium transition-colors"
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
