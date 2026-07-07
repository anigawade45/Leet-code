'use client'

import { useEffect, useState } from 'react'
import { FEED_POSTS } from '@/constants/feed'
import { FeedPost } from './FeedPost'
import { FeedSkeleton } from './FeedSkeleton'

export function PostList() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setPosts(FEED_POSTS)
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <FeedSkeleton />
  }

  return (
    <div className="flex flex-col">
      {posts.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </div>
  )
}
