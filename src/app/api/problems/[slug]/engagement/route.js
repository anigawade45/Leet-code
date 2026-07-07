import { NextResponse } from 'next/server'
import { ProblemService } from '@/services/problem.service'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

async function getOptionalUserId() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  const payload = verifyToken(token)
  return payload?.userId || null
}

async function requireUserId() {
  const userId = await getOptionalUserId()
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const userId = await getOptionalUserId()
    const engagement = await ProblemService.getProblemEngagement(slug, userId)
    return NextResponse.json({ success: true, ...engagement })
  } catch (error) {
    console.error('Get engagement error:', error)
    const status = error.message === 'Problem not found' ? 404 : 500
    const errorCode = error.message === 'Problem not found' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'
    return errorResponse(error.message || 'Failed to get engagement', errorCode, status)
  }
}

export async function POST(request, { params }) {
  try {
    const userId = await requireUserId()
    const { slug } = await params
    const { type } = await request.json()

    if (!['LIKE', 'DISLIKE'].includes(type)) {
      return errorResponse('Invalid reaction type', 'BAD_REQUEST', 400)
    }

    const engagement = await ProblemService.setProblemReaction(slug, userId, type)
    return NextResponse.json({ success: true, ...engagement })
  } catch (error) {
    console.error('Set engagement error:', error)
    const status =
      error.message === 'Unauthorized' ? 401 :
      error.message === 'Problem not found' ? 404 : 500
    const errorCode =
      error.message === 'Unauthorized' ? 'UNAUTHORIZED' :
      error.message === 'Problem not found' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'
    return errorResponse(error.message || 'Failed to set reaction', errorCode, status)
  }
}
