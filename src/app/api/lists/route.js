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

    const lists = await prisma.userList.findMany({
      where: { userId: payload.userId },
      include: {
        _count: {
          select: { problems: true }
        },
        problems: {
          select: { problemId: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ success: true, lists })
  } catch (error) {
    console.error('Fetch lists error:', error)
    return errorResponse('Failed to fetch lists', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const body = await request.json()
    const { title, isPublic = false } = body

    if (!title || typeof title !== 'string') {
      return errorResponse('Title is required', 'VALIDATION_ERROR', 400)
    }

    const newList = await prisma.userList.create({
      data: {
        userId: payload.userId,
        title,
        isPublic
      }
    })

    return NextResponse.json({ success: true, list: newList })
  } catch (error) {
    console.error('Create list error:', error)
    if (error.code === 'P2002') {
      return errorResponse('You already have a list with this title', 'CONFLICT', 409)
    }
    return errorResponse('Failed to create list', 'INTERNAL_SERVER_ERROR', 500)
  }
}
