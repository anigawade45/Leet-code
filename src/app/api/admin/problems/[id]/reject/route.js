import { NextResponse } from 'next/server'
import { ProblemService } from '@/services/problem.service'
import { verifyToken } from '@/lib/jwt'
import { UserRepository } from '@/repositories/user.repository'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await UserRepository.findById(payload.userId)
  if (!user || user.role !== 'ADMIN') return null

  return user
}

export async function PATCH(request, { params }) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return errorResponse('Forbidden', 'FORBIDDEN', 403)
    }

    const { id } = await params
    const problem = await ProblemService.rejectProblem(id)
    return NextResponse.json({ success: true, problem })
  } catch (error) {
    console.error('Reject problem error:', error)
    return errorResponse(error.message || 'Failed to reject problem', error.message === 'Problem not found' ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR', error.message === 'Problem not found' ? 404 : 500)
  }
}
