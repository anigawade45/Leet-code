'use client'

import { useEffect, useState, use, useCallback } from 'react'
import Image from 'next/image'
import { MessageSquare, Send, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function ContestDiscussionPage({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const { user } = useAuth()
  
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Comment posting
  const [newComment, setNewComment] = useState('')
  const [isPosting, setIsPosting] = useState(false)

  // Reply posting
  const [replyingTo, setReplyingTo] = useState(null) // discussion ID
  const [replyContent, setReplyContent] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  const fetchDiscussions = useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${params.id}/discussions`)
      const data = await res.json()
      if (res.ok) {
        setDiscussions(data.discussions || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load discussions.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDiscussions()
  }, [fetchDiscussions])

  const handlePostComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    setIsPosting(true)
    try {
      const res = await fetch(`/api/contests/${params.id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })

      if (res.ok) {
        setNewComment('')
        fetchDiscussions()
      } else {
        alert('Failed to post comment')
      }
    } finally {
      setIsPosting(false)
    }
  }

  const handlePostReply = async (e, parentId) => {
    e.preventDefault()
    if (!replyContent.trim() || !user) return

    setIsReplying(true)
    try {
      const res = await fetch(`/api/contests/${params.id}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, parentId })
      })

      if (res.ok) {
        setReplyContent('')
        setReplyingTo(null)
        fetchDiscussions()
      } else {
        alert('Failed to post reply')
      }
    } finally {
      setIsReplying(false)
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-border border-t-[#2a9d8f] rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground">
      {error}
    </div>
  )

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare size={28} className="text-[#2a9d8f]" />
          <h2 className="text-2xl font-bold text-white">Contest Discussion</h2>
        </div>

        {/* Create new comment */}
        {user ? (
          <form onSubmit={handlePostComment} className="mb-10 bg-background border border-border rounded-xl p-4 flex gap-4">
            {user.avatar ? (
              <Image src={user.avatar} alt="Avatar" width={40} height={40} className="w-10 h-10 rounded-full bg-muted shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2a9d8f] flex items-center justify-center shrink-0 text-white font-bold">
                {user.username?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 flex flex-col gap-3">
              <textarea 
                placeholder="Share your thoughts or ask a question about the contest..."
                className="w-full bg-[#212121] border border-border/50 rounded-lg p-3 text-white focus:outline-none focus:border-[#2a9d8f] resize-y min-h-[80px]"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={!newComment.trim() || isPosting}
                  className="bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 px-5 py-2 rounded-lg font-bold text-white transition-colors flex items-center gap-2"
                >
                  <Send size={16} /> {isPosting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-10 p-6 bg-background border border-border rounded-xl text-center text-muted-foreground">
            You must be logged in to participate in the discussion.
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-6">
          {discussions.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">No discussions yet. Be the first to start one!</div>
          ) : (
            discussions.map(d => (
              <div key={d.id} className="bg-background border border-border rounded-xl p-5">
                {/* Parent Comment */}
                <div className="flex gap-4">
                  {d.user.avatar ? (
                    <Image src={d.user.avatar} alt={d.user.username} width={40} height={40} className="w-10 h-10 rounded-full shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <UserIcon size={20} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{d.user.username}</span>
                      <span className="text-xs text-muted-foreground">• {new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-300 whitespace-pre-wrap text-sm mb-3">{d.content}</p>
                    
                    {user && (
                      <button 
                        onClick={() => setReplyingTo(replyingTo === d.id ? null : d.id)}
                        className="text-xs font-bold text-muted-foreground hover:text-[#2a9d8f] transition-colors"
                      >
                        Reply
                      </button>
                    )}

                    {/* Reply Input */}
                    {replyingTo === d.id && (
                      <form onSubmit={(e) => handlePostReply(e, d.id)} className="mt-4 flex gap-3">
                        <input 
                          type="text" 
                          placeholder="Write a reply..."
                          className="flex-1 bg-[#212121] border border-border/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#2a9d8f]"
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                          autoFocus
                        />
                        <button 
                          type="submit" 
                          disabled={!replyContent.trim() || isReplying}
                          className="bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 px-4 py-2 rounded-lg font-bold text-white text-sm transition-colors"
                        >
                          {isReplying ? '...' : 'Reply'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Replies */}
                {d.replies && d.replies.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border pl-14 space-y-4">
                    {d.replies.map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        {reply.user.avatar ? (
                          <Image src={reply.user.avatar} alt={reply.user.username} width={32} height={32} className="w-8 h-8 rounded-full shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <UserIcon size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">{reply.user.username}</span>
                            <span className="text-[10px] text-muted-foreground">• {new Date(reply.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap text-sm">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
