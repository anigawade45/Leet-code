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
  
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)

  try {
    const submissions = await prisma.contestSubmission.findMany({
      where: { contestId: id },
      include: {
        user: {
          select: { username: true }
        },
        problem: {
          select: { title: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: limit
    })

    // Also fetch basic stats for the overview monitor
    const totalSubmissions = await prisma.contestSubmission.count({ where: { contestId: id } })
    const acceptedCount = await prisma.contestSubmission.count({ where: { contestId: id, status: 'ACCEPTED' } })
    const pendingCount = await prisma.contestSubmission.count({ where: { contestId: id, status: 'PENDING' } })
    
    // To calculate average runtime of accepted
    const acceptedSubs = await prisma.contestSubmission.findMany({
      where: { contestId: id, status: 'ACCEPTED' },
      select: { runtime: true }
    })
    
    let avgRuntime = 0
    if (acceptedSubs.length > 0) {
      const total = acceptedSubs.reduce((acc, curr) => acc + (curr.runtime || 0), 0)
      avgRuntime = Math.round(total / acceptedSubs.length)
    }

    return NextResponse.json({
      success: true,
      submissions,
      stats: {
        totalSubmissions,
        acceptedCount,
        pendingCount,
        avgRuntime
      }
    })
  } catch (error) {
    console.error(error)
    return errorResponse('Failed to fetch', 'INTERNAL_SERVER_ERROR', 500)
  }
}
