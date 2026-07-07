export function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse pt-2">
      <div className="h-6 bg-card rounded-md w-48"></div>
      <div className="flex gap-2 border-b border-border pb-4">
        <div className="h-7 bg-card rounded-lg w-16"></div>
        <div className="h-7 bg-card rounded-lg w-16"></div>
        <div className="h-7 bg-card rounded-lg w-16"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-card rounded w-16"></div>
        <div className="h-12 bg-card rounded-lg w-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-card rounded w-16"></div>
        <div className="h-12 bg-card rounded-lg w-full"></div>
      </div>
    </div>
  )
}
