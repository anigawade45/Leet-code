import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { LANGUAGE_CONFIGS } from '@/services/execution/languageConfig'
import { wrapCode, parseResultAndStdout } from '@/services/execution/executor'
import { compileCode } from '@/services/execution/compile'
import { runCode } from '@/services/execution/run'

const PREFERRED_REF_LANGS = ['javascript', 'python', 'java', 'cpp', 'c']

/**
 * Auto-populates TestCase.output fields using the problem's reference solution.
 * Called after a problem is created or updated with a solutionCode.
 * Only updates test cases that have an empty/missing output.
 */
export async function populateTestCaseOutputs(problemId) {
  try {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    })

    if (!problem || !problem.solutionCode) return

    const solCodes =
      typeof problem.solutionCode === 'string'
        ? JSON.parse(problem.solutionCode)
        : problem.solutionCode

    // Pick the best available language
    let refLanguage = null
    let refSolution = null
    for (const lang of PREFERRED_REF_LANGS) {
      if (solCodes[lang]) {
        refLanguage = lang
        refSolution = solCodes[lang]
        break
      }
    }

    if (!refLanguage || !refSolution) return

    const refConfig = LANGUAGE_CONFIGS[refLanguage]
    if (!refConfig) return

    // Filter test cases that are missing output
    const needsOutput = problem.testCases.filter(
      (tc) => !tc.output || tc.output.trim() === ''
    )
    if (needsOutput.length === 0) return

    // Compile the reference solution once
    const submissionId = randomBytes(4).toString('hex')
    const refDir = path.join(process.cwd(), 'temp', 'ref-populate', submissionId)

    try {
      await fs.mkdir(refDir, { recursive: true })
      const refWrapped = wrapCode(refLanguage, refSolution)
      await fs.writeFile(path.join(refDir, refConfig.fileName), refWrapped, 'utf-8')

      const compileResult = await compileCode({ config: refConfig, tempDir: refDir })
      if (!compileResult.success) {
        console.warn('[populateTestCaseOutputs] Ref solution failed to compile:', compileResult.stderr)
        return
      }

      // Run ref solution for each test case that needs output
      for (const tc of needsOutput) {
        try {
          const runResult = await runCode({
            config: refConfig,
            tempDir: refDir,
            inputData: tc.input,
          })

          if (runResult.exitCode === 0) {
            const parsed = parseResultAndStdout(runResult.stdout)
            if (parsed.actual !== null && parsed.actual !== undefined && parsed.actual !== '') {
              await prisma.testCase.update({
                where: { id: tc.id },
                data: { output: parsed.actual },
              })
            }
          }
        } catch (e) {
          console.warn(`[populateTestCaseOutputs] Failed for tc ${tc.id}:`, e.message)
        }
      }

      const { logger } = await import('../logger.js')
      logger.info({ count: needsOutput.length, problemId, event: 'TEST_CASES_POPULATED' }, '[populateTestCaseOutputs] Populated test case outputs')
    } finally {
      try {
        await fs.rm(refDir, { recursive: true, force: true })
      } catch (e) {}
    }
  } catch (e) {
    console.warn('[populateTestCaseOutputs] Error:', e.message)
  }
}
