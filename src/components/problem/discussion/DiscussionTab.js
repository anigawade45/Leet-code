'use client'

import React from 'react'
import { useDiscussions } from '@/hooks/useDiscussions'
import DiscussionEditor from './DiscussionEditor'
import DiscussionToolbar from './DiscussionToolbar'
import DiscussionItem from './DiscussionItem'

export default function DiscussionTab({ problem, user }) {
  const {
    discussions,
    loading,
    sort,
    search,
    submitting,
    expandedReplies,
    repliesData,
    replyingTo,
    setSort,
    setSearch,
    setReplyingTo,
    handlePostComment,
    handlePostReply,
    handleUpvote,
    toggleReplies,
    handleSaveEdit,
    handleDelete
  } = useDiscussions(problem.slug, user)

  const handlers = {
    handlePostReply,
    handleUpvote,
    toggleReplies,
    handleSaveEdit,
    handleDelete
  }

  return (
    <div className="p-6">
      <DiscussionEditor 
        user={user} 
        submitting={submitting} 
        onPost={handlePostComment} 
      />

      <DiscussionToolbar 
        search={search}
        sort={sort}
        onSearchChange={setSearch}
        onSortChange={setSort}
      />

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm">Loading discussions...</div>
      ) : discussions.length > 0 ? (
        <div className="space-y-2">
          {discussions.map(comment => (
            <DiscussionItem 
              key={comment.id}
              comment={comment}
              user={user}
              handlers={handlers}
              expandedReplies={expandedReplies}
              repliesData={repliesData}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No discussions found. Be the first to start one!
        </div>
      )}
    </div>
  )
}
