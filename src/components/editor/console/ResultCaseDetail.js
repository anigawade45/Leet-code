import { renderInput } from '@/utils/consoleUtils'

export function ResultCaseDetail({ currentCase, problem }) {
  if (!currentCase) return null

  return (
    <div className="space-y-3 text-xs select-text">
      <div className="space-y-2">
        <p className="text-muted-foreground text-[12px] font-semibold font-sans">Input</p>
        {renderInput(currentCase.input, problem)}
      </div>

      {currentCase.stdout && (
        <div className="space-y-2 pt-2">
          <p className="text-[#2a9d8f] text-[12px] font-semibold font-sans">Stdout</p>
          <pre className="p-3.5 bg-[#2a9d8f]/5 border border-[#2a9d8f]/20 rounded-lg text-[#2a9d8f] whitespace-pre-wrap font-mono text-[13px]">
            {currentCase.stdout}
          </pre>
        </div>
      )}

      {currentCase.error ? (
        <div className="space-y-2 pt-2">
          <p className="text-[#ef4444] text-[12px] font-semibold font-sans">Runtime Error</p>
          <pre className="p-3.5 bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] rounded-lg whitespace-pre-wrap font-mono text-[13px]">
            {currentCase.error}
          </pre>
        </div>
      ) : (
        <>
          <div className="space-y-2 pt-2">
            <p className="text-muted-foreground text-[12px] font-semibold font-sans">Output</p>
            <pre className={`p-3.5 bg-card border border-border/20 rounded-lg whitespace-pre-wrap font-mono font-bold text-[13px] ${
              currentCase.passed ? 'text-white' : 'text-[#ef4444]'
            }`}>
              {currentCase.actual ?? 'null'}
            </pre>
          </div>
          {currentCase.expected && (
            <div className="space-y-2 pt-2">
              <p className="text-muted-foreground text-[12px] font-semibold font-sans">Expected</p>
              <pre className="p-3.5 bg-card border border-border/20 rounded-lg text-white font-bold whitespace-pre-wrap font-mono text-[13px]">
                {currentCase.expected}
              </pre>
            </div>
          )}
        </>
      )}
      {currentCase.time != null && (
        <p className="text-muted-foreground text-[10px]">Runtime: {currentCase.time} ms</p>
      )}
    </div>
  )
}
