import { renderInput } from '@/utils/consoleUtils'

export function HiddenTestCaseCard({ hiddenFailedCase, problem }) {
  if (!hiddenFailedCase) return null

  return (
    <div className="p-3 rounded-lg bg-[#f59e0b]/8 border border-[#f59e0b]/25 space-y-3">
      <div className="flex items-center gap-1.5 text-[#f59e0b] text-xs font-bold">
        <span>🔒</span>
        <span>Failed on a Hidden Test Case</span>
      </div>
      <div className="space-y-2 text-xs select-text">
        <div className="space-y-1">
          <p className="text-muted-foreground text-[11px]">Input</p>
          {renderInput(hiddenFailedCase.input, problem)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px]">Your Output</p>
            <pre className="p-2 bg-[#ef4444]/8 border border-[#ef4444]/20 rounded text-[#ef4444] whitespace-pre-wrap font-mono">
              {hiddenFailedCase.actual ?? 'null'}
            </pre>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px]">Expected</p>
            <pre className="p-2 bg-[#34d399]/8 border border-[#34d399]/20 rounded text-[#34d399] whitespace-pre-wrap font-mono">
              {hiddenFailedCase.expected}
            </pre>
          </div>
        </div>
        {hiddenFailedCase.error && (
          <div className="space-y-1">
            <p className="text-[#ef4444] text-[11px]">Error</p>
            <pre className="p-2 bg-[#ef4444]/8 border border-[#ef4444]/20 rounded text-[#ef4444] whitespace-pre-wrap font-mono">
              {hiddenFailedCase.error}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
