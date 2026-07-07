'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Bold, Italic, List, ListOrdered, Quote, Braces, Link as LinkIcon, Image as ImageIcon, Eye, Save, Loader2, File, Heading 
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'

export function NotePanel({ problem, user }) {
  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const textareaRef = useRef(null)

  // Fetch initial note
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchNote = async () => {
      try {
        const res = await fetch(`/api/problems/${problem.slug}/note`)
        if (res.ok) {
          const data = await res.json()
          if (data.note) {
            setContent(data.note.content)
          }
        }
      } catch (e) {
        console.error('Failed to fetch note:', e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchNote()
  }, [problem.slug, user])

  // Debounced save
  useEffect(() => {
    if (!user || isLoading) return

    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        const res = await fetch(`/api/problems/${problem.slug}/note`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        })
        if (res.ok) {
          setLastSaved(new Date())
        }
      } catch (e) {
        console.error('Failed to save note:', e)
      } finally {
        setIsSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [content, problem.slug, user, isLoading])

  const insertText = (before, after = '') => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = el.value
    
    const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end)
    setContent(newText)
    
    // Reset focus and cursor position after render
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const el = textareaRef.current
      const start = el.selectionStart
      const text = el.value
      
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const currentLine = text.substring(lineStart, start)
      
      const match = currentLine.match(/^(\s*)([-*>]|\d+\.)\s+(.*)$/)
      
      if (match) {
        e.preventDefault()
        
        const indent = match[1]
        const marker = match[2]
        const lineContent = match[3]
        
        if (!lineContent.trim()) {
          const newText = text.substring(0, lineStart) + '\n' + text.substring(start)
          setContent(newText)
          setTimeout(() => {
            el.selectionStart = el.selectionEnd = lineStart + 1
          }, 0)
          return
        }
        
        let nextMarker = marker
        if (/^\d+\.$/.test(marker)) {
          const num = parseInt(marker, 10)
          nextMarker = `${num + 1}.`
        }
        
        const insertString = `\n${indent}${nextMarker} `
        const newText = text.substring(0, start) + insertString + text.substring(start)
        setContent(newText)
        setTimeout(() => {
          el.selectionStart = el.selectionEnd = start + insertString.length
        }, 0)
      }
    }
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center text-muted-foreground">
        <div>
          <File size={48} className="mx-auto mb-4 opacity-20" />
          <p>Please sign in to take notes for this problem.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-[#282828]">
        <div className="flex items-center gap-1 text-[#8c8c8c]">
          <button onClick={() => insertText('# ')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Heading"><Heading size={16} /></button>
          <button onClick={() => insertText('**', '**')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Bold"><Bold size={16} /></button>
          <button onClick={() => insertText('*', '*')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Italic"><Italic size={16} /></button>
          <button onClick={() => insertText('1. ')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Numbered List"><ListOrdered size={16} /></button>
          <button onClick={() => insertText('- ')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Bullet List"><List size={16} /></button>
          <button onClick={() => insertText('> ')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Quote"><Quote size={16} /></button>
          <button onClick={() => insertText('```\n', '\n```')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Code Block"><Braces size={16} /></button>
          <button onClick={() => insertText('[](', 'https://)')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Link"><LinkIcon size={16} /></button>
          <button onClick={() => insertText('![](', 'https://)')} className="p-1.5 hover:bg-[#333] hover:text-white rounded transition-colors" title="Image"><ImageIcon size={16} /></button>
          <div className="w-px h-4 bg-border/50 mx-1"></div>
          <button 
            onClick={() => setIsPreview(!isPreview)}
            className={`p-1.5 rounded transition-colors ${isPreview ? 'text-[#1a8cff]' : 'hover:bg-[#333] hover:text-white'}`}
            title="Preview"
          >
            <Eye size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            {isSaving ? (
              <><Loader2 size={12} className="animate-spin" /> Saving...</>
            ) : lastSaved ? (
              <><Save size={12} /> Saved</>
            ) : null}
          </div>
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 overflow-auto relative bg-[#1e1e1e]">
        {isPreview ? (
          <div className="prose prose-invert prose-sm max-w-none p-6">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">No notes yet. Switch to edit mode to start typing.</p>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here...(Markdown is enabled)"
            className="absolute inset-0 w-full h-full bg-transparent text-white p-6 resize-none focus:outline-none placeholder-muted-foreground/50 text-sm"
          />
        )}
      </div>
    </div>
  )
}
