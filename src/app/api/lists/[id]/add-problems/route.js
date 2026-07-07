import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const { id } = await params
    const body = await request.json()
    const { problemIds } = body

    if (!Array.isArray(problemIds)) {
      return errorResponse('Invalid payload', 'BAD_REQUEST', 400)
    }
    
    // verify ownership
    const existingList = await prisma.userList.findUnique({ where: { id } })
    if (!existingList) return errorResponse('List not found', 'NOT_FOUND', 404)
    if (existingList.userId !== payload.userId) return errorResponse('Forbidden', 'FORBIDDEN', 403)

    // Find existing problem ids to avoid duplicates (Prisma createMany with skipDuplicates does this automatically but ListProblem is an explicit many-to-many model with compound ID)
    
    const newRelations = problemIds.map(pid => ({
      listId: id,
      problemId: pid
    }))

    // Use createMany to insert ignoring duplicates
    await prisma.listProblem.createMany({
      data: newRelations,
      skipDuplicates: true
    })

    return NextResponse.json({ success: true, message: 'Problems added to list' })
  } catch (error) {
    console.error('Add problems to list error:', error)
    return errorResponse('Failed to add problems', 'INTERNAL_SERVER_ERROR', 500)
  }
}
