export function TableSkeleton({ rows = 10 }) {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center px-4 py-4 group bg-card animate-pulse rounded">
          <div className="w-8 flex-shrink-0">
            <div className="w-4 h-4 bg-muted rounded-full" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 bg-muted w-1/3 rounded" />
            <div className="flex gap-2">
              <div className="h-3 bg-muted w-12 rounded-full" />
              <div className="h-3 bg-muted w-16 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-4 bg-muted w-10 rounded" />
            <div className="h-4 bg-muted w-10 rounded" />
            <div className="w-16 flex justify-end">
              <div className="h-4 bg-muted w-4 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
