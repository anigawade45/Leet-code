import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { getRedisConnection } from '@/lib/redis'
import { errorResponse } from '@/lib/api-response'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const username = url.searchParams.get('username')
    let user = null

    if (username) {
      // Accept either a plain username (alphanumeric/_/-) or an email address
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)

      if (!isEmail && !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
        return errorResponse('Invalid username or email', 'VALIDATION_ERROR', 400)
      }

      const whereClause = isEmail ? { email: username } : { username }

      user = await prisma.user.findUnique({
        where: whereClause,
        include: {
          userStreak: true,
          userBadges: {
            include: { badge: true }
          },
          submissions: {
            include: { problem: true }
          }
        }
      })
    } else {
      const cookieStore = await cookies()
      const token = cookieStore.get('token')?.value
      const payload = verifyToken(token)
      if (!payload) {
        return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
      }

      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          userStreak: true,
          userBadges: {
            include: { badge: true }
          },
          submissions: {
            include: { problem: true }
          }
        }
      })
    }

    const redisClient = await getRedisConnection()
    const cacheKey = `user:${username || user?.username}`
    const cached = await redisClient.get(cacheKey)
    if (cached) {
      return NextResponse.json({ success: true, ...JSON.parse(cached) })
    }

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404)
    }

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404)
    }

    // Calculate solved problems and active days
    const solvedIds = new Set()
    const activeDates = new Set()
    const heatmap = {}
    let easy = 0
    let medium = 0
    let hard = 0

    const oneYearAgo = new Date()
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 11)
    oneYearAgo.setDate(1)
    oneYearAgo.setHours(0, 0, 0, 0)

    user.submissions.forEach(sub => {
      const dateStr = new Date(sub.createdAt).toISOString().split('T')[0]
      
      // Only track heatmap data for the past year
      if (new Date(sub.createdAt) > oneYearAgo) {
        heatmap[dateStr] = (heatmap[dateStr] || 0) + 1
      }
      
      // Track active days
      activeDates.add(dateStr)

      // Track solved problems (only count accepted)
      if (sub.status === 'ACCEPTED' && !solvedIds.has(sub.problemId)) {
        solvedIds.add(sub.problemId)
        if (sub.problem.difficulty === 'EASY') easy++
        if (sub.problem.difficulty === 'MEDIUM') medium++
        if (sub.problem.difficulty === 'HARD') hard++
      }
    })

    // Fetch total problem counts by difficulty
    const totalEasy = await prisma.problem.count({ where: { difficulty: 'EASY' } })
    const totalMedium = await prisma.problem.count({ where: { difficulty: 'MEDIUM' } })
    const totalHard = await prisma.problem.count({ where: { difficulty: 'HARD' } })

    // Calculate real streaks from activeDates
    const sortedDates = Array.from(activeDates).sort()
    let maxStreak = 0
    let currentStreak = 0
    let tempStreak = 0
    let lastDate = null

    const todayStr = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    for (const d of sortedDates) {
      if (!lastDate) {
        tempStreak = 1
      } else {
        const prev = new Date(lastDate)
        const curr = new Date(d)
        const diffTime = Math.abs(curr - prev)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          tempStreak += 1
        } else if (diffDays > 1) {
          tempStreak = 1
        }
      }
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak
      }
      lastDate = d
    }

    if (lastDate === todayStr || lastDate === yesterdayStr) {
      currentStreak = tempStreak
    } else {
      currentStreak = 0
    }

    const responseJson = {
      user: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      streak: {
        currentStreak,
        longestStreak: maxStreak,
        lastSolved: lastDate ? new Date(lastDate) : null
      },
      solved: {
        total: easy + medium + hard,
        easy,
        medium,
        hard,
        totalEasy,
        totalMedium,
        totalHard
      },
      activity: {
        totalSubmissions: Object.values(heatmap).reduce((a, b) => a + b, 0), // Total in the past year
        totalActiveDays: activeDates.size,
        heatmap
      }
    }

    await redisClient.set(cacheKey, JSON.stringify(responseJson), 'EX', 300)

    return NextResponse.json({ success: true, ...responseJson })

  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return errorResponse('Internal Server Error', 'INTERNAL_SERVER_ERROR', 500)
  }
}
