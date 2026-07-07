import React, { useMemo, useEffect, useState, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'

const LANGUAGE_MAP = {
  nodejs: 'javascript',
  js: 'javascript',
  python3: 'python',
  py: 'python',
  cpp: 'cpp',
  'c++': 'cpp',
  ts: 'typescript',
  golang: 'go',
  java: 'java',
  rust: 'rust',
  ruby: 'ruby',
  csharp: 'csharp',
  'c#': 'csharp',
  php: 'php',
  swift: 'swift',
}

export function CodeEditor({
  languages = [],
  selectedLanguage,
  onLanguageChange,
  code,
  onChange,
  onReset,
  onRun,
  hideHeader = false,
  readOnly = false,
  problemId = 'default'
}) {
  const [isEditorLoaded, setIsEditorLoaded] = useState(false)
  const editorRef = useRef(null)
  const cursorStates = useRef({})
  const { resolvedTheme } = useTheme()

  const monacoLanguage = useMemo(() => {
    if (!selectedLanguage) return 'javascript'
    const l = selectedLanguage.toLowerCase()
    return LANGUAGE_MAP[l] || l
  }, [selectedLanguage])

  // Autosave Background Save
  useEffect(() => {
    if (!code || readOnly) return
    const timer = setTimeout(() => {
      localStorage.setItem(`editor-autosave-${problemId}-${selectedLanguage}`, code)
    }, 2000)
    return () => clearTimeout(timer)
  }, [code, selectedLanguage, problemId, readOnly])

  const onCodeChange = (value) => {
    if (onChange) {
      onChange(value)
    }
  }

  // Autosave Restore
  useEffect(() => {
    if (readOnly) return

    const saved = localStorage.getItem(`editor-autosave-${problemId}-${selectedLanguage}`)

    // Only restore if editor is empty or null, to prevent overwriting deliberate resets
    if (saved && !code) {
      onCodeChange?.(saved)
    }
  }, [problemId, selectedLanguage, readOnly, code, onCodeChange])

  // Restore cursor and scroll position on language change
  useEffect(() => {
    if (editorRef.current && cursorStates.current[selectedLanguage]) {
      const state = cursorStates.current[selectedLanguage]
      editorRef.current.setPosition(state.position)
      editorRef.current.setScrollTop(state.scroll)
      editorRef.current.focus()
    }
  }, [selectedLanguage])

  const handleLanguageSelect = (e) => {
    // Save current cursor and scroll before switching
    if (editorRef.current) {
      cursorStates.current[selectedLanguage] = {
        position: editorRef.current.getPosition(),
        scroll: editorRef.current.getScrollTop()
      }
    }
    if (onLanguageChange) {
      onLanguageChange(e.target.value)
    }
  }

  const handleEditorBeforeMount = (monaco) => {
    // Define a custom theme
    monaco.editor.defineTheme('leetcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      }
    })
  }

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    setIsEditorLoaded(true)
    
    // Custom Keyboard Shortcuts
    
    // Ctrl + S: Manual Save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      localStorage.setItem(`editor-autosave-${problemId}-${selectedLanguage}`, editor.getValue())
    })

    // Ctrl + Enter: Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.()
    })

    // Shift + Alt + F or Ctrl + Shift + I: Format Document
    const formatAction = () => {
      editor.getAction('editor.action.formatDocument')?.run()
    }
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, formatAction)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyI, formatAction)

    // TODO: Monaco Decorations
    // You can use editor.deltaDecorations([]) here in the future 
    // to highlight compile errors (red underline), runtime (yellow), etc.
  }

  return (
    <div className="flex flex-col h-full w-full bg-background border-l border-border overflow-hidden relative">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage || ''}
              onChange={handleLanguageSelect}
              className="bg-background border border-border rounded px-2 py-1 text-xs focus:outline-none focus:border-primary"
              disabled={readOnly}
            >
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {onReset && !readOnly && (
            <button 
              onClick={onReset}
              className="text-xs hover:text-foreground transition-colors"
            >
              Reset Code
            </button>
          )}
        </div>
      )}
      
      <div className="flex-1 w-full relative">
        {isEditorLoaded && !code && !readOnly && (
          <div className="absolute top-4 left-14 text-muted-foreground text-sm font-mono pointer-events-none z-10">
            // Start typing your solution...
          </div>
        )}
        <Editor
          height="100%"
          language={monacoLanguage}
          value={code}
          onChange={onCodeChange}
          theme={resolvedTheme === 'light' ? 'light' : 'leetcode-dark'}
          beforeMount={handleEditorBeforeMount}
          onMount={handleEditorMount}
          options={{
            readOnly: readOnly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            renderWhitespace: 'selection',
            renderLineHighlight: 'all',
            bracketPairColorization: { enabled: true }
          }}
          loading={
            <div className="flex flex-col gap-3 p-6 w-full h-full animate-pulse bg-[#1e1e1e]">
              <div className="h-4 bg-[#2d2d2d] rounded w-3/4"></div>
              <div className="h-4 bg-[#2d2d2d] rounded w-1/2"></div>
              <div className="h-4 bg-[#2d2d2d] rounded w-5/6"></div>
              <div className="h-4 bg-[#2d2d2d] rounded w-2/3"></div>
            </div>
          }
        />
      </div>
    </div>
  )
}
