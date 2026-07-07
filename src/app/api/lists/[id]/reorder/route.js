import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function POST(request, { params }) {
  try {
    const { id: listId } = await params
    const { problemIds } = await request.json()

    if (!problemIds || !Array.isArray(problemIds)) {
      return errorResponse('Invalid payload', 'BAD_REQUEST', 400)
    }

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

    // The order sent by the client is the custom order.
    // To preserve this order using the `addedAt` timestamp (which is sorted DESC),
    // we assign sequential timestamps where the first item has the most recent time.
    const now = Date.now()

    // Prisma doesn't support bulk update with different values easily without raw queries or a transaction.
    // Since lists are small, we can just use a transaction to update them sequentially.
    const updatePromises = problemIds.map((problemId, index) => {
      // Subtract (index * 1000) milliseconds to maintain descending order
      const newAddedAt = new Date(now - (index * 1000))
      return prisma.listProblem.updateMany({
        where: {
          listId,
          problemId
        },
        data: {
          addedAt: newAddedAt
        }
      })
    })

    await prisma.$transaction(updatePromises)

    return NextResponse.json({ success: true, message: 'List reordered successfully' })
  } catch (error) {
    console.error('Reorder error:', error)
    return errorResponse('Failed to reorder list', 'INTERNAL_SERVER_ERROR', 500)
  }
}
