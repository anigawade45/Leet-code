import { memo } from 'react'
import Link from 'next/link'
import { PostAvatar } from './PostAvatar'

export const FeedPost = memo(function FeedPost({ post }) {
  return (
    <Link 
      href={`/discuss/${post.id}`} 
      className="flex gap-4 py-6 border-b border-border px-2 group cursor-pointer hover:bg-card rounded-xl transition-colors"
    >
      <PostAvatar post={post} />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          {post.isOfficial && <span className="text-primary font-medium">{post.author}</span>}
          {!post.isOfficial && <span className="text-foreground font-medium">{post.author}</span>}
          <span>{post.timeAgo}</span>
        </div>
        <div className="text-[15px] text-foreground mb-1.5 leading-snug">
          {post.isOfficial && <span className="text-muted-foreground mr-1">LeetCode posted</span>}
          {!post.isOfficial && post.isAnonymous && <span className="text-muted-foreground mr-1">An anonymous user posted</span>}
          {!post.isOfficial && !post.isAnonymous && <span className="text-muted-foreground mr-1">{post.author} posted</span>}
          <span className="text-primary group-hover:underline">{post.title}</span>
        </div>
        <p className="text-[14px] text-muted-foreground line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
      </div>
    </Link>
  )
})
