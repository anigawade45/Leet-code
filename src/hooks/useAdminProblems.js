import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useDebounce } from './useDebounce'

export function useAdminProblems(initialData = null) {
  const [problems, setProblems] = useState(
    initialData && initialData.data ? initialData.data : (Array.isArray(initialData) ? initialData : [])
  )
  const [pagination, setPagination] = useState(
    initialData && initialData.pagination ? initialData.pagination : { page: 1, limit: 50, totalPages: 1 }
  )
  const [loading, setLoading] = useState(!initialData || (Array.isArray(initialData) && initialData.length === 0))
  
  // Filter States
  const [status, setStatus] = useState(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)

  const fetchProblems = useCallback(async (currentFilters = {}) => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (currentFilters.status) queryParams.set('status', currentFilters.status)
      if (currentFilters.search) queryParams.set('search', currentFilters.search)
      if (currentFilters.sortBy) queryParams.set('sortBy', currentFilters.sortBy)
      if (currentFilters.sortOrder) queryParams.set('sortOrder', currentFilters.sortOrder)
      if (currentFilters.page) queryParams.set('page', currentFilters.page)
      
      const response = await fetch(`/api/admin/problems?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (data.problems?.data) {
          setProblems(data.problems.data)
          setPagination(data.problems.pagination)
        } else if (Array.isArray(data.problems)) {
          setProblems(data.problems)
        }
      } else {
        toast.error('Failed to fetch problems')
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error)
      toast.error('An error occurred while fetching problems')
    } finally {
      setLoading(false)
    }
  }, [])

  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (initialData && (initialData.data || initialData.length > 0)) return
    }
    
    fetchProblems({ status, search: debouncedSearch, sortBy, sortOrder, page })
    
  }, [status, debouncedSearch, sortBy, sortOrder, page, fetchProblems, initialData])

  const approveProblem = async (id, title) => {
    // Optimistic Update
    setProblems(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p))
    try {
      const res = await fetch(`/api/admin/problems/${id}/approve`, { method: 'PATCH' })
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to approve')
      }
      toast.success(`"${title}" has been approved`)
    } catch (error) {
      toast.error(error.message)
      // Rollback
      fetchProblems({ status, search, sortBy, sortOrder, page })
    }
  }

  const rejectProblem = async (id, title) => {
    // Optimistic Update
    setProblems(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p))
    try {
      const res = await fetch(`/api/admin/problems/${id}/reject`, { method: 'PATCH' })
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to reject')
      }
      toast.warning(`"${title}" has been rejected`)
    } catch (error) {
      toast.error(error.message)
      // Rollback
      fetchProblems({ status, search, sortBy, sortOrder, page })
    }
  }

  const deleteProblem = async (id, slug, title) => {
    // Optimistic Update
    setProblems(prev => prev.filter(p => p.id !== id))
    try {
      const res = await fetch(`/api/problems/${slug}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to delete')
      }
      toast.warning(`"${title}" has been deleted`)
    } catch (error) {
      toast.error(error.message)
      // Rollback
      fetchProblems({ status, search, sortBy, sortOrder, page })
    }
  }

  // Bulk Actions using Promise.all
  const bulkApprove = async (ids) => {
    setProblems(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'APPROVED' } : p))
    try {
      await Promise.all(ids.map(id => fetch(`/api/admin/problems/${id}/approve`, { method: 'PATCH' })))
      toast.success(`${ids.length} problems approved`)
    } catch (error) {
      toast.error('Bulk approve failed')
      fetchProblems({ status, search, sortBy, sortOrder, page })
    }
  }

  const bulkReject = async (ids) => {
    setProblems(prev => prev.map(p => ids.includes(p.id) ? { ...p, status: 'REJECTED' } : p))
    try {
      await Promise.all(ids.map(id => fetch(`/api/admin/problems/${id}/reject`, { method: 'PATCH' })))
      toast.warning(`${ids.length} problems rejected`)
    } catch (error) {
      toast.error('Bulk reject failed')
      fetchProblems({ status, search, sortBy, sortOrder, page })
    }
  }

  const bulkDelete = async (problemsToDelete) => {
    const ids = problemsToDelete.map(p => p.id)
    setProblems(prev => prev.filter(p => !ids.includes(p.id)))
    try {
      await Promise.all(problemsToDelete.map(p => fetch(`/api/problems/${p.slug}`, { method: 'DELETE' })))
      toast.warning(`${ids.length} problems deleted`)
    } catch (error) {
      toast.error('Bulk delete failed')
      fetchProblems({ status, search, sortBy, sortOrder, page })
    }
  }

  return {
    problems,
    pagination,
    loading,
    status, setStatus,
    search, setSearch,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    page, setPage,
    approveProblem,
    rejectProblem,
    deleteProblem,
    bulkApprove,
    bulkReject,
    bulkDelete,
    refresh: () => fetchProblems({ status, search, sortBy, sortOrder, page })
  }
}
