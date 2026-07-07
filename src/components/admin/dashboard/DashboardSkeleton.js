export function DashboardSkeleton() {
  return (
    <div className="flex-1 bg-background min-h-screen p-8 text-white space-y-8">
      <div className="h-16 bg-card animate-pulse rounded-xl border border-border"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-card animate-pulse rounded-xl border border-border"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-card animate-pulse rounded-xl border border-border"></div>
        <div className="h-80 bg-card animate-pulse rounded-xl border border-border"></div>
      </div>
    </div>
  )
}
