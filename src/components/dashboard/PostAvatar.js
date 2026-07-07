import { memo } from 'react'
import Image from 'next/image'

export const PostAvatar = memo(function PostAvatar({ post }) {
  if (post.isOfficial && post.authorAvatar) {
    return (
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0">
        <Image src={post.authorAvatar} alt="LeetCode" width={40} height={40} className="w-8 h-8 object-contain" />
      </div>
    )
  }
  
  if (post.isAnonymous) {
    return (
      <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center shrink-0">
        <div className="w-6 h-6 bg-muted-foreground/30 rounded-full" />
      </div>
    )
  }

  // fallback to initial
  return (
    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-semibold text-lg">
      {post.author.charAt(0).toUpperCase()}
    </div>
  )
})
