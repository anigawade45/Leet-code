export function ProblemSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-border">
          <div className="col-span-4 flex items-center gap-4">
            <div className="w-4 h-4 rounded bg-[#2a2e35]"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-[#2a2e35] rounded w-3/4"></div>
              <div className="h-3 bg-[#2a2e35] rounded w-1/2"></div>
            </div>
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-[#2a2e35] rounded w-16"></div>
          </div>
          <div className="col-span-1">
            <div className="h-6 bg-[#2a2e35] rounded-full w-16"></div>
          </div>
          <div className="col-span-1">
            <div className="h-4 bg-[#2a2e35] rounded w-16"></div>
          </div>
          <div className="col-span-2">
            <div className="h-3 bg-[#2a2e35] rounded w-20"></div>
          </div>
          <div className="col-span-2 flex justify-end gap-2">
            <div className="w-7 h-7 bg-[#2a2e35] rounded-md"></div>
            <div className="w-7 h-7 bg-[#2a2e35] rounded-md"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
