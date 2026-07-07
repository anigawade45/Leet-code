export function ResultCaseTabs({ results, activeCaseIdx, setActiveCaseIdx }) {
  if (!results || results.length === 0) return null

  return (
    <div className="flex gap-2 flex-wrap border-b border-border pb-4">
      {results.map((res, idx) => (
        <button
          key={idx}
          onClick={() => setActiveCaseIdx(idx)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all cursor-pointer ${
            activeCaseIdx === idx ? 'bg-[#333333] text-white' : 'bg-transparent text-muted-foreground hover:text-white hover:bg-[#333333]/50'
          }`}
        >
          <div className={`w-3.5 h-3.5 flex items-center justify-center rounded-[3px] text-[10px] font-extrabold ${
            res.passed ? 'bg-[#2cbb78] text-[#1a1a1a]' : 'bg-[#ef4444] text-white'
          }`}>
            {res.passed ? '✓' : '✗'}
          </div>
          Case {idx + 1}
        </button>
      ))}
    </div>
  )
}
