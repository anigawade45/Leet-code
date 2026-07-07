import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { LANGUAGE_CONFIGS } from '@/services/execution/languageConfig'
import { compileCode } from '@/services/execution/compile'
import { runCode } from '@/services/execution/run'
import { execute, wrapCode, parseResultAndStdout } from '@/services/execution/executor'
import { errorResponse } from '@/lib/api-response'

function compareOutputs(actualStr, expectedStr) {
  const cleanActual = (actualStr || '').trim()
  const cleanExpected = (expectedStr || '').trim()

  if (cleanActual === cleanExpected) return true

  try {
    const actJson = JSON.parse(cleanActual)
    const expJson = JSON.parse(cleanExpected)
    return JSON.stringify(actJson) === JSON.stringify(expJson)
  } catch (e) {
    // ignore and fallback
  }

  // Also handle single-line whitespace normalized comparison
  return cleanActual.replace(/\s+/g, ' ') === cleanExpected.replace(/\s+/g, ' ')
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token || !verifyToken(token)) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const body = await request.json()
    const { language, code, problemId, input, customTestCases } = body

    if (!language || !code) {
      return errorResponse('Missing language or code', 'BAD_REQUEST', 400)
    }

    const config = LANGUAGE_CONFIGS[language.toLowerCase()]
    if (!config) {
      return errorResponse(`Unsupported language: ${language}`, 'BAD_REQUEST', 400)
    }

    // Case 1: Custom single input execution (Standard execute)
    if (input !== undefined) {
      const execResult = await execute({ language, code, input })
      return NextResponse.json({
        success: true,
        output: execResult.output,
        status: execResult.status,
        runtime: execResult.runtime
      })
    }

    // Case 2: Multi-testcase run against problem
    if (!problemId) {
      return errorResponse('Missing problemId', 'BAD_REQUEST', 400)
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    })

    if (!problem) {
      return errorResponse('Problem not found', 'NOT_FOUND', 404)
    }

    let sampleTestCases = []
    if (customTestCases && Array.isArray(customTestCases) && customTestCases.length > 0) {
      sampleTestCases = customTestCases.map((tc, idx) => {
        const cleanInput = tc.input.trim().replace(/\r\n/g, '\n')
        const matchedTestCase = problem?.testCases.find(dbTc => 
          dbTc.input.trim().replace(/\r\n/g, '\n') === cleanInput
        )
        
        return {
          id: tc.id || `custom-${idx}`,
          input: tc.input,
          output: matchedTestCase ? matchedTestCase.output : (tc.output || tc.expected || ''),
        }
      })
    } else {
      sampleTestCases = problem.testCases.filter(tc => !tc.isHidden).slice(0, 8)
    }
    
    // Parse official solution code
    const solCodes = typeof problem.solutionCode === 'string'
      ? JSON.parse(problem.solutionCode)
      : problem.solutionCode

    // Pick the best available reference solution — prefer same language as user,
    // then fall back to js → python → java → cpp (most portable first)
    const PREFERRED_REF_LANGS = ['javascript', 'python', 'java', 'cpp', 'c']
    let refLanguage = null
    let refSolution = null

    if (solCodes) {
      // First try exact match with user's language
      if (solCodes[language.toLowerCase()]) {
        refLanguage = language.toLowerCase()
        refSolution = solCodes[language.toLowerCase()]
      } else {
        // Fall back to the most portable available language
        for (const lang of PREFERRED_REF_LANGS) {
          if (solCodes[lang]) {
            refLanguage = lang
            refSolution = solCodes[lang]
            break
          }
        }
      }
    }

    const refConfig = refLanguage ? LANGUAGE_CONFIGS[refLanguage] : null

    // Set up compilation folders
    const submissionId = randomBytes(4).toString('hex')
    const tempDir = path.join(process.cwd(), 'temp', 'submissions', submissionId)
    const refDir = refSolution && refConfig ? path.join(process.cwd(), 'temp', 'reference', submissionId) : null

    let refCompile = null

    try {
      await fs.mkdir(tempDir, { recursive: true })
      const wrappedCode = wrapCode(language, code)
      await fs.writeFile(path.join(tempDir, config.fileName), wrappedCode, 'utf-8')

      // Compile user code once
      const compileResult = await compileCode({ config, tempDir })
      if (!compileResult.success) {
        // Return a mock result list indicating Compilation Error
        const results = sampleTestCases.map(tc => ({
          id: tc.id,
          input: tc.input,
          expected: tc.output,
          actual: null,
          passed: false,
          error: compileResult.stderr,
          status: 'Compilation Error'
        }))
        return NextResponse.json({ success: true, results, error: compileResult.stderr })
      }

      // Only compile reference solution if at least one test case is missing expected output
      const anyNeedsRef = sampleTestCases.some(tc => !tc.output || tc.output.trim() === '')
      if (anyNeedsRef && refDir && refSolution && refConfig) {
        await fs.mkdir(refDir, { recursive: true })
        const refWrapped = wrapCode(refLanguage, refSolution)
        await fs.writeFile(path.join(refDir, refConfig.fileName), refWrapped, 'utf-8')
        refCompile = await compileCode({ config: refConfig, tempDir: refDir })
      }

      // Run each test case
      const results = []
      for (const tc of sampleTestCases) {
        let expectedVal = tc.output

        // Only run reference solution if expected output is NOT already stored in DB
        // (avoids double execution time for pre-populated test cases)
        const needsRefRun = !expectedVal || expectedVal.trim() === ''
        if (needsRefRun && refCompile && refCompile.success && refDir) {
          try {
            const refRun = await runCode({ config: refConfig, tempDir: refDir, inputData: tc.input })
            if (refRun.exitCode === 0) {
              const refParsed = parseResultAndStdout(refRun.stdout)
              if (refParsed.actual !== null && refParsed.actual !== undefined) {
                expectedVal = refParsed.actual
              }
            }
          } catch (e) {
            console.error('Failed to run reference solution:', e)
          }
        }

        const runResult = await runCode({ config, tempDir, inputData: tc.input })
        
        const parsed = parseResultAndStdout(runResult.stdout)
        let passed = false
        let errorMsg = ''
        let actualVal = parsed.actual
        let stdoutVal = parsed.stdout

        if (runResult.status === 'Time Limit Exceeded') {
          errorMsg = 'Time Limit Exceeded'
          actualVal = null
        } else if (runResult.exitCode !== 0) {
          errorMsg = runResult.stderr || `Exit code: ${runResult.exitCode}`
          actualVal = null
        } else {
          if (!expectedVal || expectedVal.trim() === '') {
            passed = true
          } else {
            passed = compareOutputs(parsed.actual, expectedVal)
          }
        }

        results.push({
          id: tc.id,
          input: tc.input,
          expected: expectedVal,
          actual: actualVal,
          passed,
          stdout: stdoutVal,
          error: errorMsg,
          time: parsed.time ?? runResult.time
        })
      }

      return NextResponse.json({ success: true, results })
    } finally {
      // Clean up folders
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
      } catch (e) {
        // ignore cleanup error
      }
      try {
        if (refDir) {
          await fs.rm(refDir, { recursive: true, force: true })
        }
      } catch (e) {
        // ignore cleanup error
      }
    }
  } catch (error) {
    return errorResponse(error.message, 'INTERNAL_SERVER_ERROR', 500)
  }
}
