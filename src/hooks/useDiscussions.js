'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useDiscussions(problemSlug, user) {
  const [discussions, setDiscussions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('best')
  const [search, setSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reply tracking
  const [expandedReplies, setExpandedReplies] = useState({})
  const [repliesData, setRepliesData] = useState({})
  const [replyingTo, setReplyingTo] = useState(null)

  const abortControllerRef = useRef(null)

  const fetchDiscussions = useCallback(async () => {
    // Abort previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setLoading(true)
    try {
      const res = await fetch(`/api/problems/${problemSlug}/discussions?sort=${sort}&search=${encodeURIComponent(search)}`, {
        signal: abortController.signal
      })
      const data = await res.json()
      if (res.ok) {
        setDiscussions(data.discussions || [])
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to fetch discussions:', error)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false)
      }
    }
  }, [problemSlug, sort, search])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDiscussions()
    }, 400)
    return () => clearTimeout(timer)
  }, [fetchDiscussions])

  const handlePostComment = async (title, content) => {
    if (!content.trim() || !user) {
      if (!user) alert("Please sign in to perform this action")
      return false
    }
    setSubmitting(true)

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`
    const tempComment = {
      id: tempId,
      title,
      content,
      userId: user.userId,
      user: { username: user.username, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false,
      _count: { replies: 0 }
    }
    setDiscussions(prev => [tempComment, ...prev])

    try {
      const res = await fetch(`/api/problems/${problemSlug}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      })
      if (res.ok) {
        const data = await res.json()
        setDiscussions(prev => prev.map(d => d.id === tempId ? data.discussion : d))
        return true
      } else {
        // Revert optimistic update
        setDiscussions(prev => prev.filter(d => d.id !== tempId))
        return false
      }
    } catch (error) {
      console.error('Failed to post comment', error)
      setDiscussions(prev => prev.filter(d => d.id !== tempId))
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const handlePostReply = async (parentId, content) => {
    if (!content.trim() || !user) {
      if (!user) alert("Please sign in to perform this action")
      return false
    }
    
    // Optimistic UI update
    const tempId = `temp-reply-${Date.now()}`
    const tempReply = {
      id: tempId,
      content,
      userId: user.userId,
      user: { username: user.username, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      upvotes: 0,
      hasUpvoted: false
    }

    setRepliesData(prev => ({
      ...prev,
      [parentId]: [...(prev[parentId] || []), tempReply]
    }))
    setDiscussions(prev => prev.map(d => 
      d.id === parentId 
        ? { ...d, _count: { ...d._count, replies: (d._count?.replies || 0) + 1 } }
        : d
    ))
    setReplyingTo(null)
    // ensure expanded
    setExpandedReplies(prev => ({ ...prev, [parentId]: true }))

    try {
      const res = await fetch(`/api/discussions/${parentId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (res.ok) {
        const data = await res.json()
        setRepliesData(prev => ({
          ...prev,
          [parentId]: prev[parentId].map(r => r.id === tempId ? data.reply : r)
        }))
        return true
      } else {
        // Revert
        setRepliesData(prev => ({
          ...prev,
          [parentId]: prev[parentId].filter(r => r.id !== tempId)
        }))
        setDiscussions(prev => prev.map(d => 
          d.id === parentId 
            ? { ...d, _count: { ...d._count, replies: Math.max(0, (d._count?.replies || 0) - 1) } }
            : d
        ))
        return false
      }
    } catch (error) {
      console.error('Failed to post reply', error)
      setRepliesData(prev => ({
        ...prev,
        [parentId]: prev[parentId].filter(r => r.id !== tempId)
      }))
      setDiscussions(prev => prev.map(d => 
        d.id === parentId 
          ? { ...d, _count: { ...d._count, replies: Math.max(0, (d._count?.replies || 0) - 1) } }
          : d
      ))
      return false
    }
  }

  const handleUpvote = useCallback(async (id, isReply = false, parentId = null) => {
    if (!user) {
      alert("Please sign in to upvote")
      return
    }
    
    let revertAction = null

    // Optimistic UI update
    if (isReply) {
      setRepliesData(prev => {
        const reply = prev[parentId]?.find(r => r.id === id)
        if (reply) {
          revertAction = { isReply: true, id, parentId, hasUpvoted: reply.hasUpvoted }
        }
        return {
          ...prev,
          [parentId]: prev[parentId]?.map(r => {
            if (r.id === id) {
              const increment = r.hasUpvoted ? -1 : 1
              return { ...r, upvotes: r.upvotes + increment, hasUpvoted: !r.hasUpvoted }
            }
            return r
          }) || []
        }
      })
    } else {
      setDiscussions(prev => {
        const discussion = prev.find(d => d.id === id)
        if (discussion) {
          revertAction = { isReply: false, id, hasUpvoted: discussion.hasUpvoted }
        }
        return prev.map(d => {
          if (d.id === id) {
            const increment = d.hasUpvoted ? -1 : 1
            return { ...d, upvotes: d.upvotes + increment, hasUpvoted: !d.hasUpvoted }
          }
          return d
        })
      })
    }
    
    try {
      const res = await fetch(`/api/discussions/${id}/upvote`, { method: 'PATCH' })
      if (!res.ok && revertAction) {
        // Revert on failure
        if (revertAction.isReply) {
          setRepliesData(prev => ({
            ...prev,
            [revertAction.parentId]: prev[revertAction.parentId]?.map(r => {
              if (r.id === revertAction.id) {
                const increment = revertAction.hasUpvoted ? 1 : -1
                return { ...r, upvotes: r.upvotes + increment, hasUpvoted: revertAction.hasUpvoted }
              }
              return r
            }) || []
          }))
        } else {
          setDiscussions(prev => prev.map(d => {
            if (d.id === revertAction.id) {
              const increment = revertAction.hasUpvoted ? 1 : -1
              return { ...d, upvotes: d.upvotes + increment, hasUpvoted: revertAction.hasUpvoted }
            }
            return d
          }))
        }
      }
    } catch (error) {
      console.error('Failed to upvote', error)
      // Same revert logic
      if (revertAction) {
        if (revertAction.isReply) {
          setRepliesData(prev => ({
            ...prev,
            [revertAction.parentId]: prev[revertAction.parentId]?.map(r => {
              if (r.id === revertAction.id) {
                const increment = revertAction.hasUpvoted ? 1 : -1
                return { ...r, upvotes: r.upvotes + increment, hasUpvoted: revertAction.hasUpvoted }
              }
              return r
            }) || []
          }))
        } else {
          setDiscussions(prev => prev.map(d => {
            if (d.id === revertAction.id) {
              const increment = revertAction.hasUpvoted ? 1 : -1
              return { ...d, upvotes: d.upvotes + increment, hasUpvoted: revertAction.hasUpvoted }
            }
            return d
          }))
        }
      }
    }
  }, [user])

  const toggleReplies = useCallback(async (discussionId) => {
    const isExpanded = expandedReplies[discussionId]
    setExpandedReplies(prev => ({ ...prev, [discussionId]: !isExpanded }))

    if (!isExpanded && !repliesData[discussionId]) {
      try {
        const res = await fetch(`/api/discussions/${discussionId}/replies`)
        if (res.ok) {
          const data = await res.json()
          setRepliesData(prev => ({ ...prev, [discussionId]: data.replies }))
        }
      } catch (error) {
        console.error('Failed to load replies', error)
      }
    }
  }, [expandedReplies, repliesData])

  const handleSaveEdit = useCallback(async (id, isReply, parentId, title, content) => {
    // Optimistic update
    let originalPost = null
    
    if (isReply) {
      const reply = repliesData[parentId]?.find(r => r.id === id)
      if (reply) {
        originalPost = { ...reply }
        setRepliesData(prev => ({
          ...prev,
          [parentId]: prev[parentId].map(r => r.id === id ? { ...r, title, content, updatedAt: new Date().toISOString() } : r)
        }))
      }
    } else {
      const discussion = discussions.find(d => d.id === id)
      if (discussion) {
        originalPost = { ...discussion }
        setDiscussions(prev => prev.map(d => d.id === id ? { ...d, title, content, updatedAt: new Date().toISOString() } : d))
      }
    }

    try {
      const res = await fetch(`/api/discussions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      })
      if (res.ok) {
        const data = await res.json()
        if (isReply) {
          setRepliesData(prev => ({
            ...prev,
            [parentId]: prev[parentId].map(r => r.id === id ? data.discussion : r)
          }))
        } else {
          setDiscussions(prev => prev.map(d => d.id === id ? data.discussion : d))
        }
        return true
      } else {
        // Revert
        if (originalPost) {
          if (isReply) {
            setRepliesData(prev => ({
              ...prev,
              [parentId]: prev[parentId].map(r => r.id === id ? originalPost : r)
            }))
          } else {
            setDiscussions(prev => prev.map(d => d.id === id ? originalPost : d))
          }
        }
        return false
      }
    } catch (err) {
      console.error('Failed to edit post', err)
      if (originalPost) {
        if (isReply) {
          setRepliesData(prev => ({
            ...prev,
            [parentId]: prev[parentId].map(r => r.id === id ? originalPost : r)
          }))
        } else {
          setDiscussions(prev => prev.map(d => d.id === id ? originalPost : d))
        }
      }
      return false
    }
  }, [discussions, repliesData])

  const handleDelete = useCallback(async (id, isReply, parentId) => {
    if (!confirm('Are you sure you want to delete this post?')) return false

    // Save originals for revert
    let originalDiscussion = null
    let originalReplies = null

    if (isReply) {
      originalReplies = repliesData[parentId]
      setRepliesData(prev => ({
        ...prev,
        [parentId]: prev[parentId]?.filter(r => r.id !== id) || []
      }))
      setDiscussions(prev => prev.map(d => 
        d.id === parentId 
          ? { ...d, _count: { ...d._count, replies: Math.max(0, (d._count?.replies || 0) - 1) } }
          : d
      ))
    } else {
      originalDiscussion = discussions.find(d => d.id === id)
      setDiscussions(prev => prev.filter(d => d.id !== id))
    }

    try {
      const res = await fetch(`/api/discussions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        return true
      } else {
        // Revert
        if (isReply && originalReplies) {
          setRepliesData(prev => ({ ...prev, [parentId]: originalReplies }))
          setDiscussions(prev => prev.map(d => 
            d.id === parentId 
              ? { ...d, _count: { ...d._count, replies: (d._count?.replies || 0) + 1 } }
              : d
          ))
        } else if (!isReply && originalDiscussion) {
          setDiscussions(prev => [originalDiscussion, ...prev])
        }
        return false
      }
    } catch (err) {
      console.error('Failed to delete post', err)
      if (isReply && originalReplies) {
        setRepliesData(prev => ({ ...prev, [parentId]: originalReplies }))
        setDiscussions(prev => prev.map(d => 
          d.id === parentId 
            ? { ...d, _count: { ...d._count, replies: (d._count?.replies || 0) + 1 } }
            : d
        ))
      } else if (!isReply && originalDiscussion) {
        setDiscussions(prev => [originalDiscussion, ...prev])
      }
      return false
    }
  }, [discussions, repliesData])

  return {
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
  }
}
