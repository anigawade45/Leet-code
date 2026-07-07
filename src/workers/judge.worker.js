import { Worker } from 'bullmq'
import redisConnection, { getRedisConnection } from '../lib/redis.js'
import prisma from '../lib/prisma.js'
import { BadgeService } from '../services/badge.service.js'
import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import { LANGUAGE_CONFIGS } from '../services/execution/languageConfig.js'
import { compileCode } from '../services/execution/compile.js'
import { runCode } from '../services/execution/run.js'
import { wrapCode, parseResultAndStdout } from '../services/execution/executor.js'

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

  return cleanActual.replace(/\s+/g, ' ') === cleanExpected.replace(/\s+/g, ' ')
}

export const judgeWorker = new Worker('submissions', async (job) => {
  console.log(`[JudgeWorker] Processing job ${job.id} for submission ${job.data.submissionId}`)
  
  const { submissionId, userId, problemId, language, code, customTestCases, contestId } = job.data

  try {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    })

    if (!problem) {
      throw new Error(`Problem ${problemId} not found`)
    }

    const config = LANGUAGE_CONFIGS[language.toLowerCase()]
    if (!config) {
      throw new Error(`Unsupported language: ${language}`)
    }

    const PREFERRED_REF_LANGS = ['javascript', 'python', 'java', 'cpp', 'c']
    const solCodes = problem.solutionCode
      ? (typeof problem.solutionCode === 'string' ? JSON.parse(problem.solutionCode) : problem.solutionCode)
      : null
    let refLanguage = null
    let refSolution = null
    if (solCodes) {
      if (solCodes[language.toLowerCase()]) {
        refLanguage = language.toLowerCase()
        refSolution = solCodes[language.toLowerCase()]
      } else {
        for (const lang of PREFERRED_REF_LANGS) {
          if (solCodes[lang]) { refLanguage = lang; refSolution = solCodes[lang]; break }
        }
      }
    }
    const refConfig = refLanguage ? LANGUAGE_CONFIGS[refLanguage] : null

    const tempDir = path.join(process.cwd(), 'temp', 'submissions', submissionId)
    const refDir = refSolution && refConfig ? path.join(process.cwd(), 'temp', 'ref-submit', submissionId) : null

    let results = []
    let status = 'ACCEPTED'
    let runtime = 0
    let memory = 0
    let firstFailedTestCase = null
    let passedCount = 0
    let refCompile = null
    let errorMsg = ''

    try {
      await fs.mkdir(tempDir, { recursive: true })
      const wrappedCode = wrapCode(language, code, problem)
      await fs.writeFile(path.join(tempDir, config.fileName), wrappedCode, 'utf-8')

      const compileResult = await compileCode({ config, tempDir })
      if (!compileResult.success) {
        status = 'COMPILATION_ERROR'
        errorMsg = compileResult.stderr

        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            status,
            error: errorMsg,
            passedCount: 0,
            totalCount: problem.testCases.length
          }
        })

        if (contestId) {
          await prisma.contestSubmission.create({
            data: {
              contestId,
              userId,
              problemId,
              submissionId,
              status
            }
          })
        }
        return { status, error: errorMsg }
      }

      if (refDir && refSolution && refConfig) {
        try {
          await fs.mkdir(refDir, { recursive: true })
          const refWrapped = wrapCode(refLanguage, refSolution)
          await fs.writeFile(path.join(refDir, refConfig.fileName), refWrapped, 'utf-8')
          refCompile = await compileCode({ config: refConfig, tempDir: refDir })
        } catch (e) {
          console.warn('[JudgeWorker] Ref compile failed:', e.message)
        }
      }

      const dbTestCases = problem.testCases
      const safeCustom = Array.isArray(customTestCases) ? customTestCases.slice(0, 8) : []
      const localCases = safeCustom.length > 0
        ? safeCustom
            .filter(tc => tc.input && tc.input.trim())
            .map((tc, idx) => {
              const cleanInput = tc.input.trim().replace(/\r\n/g, '\n')
              const matched = dbTestCases.find(dbtc => dbtc.input.trim().replace(/\r\n/g, '\n') === cleanInput)
              return {
                id: tc.id || `local-${idx}`,
                input: tc.input,
                output: matched ? matched.output : (tc.output || tc.expected || ''),
                isLocal: true,
              }
            })
        : []

      const dbInputs = new Set(dbTestCases.map(tc => tc.input.trim().replace(/\r\n/g, '\n')))
      const uniqueLocalCases = localCases.filter(tc => !dbInputs.has(tc.input.trim().replace(/\r\n/g, '\n')))
      const allTestCases = [...dbTestCases, ...uniqueLocalCases]

      let totalRuntime = 0
      let maxMemory = 0
      passedCount = 0

      for (const tc of allTestCases) {
        const runResult = await runCode({ config, tempDir, inputData: tc.input })
        totalRuntime += runResult.time
        maxMemory = Math.max(maxMemory, runResult.memory || 0)

        const parsed = parseResultAndStdout(runResult.stdout)
        const tcTime = parsed.time ?? runResult.time
        if (parsed.time != null) {
          totalRuntime = totalRuntime - runResult.time + parsed.time
        }
        
        let passed = false
        let tcErrorMsg = ''
        let actualVal = parsed.actual
        let stdoutVal = parsed.stdout

        if (runResult.error) {
          tcErrorMsg = runResult.stderr || runResult.error
          if (runResult.error === 'Timeout') {
            status = 'TIME_LIMIT_EXCEEDED'
          } else {
            status = 'RUNTIME_ERROR'
          }
        } else {
          let expectedOutput = tc.output
          if (!expectedOutput && tc.isLocal && refCompile && refCompile.success) {
            try {
              const refRun = await runCode({ config: refConfig, tempDir: refDir, inputData: tc.input })
              if (!refRun.error) {
                const refParsed = parseResultAndStdout(refRun.stdout)
                expectedOutput = refParsed.actual || refParsed.stdout || ''
              }
            } catch (e) { }
          }
          if (!expectedOutput) expectedOutput = ''

          passed = compareOutputs(actualVal, expectedOutput)
          if (!passed && status === 'ACCEPTED') {
            status = 'WRONG_ANSWER'
          }
        }

        if (passed && !tc.isLocal) {
          passedCount++
        }

        results.push({
          input: tc.input,
          expected: tc.output || '',
          actual: actualVal,
          passed,
          error: tcErrorMsg,
          stdout: stdoutVal,
          isHidden: tc.isHidden || false,
          isLocal: tc.isLocal || false,
          time: tcTime
        })

        if (!passed && !tc.isLocal && !firstFailedTestCase) {
          firstFailedTestCase = {
            input: tc.input,
            expected: tc.output,
            actual: actualVal,
            error: tcErrorMsg,
            isHidden: tc.isHidden
          }
          if (status === 'ACCEPTED') status = 'WRONG_ANSWER'
        }
      }

      runtime = Math.round(totalRuntime / Math.max(1, dbTestCases.length))
      memory = maxMemory
      
      const dbPassedCount = passedCount
      if (dbPassedCount < dbTestCases.length && status === 'ACCEPTED') {
        status = 'WRONG_ANSWER'
      }

      const updateData = {
        status,
        runtime: status === 'ACCEPTED' ? runtime : null,
        memory: status === 'ACCEPTED' ? memory : null,
        passedCount: dbPassedCount,
        totalCount: dbTestCases.length,
        // Save execution results as JSON so frontend can pull them
        error: errorMsg || (firstFailedTestCase?.error ? String(firstFailedTestCase.error) : null),
        failedInput: firstFailedTestCase && !firstFailedTestCase.isHidden ? String(firstFailedTestCase.input) : null,
        failedExpected: firstFailedTestCase && !firstFailedTestCase.isHidden ? String(firstFailedTestCase.expected) : null,
        failedActual: firstFailedTestCase && !firstFailedTestCase.isHidden ? String(firstFailedTestCase.actual) : null,
        // Note: we might need a separate field for raw `results` if we want to show all cases, but keeping it aligned with DB schema for now.
      }

      await prisma.submission.update({
        where: { id: submissionId },
        data: updateData
      })

      if (contestId) {
        await prisma.contestSubmission.create({
          data: {
            contestId,
            userId,
            problemId,
            submissionId,
            status,
            // Assuming ContestSubmission doesn't need to duplicate `failedInput` etc.
          }
        })
        
        const redisClient = await getRedisConnection()
        // Invalidate leaderboard cache
        await redisClient.del(
          `leaderboard:zset:${contestId}`,
          `leaderboard:hash:${contestId}`,
          `leaderboard:meta:${contestId}`
        )
        
        // Broadcast leaderboard update signal
        try {
          await redisClient.publish('socket:broadcast', JSON.stringify({
            event: 'leaderboard:update',
            room: `contest:${contestId}`,
            payload: { contestId } // Client can fetch new leaderboard
          }))
        } catch (e) {
          console.error('[JudgeWorker] Failed to publish leaderboard update:', e)
        }
      }

      if (status === 'ACCEPTED') {
        try {
          const { StreakService } = await import('../services/streak.service.js')
          await StreakService.updateStreak(userId, problemId)
          await BadgeService.checkAndAwardBadges(userId)
        } catch (e) {
          console.error('[JudgeWorker] Failed to update streak or award badges:', e)
        }
      }

      // Broadcast the result to the Socket Server
      try {
        const redisClient = await getRedisConnection()
        const payload = {
          event: 'submission:update',
          room: `user:${userId}`,
          payload: {
            submissionId,
            status,
            runtime,
            memory,
            passedCount,
            totalTestCases: testCases.length,
            error: updateData.error,
            failedInput: updateData.failedInput,
            expectedOutput: updateData.expectedOutput,
            actualOutput: updateData.actualOutput
          }
        }
        await redisClient.publish('socket:broadcast', JSON.stringify(payload))
      } catch (e) {
        console.error('[JudgeWorker] Failed to publish socket event:', e)
      }

      return { status, runtime, memory, passedCount }
    } finally {
      // Cleanup temp directories
      try {
        await fs.rm(tempDir, { recursive: true, force: true })
        if (refDir) {
          await fs.rm(refDir, { recursive: true, force: true })
        }
      } catch (e) {
        console.error('[JudgeWorker] Cleanup failed:', e)
      }
    }
  } catch (err) {
    const { logger } = await import('../lib/logger.js')
    logger.error(`[JudgeWorker] Unhandled error in job ${job.id}`, { error: err.message, submissionId, event: 'WORKER_JOB_ERROR' })
    
    await prisma.submission.update({
      where: { id: submissionId },
      data: { status: 'RUNTIME_ERROR', error: 'Internal Judge Error' }
    })
    
    logger.warn('Submission failed unexpectedly due to internal error', { submissionId, userId, problemId, status: 'RUNTIME_ERROR', event: 'SUBMISSION_FAILED' })
    throw err
  }
}, {
  connection: redisConnection,
  concurrency: 5 // Process up to 5 submissions simultaneously
})

judgeWorker.on('completed', async (job, returnvalue) => {
  const { logger } = await import('../lib/logger.js')
  const { submissionId, userId, problemId } = job.data
  const { status } = returnvalue
  
  if (status !== 'ACCEPTED') {
    logger.warn({ submissionId, userId, problemId, status, event: 'SUBMISSION_FAILED' }, 'Submission failed validation/compilation')
  } else {
    logger.info({ submissionId, userId, problemId, status, event: 'SUBMISSION_ACCEPTED' }, 'Submission accepted')
  }
})

judgeWorker.on('failed', async (job, err) => {
  const { logger } = await import('../lib/logger.js')
  logger.error(`[JudgeWorker] Job ${job?.id} failed`, { error: err.message, submissionId: job?.data?.submissionId, event: 'WORKER_JOB_FAILED' })
})

judgeWorker.on('error', async (err) => {
  const { logger } = await import('../lib/logger.js')
  logger.error('[JudgeWorker] Worker error', { error: err.message, event: 'WORKER_ERROR' })
})

// Bind to uncaught events globally for fatal crashes
process.on('uncaughtException', async (err) => {
  const { logger } = await import('../lib/logger.js')
  logger.fatal({ error: err.message, stack: err.stack, event: 'WORKER_CRASH' }, 'Worker crashed unexpectedly (uncaughtException)')
  process.exit(1)
})

process.on('unhandledRejection', async (reason) => {
  const { logger } = await import('../lib/logger.js')
  logger.fatal({ reason, event: 'WORKER_CRASH' }, 'Worker crashed unexpectedly (unhandledRejection)')
  process.exit(1)
})
