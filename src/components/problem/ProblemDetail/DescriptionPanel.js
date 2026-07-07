import React, { useState } from 'react'
import { ChevronDown, Tag, Lock, Lightbulb, List, MessageSquare, Star } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import DiscussionTab from '../discussion/DiscussionTab'
import BadgeNotification from '@/components/badges/BadgeNotification'
import { useEffect } from 'react'

export function formatDescription(desc) {
  if (!desc) return ''
  const parts = desc.split(/`([^`]+)`/g)
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs text-foreground border border-border/10"
        >
          {part}
        </code>
      )
    }
    return part
  })
}

export function DescriptionPanel({ problem, user, isSolved }) {
  const [activeSection, setActiveSection] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)
  
  useEffect(() => {
    if (!user) return
    const fetchFavorite = async () => {
      try {
        const res = await fetch('/api/lists')
        if (res.ok) {
          const data = await res.json()
          const favList = data.lists?.find(l => l.title === 'Favorite')
          if (favList && favList.problems.some(p => p.problemId === problem.id)) {
            setIsFavorited(true)
          }
        }
      } catch (e) {
        console.error('Failed to fetch favorites', e)
      }
    }
    fetchFavorite()
  }, [user, problem.id])

  const toggleFavorite = async () => {
    if (!user) return // or show login modal
    try {
      const res = await fetch('/api/lists/toggle-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId: problem.id, listTitle: 'Favorite' })
      })
      if (res.ok) {
        const data = await res.json()
        setIsFavorited(data.added)
      }
    } catch (e) {
      console.error('Failed to toggle favorite', e)
    }
  }

  const handleScrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.open = true
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (!problem) return null

  return (
    <div className="flex-1 overflow-y-auto">
      {problem.newBadge && <BadgeNotification badge={problem.newBadge} />}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {problem.problemNumber}. {problem.title}
            </h1>
            <button 
              onClick={toggleFavorite}
              className={`transition-colors mt-0.5 ${isFavorited ? 'text-[#ffc01e]' : 'text-muted-foreground hover:text-foreground'}`}
              title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Star size={18} className={isFavorited ? 'fill-current' : ''} />
            </button>
          </div>
          {/* Solved Indicator */}
          {isSolved && (
            <div className="flex items-center gap-1.5 text-[#2cbb5d] text-[13px] font-semibold">
              <span>Solved</span>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
          <span className={`px-2.5 py-1 rounded-full bg-card font-medium ${
            problem.difficulty === 'EASY' ? 'text-[#00b8a3]' :
            problem.difficulty === 'MEDIUM' ? 'text-[#ffc01e]' :
            'text-[#ef4444]'
          }`}>
            {problem.difficulty === 'EASY' ? 'Easy' : problem.difficulty === 'MEDIUM' ? 'Medium' : 'Hard'}
          </span>
          
          <div 
            onClick={() => handleScrollToSection('section-topics')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card cursor-pointer hover:bg-accent transition-colors"
          >
            <Tag size={13} />
            <span>Topics</span>
          </div>
          
          <div 
            onClick={() => handleScrollToSection('section-companies')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card cursor-pointer hover:bg-accent transition-colors text-[#d19c4c]"
          >
            <Lock size={13} />
            <span>Companies</span>
          </div>
          
          <div 
            onClick={() => handleScrollToSection('section-hints')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card cursor-pointer hover:bg-accent transition-colors"
          >
            <Lightbulb size={13} />
            <span>Hint</span>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none text-[14px] leading-relaxed text-foreground font-sans mb-10 prose-p:mb-4 prose-pre:bg-card prose-pre:border prose-pre:border-border/30 prose-pre:p-4 prose-pre:rounded-xl">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              code({node, inline, className, children, ...props}) {
                return (
                  <code
                    className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs text-foreground border border-border/10"
                    {...props}
                  >
                    {children}
                  </code>
                )
              },
              img({node, ...props}) {
                return <img className="max-w-full h-auto rounded-lg my-4 bg-white/5" {...props} />
              }
            }}
          >
            {problem.description}
          </ReactMarkdown>
        </div>

        {/* Examples */}
        {problem.examples && Array.isArray(problem.examples) && problem.examples.length > 0 && (
          <div className="mb-10 space-y-6 text-foreground text-[14px] leading-relaxed">
            {problem.examples.map((ex, idx) => (
              <div key={idx}>
                <p className="font-bold text-foreground mb-3">Example {idx + 1}:</p>
                
                {ex.image && <img src={ex.image} alt={`Example ${idx + 1}`} className="max-w-full h-auto rounded-lg mb-3 bg-white/5" />}
                {ex.img && <img src={ex.img} alt={`Example ${idx + 1}`} className="max-w-full h-auto rounded-lg mb-3 bg-white/5" />}
                
                <div className="pl-4 border-l-2 border-border space-y-1 font-mono text-[13px] text-muted-foreground">
                  <p><strong className="text-foreground">Input:</strong> {ex.input}</p>
                  <p><strong className="text-foreground">Output:</strong> {ex.output}</p>
                  {ex.explanation && (
                    <div className="flex gap-2">
                      <strong className="text-foreground shrink-0">Explanation:</strong> 
                      <div className="prose dark:prose-invert prose-sm max-w-none text-muted-foreground font-sans leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                          components={{
                            code({node, inline, className, children, ...props}) {
                              return (
                                <code className="px-1 py-0.5 bg-muted rounded font-mono text-xs text-foreground" {...props}>
                                  {children}
                                </code>
                              )
                            },
                            img({node, ...props}) {
                              return <img className="max-w-full h-auto rounded my-2 bg-white/5" {...props} />
                            }
                          }}
                        >
                          {ex.explanation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && (
          <div className="mb-10 text-foreground text-[14px] leading-relaxed">
            <p className="font-bold text-foreground mb-3">Constraints:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              {problem.constraints.split('\n').filter(c => c.trim()).map((constraint, idx) => (
                <li key={idx}>
                  <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-[13px] text-foreground border border-border/10">
                    {constraint.trim()}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Inline Stats */}
        <div className="flex items-center gap-4 text-[13px] text-muted-foreground mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-1.5">
            <span>Accepted</span>
            <span className="text-foreground font-semibold text-[15px]">
              {problem.stats?.accepted > 0 ? (problem.stats.accepted).toLocaleString() : '0'}
            </span>
            <span className="text-muted-foreground text-xs">
              /{problem.stats?.total > 0 ? (problem.stats.total >= 1000000 ? (problem.stats.total / 1000000).toFixed(1) + 'M' : (problem.stats.total >= 1000 ? (problem.stats.total / 1000).toFixed(1) + 'K' : problem.stats.total)) : '0'}
            </span>
          </div>
          
          <div className="w-[1px] h-3.5 bg-muted" />
          
          <div className="flex items-center gap-1.5">
            <span>Acceptance Rate</span>
            <span className="text-foreground font-semibold text-[15px]">
              {problem.stats?.total > 0 
                ? ((problem.stats.accepted / problem.stats.total) * 100).toFixed(1) 
                : '0.0'}%
            </span>
          </div>
        </div>

        <div className="space-y-0">
          <details id="section-topics" className="group border-b border-border select-none">
            <summary className="flex items-center justify-between py-3.5 cursor-pointer text-[13px] font-medium text-foreground hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <Tag size={16} className="text-muted-foreground" />
                <span>Topics</span>
              </div>
              <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-5 pt-1 text-sm text-foreground flex flex-wrap gap-2">
              {problem.tags?.map(t => (
                <span key={t.tag.id} className="bg-card hover:bg-accent px-3 py-1 rounded-full text-xs cursor-pointer transition-colors">
                  {t.tag.name}
                </span>
              ))}
            </div>
          </details>

          <details id="section-companies" className="group border-b border-border select-none">
            <summary className="flex items-center justify-between py-3.5 cursor-pointer text-[13px] font-medium text-[#d19c4c] hover:text-[#e2a850] transition-colors list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <Lock size={16} className="text-[#d19c4c]" />
                <span>Companies</span>
              </div>
              <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-5 pt-1 text-sm text-foreground flex flex-wrap gap-2">
              {problem.companies && problem.companies.length > 0 ? (
                problem.companies.map(c => (
                  <span key={c.company.id} className="bg-background hover:bg-card border border-[#d19c4c]/20 px-3 py-1 rounded-full text-xs cursor-pointer transition-colors text-[#d19c4c]">
                    {c.company.name}
                  </span>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No company tags available.</p>
              )}
            </div>
          </details>

          {problem.hints && problem.hints.map((hint, idx) => (
            <details id={idx === 0 ? 'section-hints' : `section-hints-${idx}`} key={idx} className="group border-b border-border select-none">
              <summary className="flex items-center justify-between py-3.5 cursor-pointer text-[13px] font-medium text-foreground hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
                <div className="flex items-center gap-3">
                  <Lightbulb size={16} className="text-muted-foreground" />
                  <span>Hint {idx + 1}</span>
                </div>
                <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="pb-5 pt-1 text-sm text-foreground leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {hint}
                </ReactMarkdown>
              </div>
            </details>
          ))}

          <details className="group border-b border-border select-none">
            <summary className="flex items-center justify-between py-3.5 cursor-pointer text-[13px] font-medium text-foreground hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <List size={16} className="text-muted-foreground" />
                <span>Similar Questions</span>
              </div>
              <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-5 pt-1 text-sm text-muted-foreground">
              <p>Coming soon...</p>
            </div>
          </details>

          <details id="section-discussion" className="group border-b border-border select-none">
            <summary className="flex items-center justify-between py-3.5 cursor-pointer text-[13px] font-medium text-foreground hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-3">
                <MessageSquare size={16} className="text-muted-foreground" />
                <span>Discussion {problem._count?.discussions > 0 ? `(${problem._count.discussions >= 1000 ? (problem._count.discussions / 1000).toFixed(1) + 'K' : problem._count.discussions})` : ''}</span>
              </div>
              <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-5 pt-1 text-sm text-muted-foreground">
              <DiscussionTab problem={problem} user={user} />
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}
