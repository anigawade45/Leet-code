import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const list = await prisma.userList.findUnique({
      where: { id },
      include: {
        problems: {
          include: {
            problem: true
          }
        },
        user: {
          select: { username: true, avatar: true }
        }
      }
    })

    if (!list) return errorResponse('List not found', 'NOT_FOUND', 404)

    return NextResponse.json({ success: true, list })
  } catch (error) {
    console.error('Fetch list error:', error)
    return errorResponse('Failed to fetch list', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const { id } = await params
    const body = await request.json()
    
    // verify ownership
    const existingList = await prisma.userList.findUnique({ where: { id } })
    if (!existingList) return errorResponse('List not found', 'NOT_FOUND', 404)
    if (existingList.userId !== payload.userId) return errorResponse('Forbidden', 'FORBIDDEN', 403)

    const updatedList = await prisma.userList.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        isPublic: body.isPublic !== undefined ? body.isPublic : undefined
      }
    })

    return NextResponse.json({ success: true, list: updatedList })
  } catch (error) {
    console.error('Update list error:', error)
    return errorResponse('Failed to update list', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const { id } = await params
    
    const existingList = await prisma.userList.findUnique({ where: { id } })
    if (!existingList) return errorResponse('List not found', 'NOT_FOUND', 404)
    if (existingList.userId !== payload.userId) return errorResponse('Forbidden', 'FORBIDDEN', 403)

    await prisma.userList.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'List deleted' })
  } catch (error) {
    console.error('Delete list error:', error)
    return errorResponse('Failed to delete list', 'INTERNAL_SERVER_ERROR', 500)
  }
}
