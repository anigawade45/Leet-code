import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { errorResponse } from '@/lib/api-response'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')
  if (!token) return null

  const payload = verifyToken(token.value)
  if (!payload) return null

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.role !== 'ADMIN') return null
    return user
  } catch (e) {
    return null
  }
}

export async function GET(request) {
  const admin = await checkAdmin()
  if (!admin) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      prisma.contest.findMany({
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { participants: true, problems: true }
          }
        }
      }),
      prisma.contest.count()
    ])

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1
      }
    })
  } catch (error) {
    console.error(error)
    return errorResponse('Failed to fetch contests', 'INTERNAL_SERVER_ERROR', 500)
  }
}
