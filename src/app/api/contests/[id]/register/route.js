import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token.value)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const contest = await prisma.contest.findUnique({
      where: { id }
    })

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    const now = new Date()

    // 1. Check if registration is open yet
    if (contest.registrationOpens && now < new Date(contest.registrationOpens)) {
      return NextResponse.json({ error: 'Registration has not opened yet' }, { status: 403 })
    }

    // 2. Check if registration is explicitly closed
    if (contest.registrationCloses && now > new Date(contest.registrationCloses)) {
      return NextResponse.json({ error: 'Registration is closed' }, { status: 403 })
    }

    // 3. Check "Allow Late Registration" rule
    // If the contest has started, and late registration is NOT allowed, reject.
    if (now > new Date(contest.startTime) && !contest.allowLateRegistration) {
      return NextResponse.json({ error: 'Contest has already started and late registration is disabled' }, { status: 403 })
    }

    // 4. Check Max Participants limit
    if (contest.maxParticipants) {
      const currentParticipants = await prisma.contestParticipant.count({
        where: { contestId: id }
      })
      if (currentParticipants >= contest.maxParticipants) {
        return NextResponse.json({ error: 'Contest has reached maximum capacity' }, { status: 403 })
      }
    }

    // Check if already registered
    const existing = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId: id, userId: decoded.userId } }
    })

    if (existing) {
      return NextResponse.json({ message: 'Already registered' }, { status: 200 })
    }

    await prisma.contestParticipant.create({
      data: {
        contestId: id,
        userId: decoded.userId
      }
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Failed to register for contest:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}
