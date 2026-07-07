'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAdminProblems } from '@/hooks/useAdminProblems'
import { useProblemShortcuts } from '@/hooks/useProblemShortcuts'

import { ProblemStats } from './problems/ProblemStats'
import { ProblemFilters } from './problems/ProblemFilters'
import { ProblemRow } from './problems/ProblemRow'
import { ProblemSkeleton } from './problems/ProblemSkeleton'
import { DeleteDialog } from './problems/DeleteDialog'
import { ProblemToolbar } from './problems/ProblemToolbar'
import { ErrorBoundary } from './problems/ErrorBoundary'
import { EmptyState } from './problems/EmptyState'
import { PageHeader } from './PageHeader'

export function AdminProblemTable({ initialData = null, stats = null }) {
  const {
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
    bulkDelete
  } = useAdminProblems(initialData)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, problems: [] })
  const [isDeleting, setIsDeleting] = useState(false)
  
  const selectAllRef = useRef(null)
  const searchInputRef = useRef(null)

  // Clear selection on filter/page changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [page, search, status, sortBy, sortOrder])

  // Tri-State Checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < problems.length
    }
  }, [selectedIds, problems])

  // Memoized Handlers
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === problems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(problems.map(p => p.id)))
    }
  }, [selectedIds, problems])

  const toggleSelect = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0) return
    await bulkApprove(Array.from(selectedIds))
    setSelectedIds(new Set())
  }, [selectedIds, bulkApprove])

  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0) return
    await bulkReject(Array.from(selectedIds))
    setSelectedIds(new Set())
  }, [selectedIds, bulkReject])

  const triggerBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    const problemsToDelete = problems.filter(p => selectedIds.has(p.id))
    setDeleteModal({ isOpen: true, problems: problemsToDelete })
  }, [selectedIds, problems])

  const handleDeleteConfirm = async () => {
    if (!deleteModal.problems.length) return
    setIsDeleting(true)
    
    try {
      if (deleteModal.problems.length === 1) {
        const p = deleteModal.problems[0]
        await deleteProblem(p.id, p.slug, p.title)
      } else {
        await bulkDelete(deleteModal.problems)
        setSelectedIds(new Set())
      }
    } finally {
      setIsDeleting(false)
      setDeleteModal({ isOpen: false, problems: [] })
    }
  }

  // Hook for Keyboard Shortcuts
  useProblemShortcuts({
    selectedIds,
    problems,
    searchRef: searchInputRef,
    onApprove: handleBulkApprove,
    onReject: handleBulkReject,
    onDelete: triggerBulkDelete
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6 md:p-8">
      {/* Header */}
      <PageHeader 
        title="Problem Library"
        description="Manage and moderate all problems on the platform"
        backLink={{ href: '/admin', label: 'Back to Dashboard' }}
        actionLink={{ href: '/admin/problems/create', label: 'Create Problem' }}
      />

      {/* Stats */}
      <ProblemStats stats={stats} />

      {/* Main Content Area */}
      <ErrorBoundary>
        <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden relative">
          <div className="p-6 pb-0">
            <ProblemFilters 
              status={status} setStatus={setStatus}
              search={search} setSearch={setSearch}
              sortBy={sortBy} setSortBy={setSortBy}
              sortOrder={sortOrder} setSortOrder={setSortOrder}
              searchRef={searchInputRef}
            />
          </div>

          {/* Table / Cards Area */}
          <div className="w-full overflow-x-auto min-h-[400px]">
            {loading ? (
              <ProblemSkeleton />
            ) : problems.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="min-w-[900px]">
                {/* Sticky Table Header */}
                <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-6 py-3 bg-[#2a2e35]/80 backdrop-blur border-y border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-4 flex items-center gap-4">
                    <input 
                      type="checkbox"
                      ref={selectAllRef}
                      checked={problems.length > 0 && selectedIds.size === problems.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all problems"
                      className="w-4 h-4 rounded border-border bg-card accent-primary cursor-pointer"
                    />
                    <span>Problem</span>
                  </div>
                  <div className="col-span-2">Author</div>
                  <div className="col-span-1">Difficulty</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-border">
                  {problems.map((problem) => (
                    <ProblemRow 
                      key={problem.id}
                      problem={problem}
                      isSelected={selectedIds.has(problem.id)}
                      onToggleSelect={toggleSelect}
                      onApprove={approveProblem}
                      onReject={rejectProblem}
                      onDelete={(p) => setDeleteModal({ isOpen: true, problems: [p] })}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <ProblemToolbar 
            selectedCount={selectedIds.size}
            pagination={pagination}
            setPage={setPage}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
            onBulkDelete={triggerBulkDelete}
          />
        </div>
      </ErrorBoundary>

      <DeleteDialog 
        isOpen={deleteModal.isOpen} 
        problems={deleteModal.problems} 
        onClose={() => setDeleteModal({ isOpen: false, problems: [] })} 
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  )
}
