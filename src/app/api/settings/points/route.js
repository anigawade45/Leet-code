import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

async function authenticateUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = verifyToken(token)
  if (!payload) return null
  return prisma.user.findUnique({ where: { id: payload.userId } })
}

export async function GET(request) {
  try {
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const pointsHistory = await prisma.pointsTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      leetCoins: user.leetCoins,
      history: pointsHistory
    })
  } catch (error) {
    console.error('Get points history error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}
