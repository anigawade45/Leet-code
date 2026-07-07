'use client'

import { useState, useEffect, useMemo } from 'react'
import { ConsoleHeader } from './console/ConsoleHeader'
import { ConsoleFooter } from './console/ConsoleFooter'
import { LoadingSkeleton } from './console/LoadingSkeleton'
import { ResultSummary } from './console/ResultSummary'
import { ResultCaseTabs } from './console/ResultCaseTabs'
import { ResultCaseDetail } from './console/ResultCaseDetail'
import { TestcaseEditor } from './console/TestcaseEditor'
import { HiddenTestCaseCard } from './console/HiddenTestCaseCard'

export function ConsolePanel({
  testCases = [],
  results = null,
  running = false,
  error = null,
  consoleOpen = true,
  setConsoleOpen = () => { },
  consoleMaximized = false,
  setConsoleMaximized = () => { },
  problem = null,
  rawTestCasesText = '',
  setRawTestCasesText = () => { },
  isSubmitMode = false,
  hiddenFailedCase = null,
  submissionResults = null,
  submissionResultsLoading = false,
}) {
  const [activeConsoleTab, setActiveConsoleTab] = useState('testcase')
  const [activeCaseIdx, setActiveCaseIdx] = useState(0)

  // Auto-switch to result tab + open console when running or results arrive
  useEffect(() => {
    if (running || submissionResultsLoading || results || submissionResults) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveConsoleTab('result')
      if (!running && !submissionResultsLoading) {
        setActiveCaseIdx(0)
      }
      setConsoleOpen(true)
    }
  }, [running, submissionResultsLoading, results, submissionResults, setConsoleOpen])

  // Memoize derived values
  const visibleResults = useMemo(() => {
    return results
      ? (isSubmitMode ? results.filter(r => !r.isHidden) : results)
      : null
  }, [results, isSubmitMode])

  const displayCases = useMemo(() => {
    return visibleResults || testCases
  }, [visibleResults, testCases])

  const currentCase = useMemo(() => {
    return displayCases[activeCaseIdx] || displayCases[0]
  }, [displayCases, activeCaseIdx])

  const isLoading = running || submissionResultsLoading

  return (
    <div className="flex flex-col h-full bg-background border-0 text-muted-foreground overflow-hidden select-none">
      <ConsoleHeader
        consoleOpen={consoleOpen}
        setConsoleOpen={setConsoleOpen}
        activeConsoleTab={activeConsoleTab}
        setActiveConsoleTab={setActiveConsoleTab}
        running={running}
        submissionResultsLoading={submissionResultsLoading}
        consoleMaximized={consoleMaximized}
        setConsoleMaximized={setConsoleMaximized}
      />

      {consoleOpen && (
        <div className="flex-1 p-4 overflow-y-auto min-h-0 bg-background">
          {error && (
            <div className="p-4 rounded-lg bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] font-mono text-xs select-text mb-4">
              {error}
            </div>
          )}

          {activeConsoleTab === 'testcase' && (
            <TestcaseEditor
              rawTestCasesText={rawTestCasesText}
              setRawTestCasesText={setRawTestCasesText}
              running={isLoading}
            />
          )}

          {activeConsoleTab === 'result' && (
            <div>
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  {/* Submission detail results */}
                  {submissionResults ? (
                    <div className="space-y-4">
                      <ResultSummary results={submissionResults} />
                      <ResultCaseTabs
                        results={submissionResults}
                        activeCaseIdx={activeCaseIdx}
                        setActiveCaseIdx={setActiveCaseIdx}
                      />
                      <ResultCaseDetail
                        currentCase={submissionResults[activeCaseIdx] || submissionResults[0]}
                        problem={problem}
                      />
                    </div>
                  ) : (
                    /* Normal run / submit results */
                    !results ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <span className="text-2xl mb-1.5">⚡</span>
                        <p className="font-semibold text-xs">No run results yet</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">Click &quot;Run Code&quot; or &quot;Submit&quot; to compile and run.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <ResultSummary results={results} />

                        {isSubmitMode && hiddenFailedCase && (
                          <HiddenTestCaseCard
                            hiddenFailedCase={hiddenFailedCase}
                            problem={problem}
                          />
                        )}

                        <ResultCaseTabs
                          results={visibleResults}
                          activeCaseIdx={activeCaseIdx}
                          setActiveCaseIdx={setActiveCaseIdx}
                        />

                        {currentCase && (
                          <ResultCaseDetail
                            currentCase={currentCase}
                            problem={problem}
                          />
                        )}
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {consoleOpen && (
        <ConsoleFooter testCasesLength={testCases.length} />
      )}
    </div>
  )
}
