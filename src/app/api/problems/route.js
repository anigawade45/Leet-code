import { NextResponse } from 'next/server'
import { ProblemService } from '@/services/problem.service'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { populateTestCaseOutputs } from '@/services/execution/populateOutputs'
import { getRedisConnection } from '@/lib/redis'
import { errorResponse } from '@/lib/api-response'

export async function GET(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(ip, 'problems-list', 'public')
    if (!limitRes.success) {
      return errorResponse('Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined
    const difficulty = searchParams.get('difficulty') || undefined
    const difficultyOp = searchParams.get('difficultyOp') || 'is'
    const tagsParam = searchParams.get('tags')
    const tagIds = tagsParam ? tagsParam.split(',').filter(Boolean) : undefined
    const tagsOp = searchParams.get('tagsOp') || 'is'
    
    const companiesParam = searchParams.get('companies')
    const companyIds = companiesParam ? companiesParam.split(',').filter(Boolean) : undefined
    const companiesOp = searchParams.get('companiesOp') || 'is'
    
    const language = searchParams.get('language') || undefined
    const languageOp = searchParams.get('languageOp') || 'is'
    
    const matchType = searchParams.get('matchType') || 'all'
    const category = searchParams.get('category') || undefined

    const sortBy = searchParams.get('sortBy') || 'problemNumber'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const cacheParams = {
      search,
      difficulty: difficulty && difficulty !== 'ALL' ? difficulty : undefined,
      difficultyOp,
      tagIds,
      tagsOp,
      companyIds,
      companiesOp,
      language,
      languageOp,
      matchType,
      category,
      sortBy,
      sortOrder,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
    }

    const redisClient = await getRedisConnection()
    const cacheKey = `problems:list:${JSON.stringify(cacheParams)}`

    let result = {}
    const cached = await redisClient.get(cacheKey)

    if (cached) {
      result = JSON.parse(cached)
    } else {
      result = await ProblemService.getAllProblems(cacheParams)
      // Cache for 5 minutes
      await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 300)
    }

    // Optionally check if current user is logged in
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    let currentUserId = null
    if (token) {
      try {
        const decoded = await verifyToken(token)
        currentUserId = decoded.userId
      } catch (e) {
        // invalid token, ignore
      }
    }

    // Attach isSolved property
    let mappedProblems = result.data.map(p => {
      const isSolved = currentUserId 
        ? p.submissions?.some(s => s.userId === currentUserId && s.status === 'ACCEPTED') || false
        : false
      return { ...p, isSolved }
    })

    const userStatus = searchParams.get('userStatus')
    const userStatusOp = searchParams.get('userStatusOp') || 'is'
    
    // Manual filtering for properties not handled by Prisma (userStatus, language)
    if (userStatus || language) {
      mappedProblems = mappedProblems.filter(p => {
        let statusMatch = null
        if (userStatus === 'solved') {
          statusMatch = userStatusOp === 'is_not' ? !p.isSolved : p.isSolved
        } else if (userStatus === 'unsolved') {
          statusMatch = userStatusOp === 'is_not' ? p.isSolved : !p.isSolved
        }

        let langMatch = null
        if (language) {
          const hasLang = p.starterCode && typeof p.starterCode === 'object' && p.starterCode[language] !== undefined
          langMatch = languageOp === 'is_not' ? !hasLang : hasLang
        }

        if (matchType === 'any') {
          if (statusMatch === true || langMatch === true) return true
          if (statusMatch === false && !language) return false
          if (langMatch === false && !userStatus) return false
          if (statusMatch === false && langMatch === false) return false
          return true
        } else {
          // matchType === 'all'
          if (statusMatch === false) return false
          if (langMatch === false) return false
          return true
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: mappedProblems,
      pagination: result.pagination 
    })
  } catch (error) {
    console.error('Get problems error:', error)
    return errorResponse(error.message || 'Failed to get problems', 'INTERNAL_SERVER_ERROR', 500)
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

    const body = await request.json()
    const { problemSchema } = await import('@/lib/validators')
    const validatedData = problemSchema.parse(body)

    const problem = await ProblemService.createProblem(validatedData, payload.userId)
    // Fire-and-forget: populate test case outputs using reference solution
    if (problem.solutionCode) {
      populateTestCaseOutputs(problem.id).catch(console.warn)
    }
    return NextResponse.json({ success: true, problem }, { status: 201 })
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }
    console.error('Create problem error:', error)
    return errorResponse(error.message || 'Failed to create problem', 'INTERNAL_SERVER_ERROR', 500)
  }
}
