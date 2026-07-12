import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { SubmissionService } from '@/services/submission.service'
import { errorResponse } from '@/lib/api-response'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const payload = verifyToken(token)
    if (!payload) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }



    const { searchParams } = new URL(request.url)
    const problemId = searchParams.get('problemId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    let result
    if (problemId) {
      result = await SubmissionService.getUserSubmissionsForProblem(payload.userId, problemId, page, limit)
    } else {
      result = await SubmissionService.getUserSubmissions(payload.userId, page, limit)
    }

    // Return a consistently-shaped response expected by clients
    return NextResponse.json({ success: true, submissions: result.data, pagination: result.pagination })
  } catch (error) {
    console.error('Get submissions error:', error)
    return errorResponse('Failed to get submissions', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const payload = verifyToken(token)
    if (!payload) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(payload.userId, 'submission', 20, 60) // 20 requests per minute
    
    if (!limitRes.success) {
      return errorResponse('Too many submissions. Please wait a minute and try again.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const body = await request.json()
    const { submissionSchema } = await import('@/lib/validators')
    const validatedData = submissionSchema.parse(body)

    const { problemId, language, code, customTestCases, contestId } = validatedData


    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { testCases: true },
    })

    if (!problem) {
      return errorResponse('Problem not found', 'NOT_FOUND', 404)
    }

    if (problem.testCases.length === 0) {
      return errorResponse('Problem has no test cases configured.', 'BAD_REQUEST', 400)
    }

    let contest = null
    if (contestId) {
      contest = await prisma.contest.findUnique({ where: { id: contestId } })
      if (!contest) {
        return errorResponse('Contest not found', 'NOT_FOUND', 404)
      }
      const now = new Date()
      const startTime = new Date(contest.startTime)
      const endTime = new Date(contest.endTime)
      
      if (now < startTime) {
        return errorResponse('Contest has not started yet', 'FORBIDDEN', 403)
      }
      
      if (now > endTime && !contest.allowPractice) {
        return errorResponse('Contest has ended and practice is not allowed', 'FORBIDDEN', 403)
      }
    }

    // 1. Create PENDING submission
    const submission = await prisma.submission.create({
      data: {
        userId: payload.userId,
        problemId,
        language,
        code,
        status: 'PENDING',
        runtime: 0,
        memory: 0,
        passedCount: 0,
        totalCount: problem.testCases.length
      },
    })

    // 2. Queue Job
    const { addSubmissionJob } = await import('@/queues/submission.queue')
    await addSubmissionJob({
      submissionId: submission.id,
      userId: payload.userId,
      problemId,
      language,
      code,
      customTestCases,
      contestId
    })

    // 3. Return immediately
    return NextResponse.json({
      success: true,
      submission: { ...submission, status: 'PENDING' },
      message: 'Submission queued successfully'
    }, { status: 201 })

  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }
    console.error('Submit code error:', error)
    return errorResponse('Failed to submit code', 'INTERNAL_SERVER_ERROR', 500)
  }
}
