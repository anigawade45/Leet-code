export function Pagination({ page, setPage, pagination }) {
  if (!pagination || pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between p-4 border-t border-border/30 mt-4">
      <div className="text-sm text-muted-foreground">
        Showing {(page - 1) * pagination.limit + 1} to {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={!pagination.hasPrevious}
          className="px-3 py-1.5 rounded-md bg-card text-white hover:bg-[#323232] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          aria-label="Previous Page"
        >
          Previous
        </button>
        <span className="text-sm text-white px-2">Page {page} of {pagination.totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={!pagination.hasNext}
          className="px-3 py-1.5 rounded-md bg-card text-white hover:bg-[#323232] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          aria-label="Next Page"
        >
          Next
        </button>
      </div>
    </div>
  )
}
