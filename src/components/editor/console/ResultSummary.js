export function ResultSummary({ results }) {
  if (!results || results.length === 0) return null

  const allPassed = results.every(r => r.passed)
  const hasError = results.some(r => r.error)

  const statusColor = allPassed ? 'text-[#2cbb78]' : hasError ? 'text-[#f43f5e]' : 'text-[#ef4444]'
  const statusText = allPassed ? 'Accepted' : hasError ? 'Runtime Error' : 'Wrong Answer'

  const times = results.map(r => r.time).filter(t => t !== undefined && t !== null)
  let runtimeText = '0 ms'
  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length
    runtimeText = avg >= 1 ? `${Math.round(avg)} ms` : `${avg.toFixed(2)} ms`
  }

  return (
    <div className="flex items-baseline gap-3 font-sans mt-2 mb-4">
      <span className={`text-2xl font-bold ${statusColor}`}>
        {statusText}
      </span>
      <span className="text-[13px] text-muted-foreground font-semibold">
        Runtime: {runtimeText}
      </span>
    </div>
  )
}
