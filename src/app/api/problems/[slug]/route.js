import { NextResponse } from 'next/server'
import { ProblemService } from '@/services/problem.service'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { populateTestCaseOutputs } from '@/services/execution/populateOutputs'
import { getRedisConnection } from '@/lib/redis'
import { errorResponse } from '@/lib/api-response'

export async function GET(request, { params }) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(ip, 'problem-detail', 'public')
    if (!limitRes.success) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const { slug } = await params
    const cacheKey = `problem:detail:${slug}`
    const redisClient = await getRedisConnection()
    
    const cached = await redisClient.get(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, problem: JSON.parse(cached) })
    }

    const problem = await ProblemService.getProblemBySlug(slug)
    
    // Cache for 30 minutes (1800 seconds)
    await redisClient.set(cacheKey, JSON.stringify(problem), 'EX', 1800)
    
    return NextResponse.json({ success: true, problem })
  } catch (error) {
    console.error('Get problem error:', error)
    return errorResponse(error.message || 'Failed to get problem', error.message === 'Problem not found' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR', error.message === 'Problem not found' ? 404 : 500)
  }
}

export async function PATCH(request, { params }) {
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
    const limitRes = await rateLimit(payload.userId, 'problem-patch', 'user')
    if (!limitRes.success) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const body = await request.json()
    const { problemSchema } = await import('@/lib/validators')
    const validatedData = problemSchema.partial().parse(body)
    
    // First, get problem by slug to get its ID
    const { slug } = await params
    const problem = await ProblemService.getProblemBySlug(slug)
    const updatedProblem = await ProblemService.updateProblem(
      problem.id,
      validatedData,
      payload.userId
    )
    
    const redisClient = await getRedisConnection()
    // Invalidate cache
    await redisClient.del(`problem:detail:${slug}`)

    // Fire-and-forget: re-populate test case outputs if solution changed
    if (body.solutionCode) {
      populateTestCaseOutputs(updatedProblem.id).catch(console.warn)
    }
    return NextResponse.json({ success: true, problem: updatedProblem })
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }
    console.error('Update problem error:', error)
    const status = error.message.includes('not found') ? 404 : 
                  error.message.includes('Not authorized') ? 403 : 500
    const errorCode = error.message.includes('not found') ? 'NOT_FOUND' : 
                  error.message.includes('Not authorized') ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR'
    return errorResponse(error.message || 'Failed to update problem', errorCode, status)
  }
}

export async function DELETE(request, { params }) {
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
    const limitRes = await rateLimit(payload.userId, 'problem-delete', 'user')
    if (!limitRes.success) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    // First, get problem by slug to get its ID
    const { slug } = await params
    const problem = await ProblemService.getProblemBySlug(slug)
    await ProblemService.deleteProblem(problem.id, payload.userId)
    
    const redisClient = await getRedisConnection()
    // Invalidate cache
    await redisClient.del(`problem:detail:${slug}`)

    const { logger } = await import('@/lib/logger')
    logger.info({ adminId: payload.userId, problemId: problem.id, slug, event: 'PROBLEM_DELETED' }, 'Problem deleted successfully')

    return NextResponse.json({ success: true, message: 'Problem deleted successfully' })
  } catch (error) {
    console.error('Delete problem error:', error)
    const status = error.message.includes('not found') ? 404 : 
                  error.message.includes('Not authorized') ? 403 : 500
    const errorCode = error.message.includes('not found') ? 'NOT_FOUND' : 
                  error.message.includes('Not authorized') ? 'FORBIDDEN' : 'INTERNAL_SERVER_ERROR'
    return errorResponse(error.message || 'Failed to delete problem', errorCode, status)
  }
}
