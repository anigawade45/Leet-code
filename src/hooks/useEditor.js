import { useState } from 'react'
import { toast } from 'sonner'

export function useEditor(initialProblem, problem, user, submissions, setSubmissions, setSubmissionTestResults) {
  // Editor State
  const [editorCodes, setEditorCodes] = useState(() => {
    if (!initialProblem) return {}
    let sc = initialProblem.starterCode
    if (typeof initialProblem.starterCode === 'string') {
      try {
        sc = JSON.parse(initialProblem.starterCode)
      } catch (e) {
        sc = {}
      }
    }
    return sc || {}
  })

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (!initialProblem) return ''
    let sc = initialProblem.starterCode
    if (typeof initialProblem.starterCode === 'string') {
      try {
        sc = JSON.parse(initialProblem.starterCode)
      } catch (e) {
        sc = {}
      }
    }
    const availableLangs = Object.keys(sc || {})
    return availableLangs.length > 0 ? availableLangs[0] : ''
  })

  const availableLanguages = Object.keys(editorCodes || {})

  // Console State
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [consoleError, setConsoleError] = useState(null)
  const [consoleMaximized, setConsoleMaximized] = useState(false)
  const [isEditorFolded, setIsEditorFolded] = useState(false)
  const [isSubmitMode, setIsSubmitMode] = useState(false)
  const [hiddenFailedCase, setHiddenFailedCase] = useState(null)

  const [customTestCases, setCustomTestCases] = useState(() => {
    if (!initialProblem || !initialProblem.testCases) return []
    const samples = initialProblem.testCases.filter(tc => !tc.isHidden).slice(0, 8)
    return samples.map((tc, idx) => ({
      id: tc.id || `custom-${idx}`,
      input: tc.input,
      output: tc.output,
      expected: tc.output
    }))
  })

  const [rawTestCasesText, setRawTestCasesText] = useState(() => {
    if (!initialProblem || !initialProblem.testCases) return ''
    const samples = initialProblem.testCases.filter(tc => !tc.isHidden).slice(0, 8)
    return samples.map(tc => tc.input.trim()).join('\n')
  })

  const handleResetCode = () => {
    if (!initialProblem) return
    const sc = typeof initialProblem.starterCode === 'string'
      ? JSON.parse(initialProblem.starterCode)
      : initialProblem.starterCode
    if (sc && sc[selectedLanguage]) {
      setEditorCodes(prev => ({ ...prev, [selectedLanguage]: sc[selectedLanguage] }))
      toast.success('Code reset to default')
    }
  }

  const handleRetrieveCode = () => {
    const lastSub = submissions.find(s => s.language === selectedLanguage)
    if (lastSub && lastSub.code) {
      setEditorCodes(prev => ({ ...prev, [selectedLanguage]: lastSub.code }))
      toast.success('Restored last submitted code')
    } else {
      toast.error('No previous submission found for this language')
    }
  }

  const handleRestoreCode = (e, code, lang) => {
    e.stopPropagation()
    setSelectedLanguage(lang)
    setEditorCodes(prev => ({ ...prev, [lang]: code }))
    toast.success('Code restored')
  }

  const handleRunCode = async () => {
    if (!user) {
      toast.error('You must be logged in to run code')
      return
    }
    setIsRunning(true)
    setConsoleOpen(true)
    setConsoleError(null)
    setRunResults(null)
    setIsSubmitMode(false)

    let parsedCustomTestCases = customTestCases
    if (rawTestCasesText && problem?.testCases?.length > 0) {
      const lines = rawTestCasesText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
      const firstDbTc = problem.testCases[0]
      const paramCount = firstDbTc.input.split('\n').map(l => l.trim()).filter(l => l.length > 0).length || 1
      
      const parsed = []
      for (let i = 0; i < lines.length; i += paramCount) {
        const slice = lines.slice(i, i + paramCount)
        if (slice.length === paramCount) {
          for (let j = 0; j < slice.length; j++) {
            try {
              JSON.parse(slice[j])
            } catch (err) {
              setConsoleError(`Syntax Error in Custom Testcase:\nLine ${i + j + 1}: ${slice[j]}\n\nError: ${err.message}\nMake sure your input is valid JSON (e.g. use double quotes for strings).`)
              setIsRunning(false)
              return
            }
          }
          parsed.push({
            id: `custom-${parsed.length}`,
            input: slice.join('\n')
          })
        }
      }
      if (parsed.length > 0) {
        parsedCustomTestCases = parsed
      }
    }

    try {
      const res = await fetch(`/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          code: editorCodes[selectedLanguage],
          language: selectedLanguage,
          customTestCases: parsedCustomTestCases
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setConsoleError(data.error || data.message || 'Execution failed')
      } else {
        setRunResults(data.results || data)
      }
    } catch (e) {
      setConsoleError(e.message || 'Execution failed')
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmitCode = async () => {
    if (!user) {
      toast.error('You must be logged in to submit code')
      return
    }
    setIsSubmitting(true)
    setConsoleOpen(true)
    setConsoleError(null)
    if (setSubmissionTestResults) setSubmissionTestResults(null)
    if (setHiddenFailedCase) setHiddenFailedCase(null)
    setIsSubmitMode(true)

    try {
      const res = await fetch(`/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          code: editorCodes[selectedLanguage],
          language: selectedLanguage
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setConsoleError(data.error || data.message || 'Submission failed')
      } else {
        if (setSubmissionTestResults) setSubmissionTestResults(data.results || null)
        if (data.submission && setSubmissions) {
          setSubmissions(prev => [data.submission, ...prev])
        }
      }
    } catch (e) {
      setConsoleError(e.message || 'Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    editorCodes,
    setEditorCodes,
    selectedLanguage,
    setSelectedLanguage,
    availableLanguages,
    consoleOpen,
    setConsoleOpen,
    isRunning,
    isSubmitting,
    runResults,
    consoleError,
    consoleMaximized,
    setConsoleMaximized,
    isEditorFolded,
    setIsEditorFolded,
    isSubmitMode,
    hiddenFailedCase,
    customTestCases,
    setCustomTestCases,
    rawTestCasesText,
    setRawTestCasesText,
    handleResetCode,
    handleRetrieveCode,
    handleRestoreCode,
    handleRunCode,
    handleSubmitCode
  }
}
