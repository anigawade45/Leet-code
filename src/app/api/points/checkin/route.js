import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'
import { awardPoints, PointValues } from '@/lib/points'

async function authenticateUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = verifyToken(token)
  if (!payload) return null
  return prisma.user.findUnique({ where: { id: payload.userId } })
}

export async function POST(request) {
  try {
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // 1. Determine if they have already checked in today
    // Check if there is a 'A daily check-in' transaction today
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const todayCheckin = await prisma.pointsTransaction.findFirst({
      where: {
        userId: user.id,
        title: 'A daily check-in',
        createdAt: {
          gte: startOfDay
        }
      }
    })

    if (todayCheckin) {
      // Already checked in today, no action needed, but return success
      return NextResponse.json({ success: true, message: 'Already checked in today', pointsAwarded: 0 })
    }

    // 2. Award daily checkin point
    await awardPoints(user.id, 'A daily check-in', PointValues.DAILY_CHECKIN)
    let totalPointsAwarded = PointValues.DAILY_CHECKIN

    // 3. Handle Streaks (Optional advanced logic, simplified for now)
    // Here you would check if they have 30 consecutive days. 
    // To keep performance high, we usually use a `UserStreak` table that tracks `currentStreak`
    // Since we don't have that table in the schema currently, we could count transactions in the last 30 days
    // For now we will just award the 1 point. If they hit 30, we'd do:
    // await awardPoints(user.id, '30-day streak bonus', PointValues.THIRTY_DAY_STREAK)

    return NextResponse.json({ success: true, message: 'Daily check-in completed', pointsAwarded: totalPointsAwarded })
  } catch (error) {
    console.error('Checkin error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}
