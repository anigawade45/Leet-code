import { Code, HelpCircle } from 'lucide-react'

export function ConsoleFooter({ testCasesLength }) {
  return (
    <div className="h-10 min-h-[40px] border-t border-border bg-background flex justify-between items-center px-4 text-xs text-muted-foreground select-none z-10">
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1 px-2.5 py-1 bg-card hover:bg-[#333333] border border-border/10 rounded-lg text-white font-semibold transition-colors">
          <Code size={11} className="text-muted-foreground" />
          <span>Source</span>
        </button>
        <HelpCircle size={13} className="text-muted-foreground cursor-pointer hover:text-white transition-colors" />
      </div>
      <div className="font-mono text-[10px] text-muted-foreground/70">
        {testCasesLength}/{testCasesLength} testcases | Line 2 | Case 1: target
      </div>
    </div>
  )
}
