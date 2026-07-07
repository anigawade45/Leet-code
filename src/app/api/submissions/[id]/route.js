import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { SubmissionService } from '@/services/submission.service'
import { errorResponse } from '@/lib/api-response'

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const { id } = await params
    const submission = await SubmissionService.getSubmissionById(id)

    if (!submission) return errorResponse('Not found', 'NOT_FOUND', 404)
    if (submission.userId !== payload.userId)
      return errorResponse('Forbidden', 'FORBIDDEN', 403)

    return NextResponse.json({ success: true, submission })
  } catch (error) {
    return errorResponse(error.message, 'INTERNAL_SERVER_ERROR', 500)
  }
}
