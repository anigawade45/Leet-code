import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { errorResponse } from '@/lib/api-response'

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const searchParams = request.nextUrl.searchParams
    const sort = searchParams.get('sort') || 'best' // 'best' or 'newest'
    const search = searchParams.get('search') || ''

    const cookieStore = await cookies()
    const token = cookieStore.get('token')
    let userId = null
    if (token) {
      const decoded = verifyToken(token.value)
      if (decoded) userId = decoded.userId
    }

    // First find the problem id
    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!problem) {
      return errorResponse('Problem not found', 'NOT_FOUND', 404)
    }

    const orderBy = sort === 'newest' 
      ? { createdAt: 'desc' }
      : { upvotes: 'desc' }

    const whereClause = {
      problemId: problem.id,
      parentId: null
    }

    if (search.trim()) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Fetch top-level discussions (parentId is null)
    const discussions = await prisma.discussion.findMany({
      where: whereClause,
      orderBy,
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        _count: {
          select: { replies: true }
        },
        ...(userId && {
          upvotesList: {
            where: { userId },
            select: { userId: true }
          }
        })
      }
    })

    const mappedDiscussions = discussions.map(d => {
      const hasUpvoted = userId ? (d.upvotesList?.length > 0) : false
      const { upvotesList, ...rest } = d
      return { ...rest, hasUpvoted }
    })

    return NextResponse.json({ success: true, discussions: mappedDiscussions })
  } catch (error) {
    console.error('Failed to fetch discussions:', error)
    return errorResponse('Failed to fetch discussions', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const decoded = verifyToken(token.value)
    if (!decoded) {
      return errorResponse('Invalid token', 'UNAUTHORIZED', 401)
    }

    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(decoded.userId, 'discussion', 5, 60) // 5 requests per minute
    
    if (!limitRes.success) {
      return errorResponse('Too many discussion posts. Please wait a minute and try again.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const body = await request.json()
    const { discussionSchema } = await import('@/lib/validators')
    const validatedData = discussionSchema.parse(body)

    const { title, content } = validatedData
    const { slug } = await params

    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!problem) {
      return errorResponse('Problem not found', 'NOT_FOUND', 404)
    }

    const discussion = await prisma.discussion.create({
      data: {
        title: title ? title.trim() : null,
        content: content.trim(),
        problemId: problem.id,
        userId: decoded.userId
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        _count: {
          select: { replies: true }
        }
      }
    })

    return NextResponse.json({ success: true, discussion })
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }
    console.error('Failed to create discussion:', error)
    return errorResponse('Failed to create discussion', 'INTERNAL_SERVER_ERROR', 500)
  }
}
