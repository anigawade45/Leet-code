import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function POST(request, { params }) {
  try {
    const { id: listId, problemId } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    // Verify the list belongs to the user
    const list = await prisma.userList.findUnique({
      where: { id: listId }
    })

    if (!list) return errorResponse('List not found', 'NOT_FOUND', 404)
    if (list.userId !== payload.userId) return errorResponse('Forbidden', 'FORBIDDEN', 403)

    // Update the addedAt timestamp to now()
    const updated = await prisma.listProblem.update({
      where: {
        listId_problemId: { listId, problemId }
      },
      data: {
        addedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, updated })
  } catch (error) {
    console.error('Move to top error:', error)
    return errorResponse('Failed to move to top', 'INTERNAL_SERVER_ERROR', 500)
  }
}
