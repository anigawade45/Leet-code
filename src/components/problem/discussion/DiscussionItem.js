import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { ThumbsUp, MessageSquare, Reply, MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useClickOutside } from '@/hooks/useClickOutside'

export default function DiscussionItem({ 
  comment, 
  user,
  isReply = false, 
  parentId = null,
  handlers,
  expandedReplies,
  repliesData,
  replyingTo,
  setReplyingTo
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(comment.title || '')
  const [editContent, setEditContent] = useState(comment.content || '')
  const [actionMenuOpen, setActionMenuOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const menuRef = useRef(null)
  useClickOutside(menuRef, () => setActionMenuOpen(false))

  const isAuthor = user && user.userId === comment.userId

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditTitle(comment.title || '')
    setEditContent(comment.content || '')
    setActionMenuOpen(false)
  }

  const handleSaveEdit = async () => {
    const success = await handlers.handleSaveEdit(comment.id, isReply, parentId, editTitle, editContent)
    if (success) {
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    handlers.handleDelete(comment.id, isReply, parentId)
  }

  const handlePostReply = async () => {
    const success = await handlers.handlePostReply(!isReply ? comment.id : parentId, replyContent)
    if (success) {
      setReplyContent('')
    }
  }

  return (
    <div className={`py-4 ${!isReply ? 'border-b border-border' : 'pl-8 mt-2 border-l-2 border-border'}`}>
      <div className="flex items-start justify-between mb-2 relative">
        <div className="flex items-center gap-3">
          {comment.user.avatar ? (
            <Image src={comment.user.avatar} alt={comment.user.username} width={32} height={32} className="w-8 h-8 rounded-full bg-muted" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2a9d8f] to-[#21867a] flex items-center justify-center text-white text-xs font-bold">
              {comment.user.username[0].toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-muted-foreground">{comment.user.username}</span>
            <span className="text-[10px] text-muted-foreground/50">
              {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'just now'}
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && ' (edited)'}
            </span>
          </div>
        </div>

        {isAuthor && !isEditing && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setActionMenuOpen(!actionMenuOpen)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <MoreHorizontal size={16} />
            </button>
            {actionMenuOpen && (
              <div className="absolute right-0 top-6 w-32 bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden z-10">
                <button 
                  onClick={handleStartEdit}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-muted/50 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {isEditing ? (
        <div className="my-3 space-y-3">
          {!isReply && (
            <input
              className="w-full bg-background border border-border/30 rounded-lg p-2 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50"
              placeholder="Title (optional)"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          )}
          <textarea
            className="w-full bg-background border border-border/30 rounded-lg p-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-y min-h-[100px]"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveEdit}
              disabled={!editContent.trim()}
              className="px-4 py-1.5 bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 rounded-lg text-white text-xs font-semibold transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          {comment.title && !isReply && (
            <h3 className="text-base font-bold text-foreground mb-2">{comment.title}</h3>
          )}
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {comment.content}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
        <button 
          onClick={() => handlers.handleUpvote(comment.id, isReply, parentId)}
          className={`flex items-center gap-1.5 transition-colors ${comment.hasUpvoted ? 'text-[#2a9d8f]' : 'hover:text-[#2a9d8f]'}`}
        >
          <ThumbsUp size={14} className={comment.hasUpvoted ? 'fill-current' : ''} />
          <span>{comment.upvotes >= 1000 ? (comment.upvotes / 1000).toFixed(1) + 'K' : comment.upvotes}</span>
        </button>
        
        {!isReply && (comment._count?.replies > 0 || repliesData[comment.id]?.length > 0) && (
          <button 
            onClick={() => handlers.toggleReplies(comment.id)}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <MessageSquare size={14} />
            <span>Show {comment._count?.replies || repliesData[comment.id]?.length} Replies</span>
          </button>
        )}

        {!isEditing && (
          <button 
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto"
          >
            <Reply size={14} />
            <span>Reply</span>
          </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <div className="mt-4 flex flex-col gap-2">
          <textarea
            className="w-full bg-background border border-border/30 rounded-lg p-3 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="Type your reply here..."
            rows={3}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setReplyingTo(null)}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handlePostReply}
              disabled={!replyContent.trim()}
              className="px-4 py-1.5 bg-[#2a9d8f] hover:bg-[#238678] disabled:opacity-50 rounded-lg text-white text-xs font-semibold transition-colors"
            >
              Post Reply
            </button>
          </div>
        </div>
      )}

      {!isReply && expandedReplies[comment.id] && repliesData[comment.id] && (
        <div className="mt-4">
          {repliesData[comment.id].map(reply => (
            <DiscussionItem
              key={reply.id}
              comment={reply}
              user={user}
              isReply={true}
              parentId={comment.id}
              handlers={handlers}
              expandedReplies={expandedReplies}
              repliesData={repliesData}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
