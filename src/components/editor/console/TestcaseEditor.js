export function TestcaseEditor({ rawTestCasesText, setRawTestCasesText, running }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-sans">Testcase</label>
      <textarea
        value={rawTestCasesText}
        onChange={(e) => setRawTestCasesText(e.target.value)}
        disabled={running}
        className="w-full h-44 p-4 bg-[#1e1e1e]/60 border border-border rounded-lg text-white font-mono text-xs focus:outline-none focus:border-[#00b8a3] focus:ring-1 focus:ring-[#00b8a3] resize-none overflow-y-auto leading-relaxed select-text disabled:opacity-50"
        placeholder="Enter test cases..."
      />
    </div>
  )
}
