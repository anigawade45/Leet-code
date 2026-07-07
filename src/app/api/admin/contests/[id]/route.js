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

export async function GET(request, { params }) {
  const admin = await checkAdmin()
  if (!admin) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

  const { id } = await params

  try {
    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        problems: {
          include: { problem: true },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { participants: true, submissions: true }
        }
      }
    })

    if (!contest) return errorResponse('Not found', 'NOT_FOUND', 404)

    return NextResponse.json({ success: true, contest })
  } catch (error) {
    return errorResponse('Failed to fetch', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function PATCH(request, { params }) {
  const admin = await checkAdmin()
  if (!admin) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

  const { id } = await params
  const data = await request.json()

  try {
    const { contestSchema } = await import('@/lib/validators')
    const validatedData = contestSchema.partial().parse(data)

    // If updating problems, we need to delete existing and recreate to keep it simple,
    // or just handle the ones passed. For simplicity, if problemIds is passed, replace them all.
    const { problemIds, startTime, endTime, registrationOpens, registrationCloses, maxParticipants, ...rest } = validatedData

    const updateData = { ...rest }

    if (startTime) updateData.startTime = new Date(startTime)
    if (endTime) {
      updateData.endTime = new Date(endTime)
      if (updateData.startTime) {
        updateData.duration = Math.floor((updateData.endTime - updateData.startTime) / 60000)
      }
    }
    
    if (registrationOpens !== undefined) updateData.registrationOpens = registrationOpens ? new Date(registrationOpens) : null
    if (registrationCloses !== undefined) updateData.registrationCloses = registrationCloses ? new Date(registrationCloses) : null
    if (maxParticipants !== undefined) updateData.maxParticipants = maxParticipants ? parseInt(maxParticipants, 10) : null

    if (problemIds) {
      // Replace all problems
      await prisma.contestProblem.deleteMany({ where: { contestId: id } })
      updateData.problems = {
        create: problemIds.map((pid, idx) => ({
          problemId: pid,
          order: idx + 1
        }))
      }
    }

    const contest = await prisma.contest.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ success: true, contest })
  } catch (error) {
    console.error(error)
    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }
    return errorResponse('Failed to update', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function DELETE(request, { params }) {
  const admin = await checkAdmin()
  if (!admin) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

  const { id } = await params

  try {
    await prisma.contest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse('Failed to delete', 'INTERNAL_SERVER_ERROR', 500)
  }
}
