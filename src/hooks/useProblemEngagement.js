import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export function useProblemEngagement(problem, user) {
  const [engagement, _setEngagement] = useState({
    likes: 0,
    dislikes: 0,
    currentSolving: 0,
    userReaction: null,
  })
  
  const engagementRef = useRef(engagement)
  
  const setEngagement = useCallback((val) => {
    if (typeof val === 'function') {
      _setEngagement(prev => {
        const next = val(prev)
        engagementRef.current = next
        return next
      })
    } else {
      engagementRef.current = val
      _setEngagement(val)
    }
  }, [])
  
  const [isReacting, setIsReacting] = useState(false)

  // Fetch initial engagement state
  useEffect(() => {
    if (!problem) return
    const fetchEngagement = async () => {
      try {
        const res = await fetch(`/api/problems/${problem.slug}/engagement`)
        if (res.ok) {
          const data = await res.json()
          setEngagement({
            likes: data.likes || 0,
            dislikes: data.dislikes || 0,
            currentSolving: data.currentSolving || 0,
            userReaction: data.userReaction || null
          })
        }
      } catch (err) {
        console.error('Failed to fetch engagement:', err)
      }
    }
    fetchEngagement()
  }, [problem, setEngagement])

  const sessionIdRef = useRef(Math.random().toString(36).substring(2, 15))

  // Heartbeat to update presence and get latest currentSolving count
  useEffect(() => {
    if (!problem || !user) return

    const touchPresence = async () => {
      try {
        const res = await fetch(`/api/problems/${problem.slug}/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionIdRef.current })
        })
        if (res.ok) {
          const data = await res.json()
          setEngagement(prev => ({
            ...prev,
            currentSolving: data.currentSolving || 0
          }))
        }
      } catch (err) {
        // Silently ignore heartbeat errors
      }
    }

    touchPresence()
    const interval = setInterval(touchPresence, 30000) // ping every 30s
    return () => clearInterval(interval)
  }, [problem, user, setEngagement])


  const handleReaction = async (type) => {
    if (!user) {
      toast.error('You must be logged in to vote')
      return
    }
    setIsReacting(true)
    try {
      const res = await fetch(`/api/problems/${problem.slug}/engagement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      if (res.ok) {
        const data = await res.json()
        setEngagement(prev => ({
          ...prev,
          likes: data.likes,
          dislikes: data.dislikes,
          userReaction: data.userReaction
        }))
      }
    } catch (e) {
      toast.error('Failed to react')
    } finally {
      setIsReacting(false)
    }
  }

  return {
    engagement,
    setEngagement,
    isReacting,
    handleReaction
  }
}
