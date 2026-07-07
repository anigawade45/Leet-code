import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { getRedisConnection } from '@/lib/redis'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const yearStr = searchParams.get('year')
    const monthStr = searchParams.get('month')

    const today = new Date()
    const year = yearStr ? parseInt(yearStr, 10) : today.getFullYear()
    const month = monthStr ? parseInt(monthStr, 10) : today.getMonth() + 1 // 1-indexed

    // Start and end of the month
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1))
    const endOfMonth = new Date(Date.UTC(year, month, 1))

    const cacheKey = `daily:calendar:${year}:${month}`
    const redisClient = await getRedisConnection()
    let challenges = []
    
    const cached = await redisClient.get(cacheKey)
    if (cached) {
      challenges = JSON.parse(cached)
    } else {
      // Fetch daily challenges for the month
      challenges = await prisma.dailyChallenge.findMany({
        where: {
          date: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        },
        select: {
          id: true,
          date: true,
          problemId: true,
          problem: {
            select: { slug: true }
          }
        }
      })
      
      // Cache for 10 minutes
      await redisClient.set(cacheKey, JSON.stringify(challenges), 'EX', 600)
    }

    let userId = null
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get('token')?.value
      if (token) {
        const decoded = await verifyToken(token)
        userId = decoded.userId
      }
    } catch (e) {
      // ignore auth errors
    }

    const calendarData = {}

    // Initialize all challenges in the dict
    for (const ch of challenges) {
      const chDate = new Date(ch.date)
      const dateStr = chDate.toISOString().split('T')[0]
      calendarData[dateStr] = {
        id: ch.id,
        problemId: ch.problemId,
        slug: ch.problem?.slug,
        isSolved: false
      }
    }

    // Check if user solved them on that day
    if (userId && challenges.length > 0) {
      const problemIds = challenges.map(c => c.problemId)
      
      const submissions = await prisma.submission.findMany({
        where: {
          userId,
          problemId: { in: problemIds },
          status: 'ACCEPTED',
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        },
        select: {
          problemId: true,
          createdAt: true
        }
      })

      // Mark as solved if there's a submission on the same UTC date
      for (const sub of submissions) {
        const subDateStr = sub.createdAt.toISOString().split('T')[0]
        if (calendarData[subDateStr] && calendarData[subDateStr].problemId === sub.problemId) {
          calendarData[subDateStr].isSolved = true
        }
      }
    }

    return NextResponse.json({ calendarData, year, month })
  } catch (error) {
    console.error('Failed to fetch daily challenge calendar:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
