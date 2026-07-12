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

export async function GET(request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return errorResponse('Forbidden', 'FORBIDDEN', 403)
    }

    const { searchParams } = new URL(request.url)
    const filters = {
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page'), 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : 50,
      difficulty: searchParams.get('difficulty') || undefined,
      category: searchParams.get('category') || undefined,
      matchType: 'all'
    }

    const problems = await ProblemService.getAllProblemsAdmin(filters)
    return NextResponse.json({ success: true, problems })
  } catch (error) {
    console.error('Admin get problems error:', error)
    return errorResponse('Failed to get problems', 'INTERNAL_SERVER_ERROR', 500)
  }
}
