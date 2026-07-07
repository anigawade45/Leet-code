import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    // Attempt to get user to see if they are registered
    const cookieStore = await cookies()
    const token = cookieStore.get('token')
    let userId = null
    if (token) {
      const decoded = verifyToken(token.value)
      if (decoded) {
        userId = decoded.userId
      }
    }

    const contest = await prisma.contest.findUnique({
      where: { id },
      include: {
        _count: {
          select: { participants: true, problems: true }
        }
      }
    })

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    let isRegistered = false
    if (userId) {
      const participant = await prisma.contestParticipant.findUnique({
        where: { contestId_userId: { contestId: id, userId } }
      })
      isRegistered = !!participant
    }

    return NextResponse.json({ contest, isRegistered })
  } catch (error) {
    console.error('Failed to fetch contest:', error)
    return NextResponse.json({ error: 'Failed to fetch contest' }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  // Add admin authorization and update logic
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}

export async function DELETE(request, { params }) {
  // Add admin authorization and delete logic
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
