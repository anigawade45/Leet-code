import { useState, useEffect, useCallback } from 'react'

export function useAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentPending, setRecentPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async (signal) => {
    try {
      setIsRefreshing(true)
      setError(null)
      
      const response = await fetch('/api/admin/dashboard', { signal })
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setRecentPending(data.recentPending || [])
      } else {
        throw new Error(data.message || 'Unknown error occurred')
      }
      setLastUpdated(new Date())
    } catch (err) {
      if (err.name === 'AbortError') {
        return // AbortError is expected — no need to log
      }
      console.error('Dashboard fetch error:', err)
      setError(err.message)
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)

    const interval = setInterval(() => {
      fetchData(controller.signal)
    }, 30000)

    return () => {
      clearInterval(interval)
      controller.abort()
    }
  }, [fetchData])

  const refresh = useCallback(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
  }, [fetchData])

  return {
    stats,
    recentPending,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    refresh
  }
}
