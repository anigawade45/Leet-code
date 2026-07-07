import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    // Look up problemId by slug
    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!problem) return errorResponse('Problem not found', 'NOT_FOUND', 404)

    const note = await prisma.note.findUnique({
      where: {
        userId_problemId: {
          userId: payload.userId,
          problemId: problem.id
        }
      }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Failed to fetch note:', error)
    return errorResponse('Failed to fetch note', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function PUT(request, { params }) {
  try {
    const { slug } = await params
    const { content } = await request.json()

    if (typeof content !== 'string') {
      return errorResponse('Content is required', 'BAD_REQUEST', 400)
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    // Look up problemId by slug
    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!problem) return errorResponse('Problem not found', 'NOT_FOUND', 404)

    // Using upsert to either create a new note or update existing one
    const note = await prisma.note.upsert({
      where: {
        userId_problemId: {
          userId: payload.userId,
          problemId: problem.id
        }
      },
      update: { content },
      create: {
        userId: payload.userId,
        problemId: problem.id,
        content
      }
    })

    return NextResponse.json({ note })
  } catch (error) {
    console.error('Failed to save note:', error)
    return errorResponse('Failed to save note', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const { slug } = await params

    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!problem) return errorResponse('Problem not found', 'NOT_FOUND', 404)

    await prisma.note.delete({
      where: {
        userId_problemId: {
          userId: payload.userId,
          problemId: problem.id
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete note:', error)
    return errorResponse('Failed to delete note', 'INTERNAL_SERVER_ERROR', 500)
  }
}
