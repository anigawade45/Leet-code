export function FeedSkeleton() {
  return (
    <div className="flex flex-col">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-4 py-6 border-b border-border px-2">
          <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0 w-full space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse rounded" />
              <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
