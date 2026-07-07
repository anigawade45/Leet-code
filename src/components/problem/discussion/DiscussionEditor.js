import React, { useState } from 'react'

export default function DiscussionEditor({ user, submitting, onPost }) {
  const [newTitle, setNewTitle] = useState('')
  const [newComment, setNewComment] = useState('')

  const handlePost = async () => {
    const success = await onPost(newTitle, newComment)
    if (success) {
      setNewTitle('')
      setNewComment('')
    }
  }

  return (
    <div className="mb-8 bg-card/20 border border-border/30 p-4 rounded-xl">
      <h3 className="text-sm font-bold text-foreground mb-3">Start a new discussion</h3>
      <input
        className="w-full bg-background border border-border/30 rounded-lg p-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors mb-3"
        placeholder="Title (optional)"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
      <textarea
        className="w-full bg-background border border-border/30 rounded-lg p-4 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors resize-y min-h-[100px]"
        placeholder="Type your question or approach here..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <div className="flex items-center justify-end mt-3">
        <button
          onClick={handlePost}
          disabled={submitting || !newComment.trim() || !user}
          className="px-5 py-2 bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors shadow-md shadow-[#2a9d8f]/10"
        >
          {user ? 'Post Discussion' : 'Sign in to Post'}
        </button>
      </div>
    </div>
  )
}
