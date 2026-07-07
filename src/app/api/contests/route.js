import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(request) {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        _count: {
          select: { participants: true, problems: true }
        }
      }
    })

    const now = new Date()
    const upcoming = []
    const live = []
    const past = []

    contests.forEach(c => {
      if (now < c.startTime) {
        upcoming.push(c)
      } else if (now >= c.startTime && now <= c.endTime) {
        live.push(c)
      } else {
        past.push(c)
      }
    })

    // Sort past in descending order
    past.sort((a, b) => b.endTime - a.endTime)

    return NextResponse.json({ upcoming, live, past })
  } catch (error) {
    console.error('Failed to fetch contests:', error)
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token.value)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await request.json()
    const { contestSchema } = await import('@/lib/validators')
    
    // Validate request
    const validatedData = contestSchema.parse(data)

    const { 
      title, description, startTime, endTime, visibility, problemIds,
      difficulty, registrationOpens, registrationCloses, maxParticipants,
      showLiveLeaderboard, freezeLeaderboard, allowPractice, showEditorial, 
      allowLateRegistration, enableDiscussion
    } = validatedData

    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = Math.floor((end - start) / 60000)

    const contest = await prisma.contest.create({
      data: {
        title,
        description,
        startTime: start,
        endTime: end,
        duration,
        visibility: visibility || 'PUBLIC',
        createdBy: user.id,
        difficulty: difficulty || 'MIXED',
        registrationOpens: registrationOpens ? new Date(registrationOpens) : null,
        registrationCloses: registrationCloses ? new Date(registrationCloses) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        showLiveLeaderboard: showLiveLeaderboard ?? true,
        freezeLeaderboard: freezeLeaderboard ?? false,
        allowPractice: allowPractice ?? true,
        showEditorial: showEditorial ?? true,
        allowLateRegistration: allowLateRegistration ?? true,
        enableDiscussion: enableDiscussion ?? false,
        problems: {
          create: problemIds.map((pid, idx) => ({
            problemId: pid,
            order: idx + 1
          }))
        }
      }
    })

    const { logger } = await import('@/lib/logger')
    logger.info({ adminId: user.id, contestId: contest.id, title: contest.title, event: 'CONTEST_CREATED' }, 'Contest created successfully')

    return NextResponse.json({ contest }, { status: 201 })
  } catch (error) {
    console.error('Failed to create contest:', error)
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 })
  }
}
