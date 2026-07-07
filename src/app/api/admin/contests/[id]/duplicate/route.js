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

export async function POST(request, { params }) {
  const admin = await checkAdmin()
  if (!admin) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

  const { id } = await params

  try {
    const original = await prisma.contest.findUnique({
      where: { id },
      include: {
        problems: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!original) return errorResponse('Not found', 'NOT_FOUND', 404)

    // Create a duplicated contest
    // Title appended with (Copy)
    // Same settings, same problems, new dates
    
    // Default to +7 days for the copied contest dates so they aren't completely in the past
    const offset = 7 * 24 * 60 * 60 * 1000
    const newStart = new Date(original.startTime.getTime() + offset)
    const newEnd = new Date(original.endTime.getTime() + offset)
    
    const newRegOpens = original.registrationOpens ? new Date(original.registrationOpens.getTime() + offset) : null
    const newRegCloses = original.registrationCloses ? new Date(original.registrationCloses.getTime() + offset) : null

    const duplicate = await prisma.contest.create({
      data: {
        title: `${original.title} (Copy)`,
        description: original.description,
        startTime: newStart,
        endTime: newEnd,
        duration: original.duration,
        visibility: 'PRIVATE', // Important: keep private by default so it's not immediately public
        createdBy: admin.id,
        difficulty: original.difficulty,
        registrationOpens: newRegOpens,
        registrationCloses: newRegCloses,
        maxParticipants: original.maxParticipants,
        showLiveLeaderboard: original.showLiveLeaderboard,
        freezeLeaderboard: original.freezeLeaderboard,
        allowPractice: original.allowPractice,
        showEditorial: original.showEditorial,
        allowLateRegistration: original.allowLateRegistration,
        enableDiscussion: original.enableDiscussion,
        problems: {
          create: original.problems.map(p => ({
            problemId: p.problemId,
            order: p.order
          }))
        }
      },
      include: {
        _count: {
          select: { participants: true, problems: true }
        }
      }
    })

    return NextResponse.json({ success: true, contest: duplicate }, { status: 201 })
  } catch (error) {
    console.error(error)
    return errorResponse('Failed to duplicate', 'INTERNAL_SERVER_ERROR', 500)
  }
}
