import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { FileText, ChevronRight, Video, Beaker, Clock, Code2, PlayCircle, Lightbulb, List } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function EditorialPanel({ problem }) {
  if (!problem) return null
  
  const handleScrollToApproach = (idx) => {
    const el = document.getElementById(`approach-${idx}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {problem.editorial ? (
        <div className="p-6">
          <div className="mb-8 border-b border-border pb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-3">Solution</h1>
            <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><FileText size={15} /> Official Editorial</span>
              {problem.editorial.createdAt && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted"></span>
                  <span>Updated {formatDistanceToNow(new Date(problem.editorial.createdAt), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </div>
          
          {/* Table of Contents */}
          {Array.isArray(problem.editorial.approaches) && problem.editorial.approaches.length > 0 && (
            <div className="mb-10 bg-card/60 border border-border/60 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60 bg-[#313131]/60 flex items-center gap-2">
                <List size={16} className="text-muted-foreground" />
                <h2 className="text-[14px] font-semibold text-white">Approaches</h2>
              </div>
              <div className="p-2 space-y-1">
                {problem.editorial.approaches.map((app, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleScrollToApproach(idx)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-[13.5px] text-[#e6e6e6] hover:bg-muted/80 hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">
                      <span className="text-muted-foreground mr-2">Approach {idx + 1}:</span>
                      {app.title}
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-14">
            {Array.isArray(problem.editorial.approaches) && problem.editorial.approaches.map((app, idx) => (
              <div key={idx} id={`approach-${idx}`} className="space-y-6 scroll-mt-6">
                <div className="border-b border-border pb-3">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                    <span className="flex items-center justify-center w-7 h-7 rounded-md bg-[#2a9d8f]/20 text-[#2a9d8f] text-[13px]">
                      {idx + 1}
                    </span>
                    {app.title}
                  </h2>
                </div>
                
                {app.algorithm && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
                      <Lightbulb size={18} className="text-[#ffa116]" /> Intuition & Algorithm
                    </div>
                    <div className="prose prose-invert max-w-none text-[14px] leading-relaxed text-[#e6e6e6] font-sans prose-p:mb-4 prose-pre:bg-card prose-pre:border prose-pre:border-border/30 prose-pre:p-4 prose-pre:rounded-xl">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {app.algorithm}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {app.implementation && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[15px] font-semibold text-white">
                        <Code2 size={18} className="text-[#00b8a3]" /> Implementation
                      </div>
                    </div>
                    
                    <div className="rounded-xl border border-border overflow-hidden bg-card">
                      {/* Fake language tab */}
                      <div className="flex items-center px-4 h-11 border-b border-border bg-[#313131]">
                        <span className="text-[13px] font-medium text-white border-b-2 border-[#00b8a3] h-full flex items-center px-2">Java</span>
                      </div>
                      <div className="p-4 overflow-x-auto text-[13px]">
                        <div className="prose prose-invert max-w-none prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 border-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                            {'```java\n' + app.implementation + '\n```'}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(app.timeComplexity || app.spaceComplexity) && (
                  <div className="space-y-4 bg-card/40 p-5 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2 text-[15px] font-semibold text-white mb-2">
                      <Clock size={18} className="text-[#ffc01e]" /> Complexity Analysis
                    </div>
                    <div className="space-y-3 text-[14px] text-[#e6e6e6] leading-relaxed">
                      {app.timeComplexity && (
                        <div>
                          <strong className="text-white">Time Complexity:</strong> <code className="px-1.5 py-0.5 mx-1 bg-background text-white rounded font-mono text-[13px] border border-border/30">{app.timeComplexity}</code>
                        </div>
                      )}
                      {app.spaceComplexity && (
                        <div>
                          <strong className="text-white">Space Complexity:</strong> <code className="px-1.5 py-0.5 mx-1 bg-background text-white rounded font-mono text-[13px] border border-border/30">{app.spaceComplexity}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground max-w-sm px-6">
            <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border">
              <FileText size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Editorial Yet</h3>
            <p className="text-[14px] leading-relaxed">
              We're still working on the official solution for this problem. Check back later or explore community discussions!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
