import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const body = await request.json()
    const { problemId, listTitle = 'Favorite' } = body

    if (!problemId) return errorResponse('Problem ID is required', 'VALIDATION_ERROR', 400)

    // Find or create the list
    let list = await prisma.userList.findUnique({
      where: {
        userId_title: { userId: payload.userId, title: listTitle }
      }
    })

    if (!list) {
      list = await prisma.userList.create({
        data: { userId: payload.userId, title: listTitle, isPublic: true }
      })
    }

    // Check if problem is in list
    const existingEntry = await prisma.listProblem.findUnique({
      where: {
        listId_problemId: { listId: list.id, problemId }
      }
    })

    if (existingEntry) {
      // Remove it
      await prisma.listProblem.delete({
        where: { listId_problemId: { listId: list.id, problemId } }
      })
      return NextResponse.json({ success: true, message: 'Removed from list', added: false })
    } else {
      // Add it
      await prisma.listProblem.create({
        data: { listId: list.id, problemId }
      })
      return NextResponse.json({ success: true, message: 'Added to list', added: true })
    }
  } catch (error) {
    console.error('Toggle problem error:', error)
    return errorResponse('Failed to toggle problem in list', 'INTERNAL_SERVER_ERROR', 500)
  }
}
