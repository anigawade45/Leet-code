export function getParamNames(starterCode, problem) {
  if (problem?.examples) {
    let examplesArray = []
    try {
      if (typeof problem.examples === 'string') {
        examplesArray = JSON.parse(problem.examples)
      } else if (Array.isArray(problem.examples)) {
        examplesArray = problem.examples
      }
    } catch(e) {}

    if (examplesArray && examplesArray.length > 0 && examplesArray[0].input) {
      const inputStr = examplesArray[0].input
      const matches = [...inputStr.matchAll(/([a-zA-Z0-9_]+)\s*=/g)]
      if (matches.length > 0) {
        return matches.map(m => m[1].trim())
      }
    }
  }

  if (!starterCode) return []
  
  let codeTemplates = []
  if (typeof starterCode === 'object') {
    codeTemplates = Object.values(starterCode)
  } else if (typeof starterCode === 'string') {
    try {
      codeTemplates = Object.values(JSON.parse(starterCode))
    } catch (e) {
      codeTemplates = [starterCode]
    }
  }

  for (const code of codeTemplates) {
    if (!code) continue

    const pyMatch = code.match(/def\s+[a-zA-Z0-9_]+\s*\(\s*self\s*,\s*([^)]*)\)/)
    if (pyMatch) {
      const params = pyMatch[1].split(',').map(p => p.split(':')[0].trim()).filter(Boolean)
      if (params.length > 0 && params.every(p => p !== 'input')) return params
    }

    const jsMatch = code.match(/(?:function\s+|class\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g)
    if (jsMatch) {
      for (const m of jsMatch) {
        const parts = m.match(/([a-zA-Z0-9_]+)\s*\(([^)]*)\)/)
        if (parts) {
          const name = parts[1].trim()
          const paramsStr = parts[2].trim()
          if (name !== 'constructor' && name !== 'class' && name !== 'Solution' && name !== 'solve' && paramsStr) {
            const params = paramsStr.split(',').map(p => p.trim()).filter(Boolean)
            if (params.length > 0) return params
          }
        }
      }
    }

    const typedMatch = code.match(/([a-zA-Z0-9_<>&:]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g)
    if (typedMatch) {
      for (const m of typedMatch) {
        const parts = m.match(/([a-zA-Z0-9_<>&:]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/)
        if (parts) {
          const name = parts[2].trim()
          const paramsStr = parts[3].trim()
          if (name !== 'Solution' && name !== 'solve' && name !== 'Main' && name !== 'main' && paramsStr) {
            const params = paramsStr.split(',').map(arg => {
              const tokens = arg.trim().split(/[\s&*]+/)
              return tokens.length >= 2 ? tokens[tokens.length - 1].trim() : null
            }).filter(Boolean)
            if (params.length > 0) return params
          }
        }
      }
    }
  }

  return []
}

export function renderInput(inputStr, problem) {
  const lines = (inputStr || '').split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const paramNames = getParamNames(problem?.starterCode, problem)
  
  if (paramNames.length > 0 && lines.length === paramNames.length) {
    return (
      <div className="flex flex-col gap-4">
        {paramNames.map((name, i) => (
          <div key={i} className="p-3.5 bg-card border border-border/20 rounded-lg">
            <div className="text-muted-foreground text-[12px] font-sans mb-2">{name} =</div>
            <pre className="text-white font-bold whitespace-pre-wrap font-mono m-0 p-0 border-0 bg-transparent text-[13px]">
              {lines[i]}
            </pre>
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="p-3.5 bg-card border border-border/20 rounded-lg text-white font-bold whitespace-pre-wrap font-mono text-[13px]">
      {inputStr}
    </div>
  )
}
