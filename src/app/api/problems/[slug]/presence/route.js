import { NextResponse } from 'next/server'
import { ProblemService } from '@/services/problem.service'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

async function requireUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) {
    throw new Error('Unauthorized')
  }

  const payload = verifyToken(token)
  if (!payload?.userId) {
    throw new Error('Unauthorized')
  }

  return payload.userId
}

export async function POST(request, { params }) {
  try {
    const userId = await requireUserId()
    const { slug } = await params
    const { sessionId } = await request.json()

    if (!sessionId || typeof sessionId !== 'string') {
      return errorResponse('Invalid sessionId', 'BAD_REQUEST', 400)
    }

    const engagement = await ProblemService.touchProblemPresence(slug, userId, sessionId)
    return NextResponse.json({ success: true, ...engagement })
  } catch (error) {
    console.error('Touch presence error:', error)
    const status =
      error.message === 'Unauthorized' ? 401 :
      error.message === 'Problem not found' ? 404 : 500
    const errorCode =
      error.message === 'Unauthorized' ? 'UNAUTHORIZED' :
      error.message === 'Problem not found' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'
    return errorResponse(error.message || 'Failed to update presence', errorCode, status)
  }
}
