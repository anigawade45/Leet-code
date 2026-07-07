import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const notes = await prisma.note.findMany({
      where: { userId: payload.userId },
      include: {
        problem: {
          select: {
            problemNumber: true,
            title: true,
            slug: true,
            difficulty: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('Failed to fetch notes:', error)
    return errorResponse('Failed to fetch notes', 'INTERNAL_SERVER_ERROR', 500)
  }
}
