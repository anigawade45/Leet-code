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
  
  // get search param
  const url = new URL(request.url)
  const query = url.searchParams.get('q') || ''

  try {
    const participants = await prisma.contestParticipant.findMany({
      where: { 
        contestId: id,
        user: {
          username: {
            contains: query,
            mode: 'insensitive'
          }
        }
      },
      include: {
        user: {
          select: { id: true, username: true, email: true, avatar: true }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    // To get solved count, we need to count unique problems solved by each participant in this contest
    // We can do a group by, or fetch accepted submissions
    const submissions = await prisma.contestSubmission.findMany({
      where: {
        contestId: id,
        status: 'ACCEPTED'
      },
      select: {
        userId: true,
        problemId: true
      }
    })

    // calculate unique solved per user
    const solvedMap = {}
    submissions.forEach(sub => {
      if (!solvedMap[sub.userId]) solvedMap[sub.userId] = new Set()
      solvedMap[sub.userId].add(sub.problemId)
    })

    const result = participants.map(p => ({
      ...p,
      solvedCount: solvedMap[p.userId]?.size || 0
    }))

    return NextResponse.json({ success: true, participants: result })
  } catch (error) {
    console.error(error)
    return errorResponse('Failed to fetch', 'INTERNAL_SERVER_ERROR', 500)
  }
}
