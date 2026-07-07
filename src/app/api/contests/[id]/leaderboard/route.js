import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRedisConnection } from '@/lib/redis'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const skip = (page - 1) * limit
    
    // Check if sorted set exists
    const zsetKey = `leaderboard:zset:${id}`
    const hashKey = `leaderboard:hash:${id}`
    const metaKey = `leaderboard:meta:${id}`
    
    const redisClient = await getRedisConnection()
    const exists = await redisClient.exists(zsetKey)
    if (exists) {
      // ZREVRANGE to get highest scores first
      const userIds = await redisClient.zrevrange(zsetKey, skip, skip + limit - 1)
      const total = await redisClient.zcard(zsetKey)
      
      let leaderboard = []
      if (userIds.length > 0) {
        const hashData = await redisClient.hmget(hashKey, ...userIds)
        leaderboard = hashData.map(d => JSON.parse(d))
      }
      
      const metaStr = await redisClient.get(metaKey)
      const meta = metaStr ? JSON.parse(metaStr) : { problems: [], stats: {} }

      return NextResponse.json({
        data: {
          leaderboard,
          problems: meta.problems,
          stats: meta.stats
        },
        pagination: {
          page, limit, total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrevious: page > 1
        }
      })
    }

    const contest = await prisma.contest.findUnique({
      where: { id }
    })

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    const now = new Date()
    const isLive = now >= new Date(contest.startTime) && now <= new Date(contest.endTime)
    const isEnded = now > new Date(contest.endTime)

    // Enforce showLiveLeaderboard
    if (!contest.showLiveLeaderboard && isLive) {
      return NextResponse.json({ error: 'Live leaderboard is disabled for this contest', leaderboard: [] })
    }

    // Determine the cutoff time for submissions if the leaderboard is frozen
    let freezeCutoff = null
    if (contest.freezeLeaderboard && isLive) {
      // Frozen for the last 30 minutes
      freezeCutoff = new Date(new Date(contest.endTime).getTime() - 30 * 60000)
    }

    const [contestProblems, participantCount, submissions] = await Promise.all([
      prisma.contestProblem.findMany({
        where: { contestId: id },
        orderBy: { order: 'asc' },
        include: { problem: { select: { id: true, title: true } } }
      }),
      prisma.contestParticipant.count({
        where: { contestId: id }
      }),
      prisma.contestSubmission.findMany({
        where: { contestId: id },
        orderBy: { submittedAt: 'asc' },
        include: {
          user: { select: { id: true, username: true, avatar: true } },
          problem: { select: { id: true } }
        }
      })
    ])

    const stats = {
      participants: participantCount,
      problems: contestProblems.length,
      accepted: 0,
      submissions: submissions.length
    }

    // Leaderboard Data Structure
    const leaderboardMap = {}

    submissions.forEach(sub => {
      // Respect freeze cutoff
      if (freezeCutoff && new Date(sub.submittedAt) > freezeCutoff) return
      // Ignore practice submissions after contest
      if (new Date(sub.submittedAt) > new Date(contest.endTime)) return

      if (!leaderboardMap[sub.userId]) {
        leaderboardMap[sub.userId] = {
          user: sub.user,
          solvedCount: 0,
          penalty: 0,
          lastAcceptedTime: 0,
          problems: {}
        }
      }

      const userStats = leaderboardMap[sub.userId]
      if (!userStats.problems[sub.problemId]) {
        userStats.problems[sub.problemId] = {
          solved: false,
          wrongAttempts: 0,
          timeMinutes: 0
        }
      }

      const pStats = userStats.problems[sub.problemId]
      if (pStats.solved) return

      if (sub.status === 'ACCEPTED') {
        pStats.solved = true
        stats.accepted += 1
        const timeFromStart = Math.max(0, Math.floor((new Date(sub.submittedAt) - new Date(contest.startTime)) / 60000))
        pStats.timeMinutes = timeFromStart
        
        userStats.solvedCount += 1
        userStats.penalty += timeFromStart + (pStats.wrongAttempts * 20)
        // Keep track of the very last accepted time for tie-breaking
        if (new Date(sub.submittedAt).getTime() > userStats.lastAcceptedTime) {
          userStats.lastAcceptedTime = new Date(sub.submittedAt).getTime()
        }
      } else {
        pStats.wrongAttempts += 1
      }
    })

    const leaderboard = Object.values(leaderboardMap).sort((a, b) => {
      // 1. Sort by solved count (descending)
      if (b.solvedCount !== a.solvedCount) {
        return b.solvedCount - a.solvedCount
      }
      // 2. Sort by penalty (ascending)
      if (a.penalty !== b.penalty) {
        return a.penalty - b.penalty
      }
      // 3. Sort by earlier last accepted submission (ascending)
      return a.lastAcceptedTime - b.lastAcceptedTime
    })

    const result = { 
      leaderboard, 
      problems: contestProblems.map(cp => ({ id: cp.problem.id, title: cp.problem.title, order: cp.order })),
      stats
    }

    // Cache indefinitely (invalidated by worker)
    const pipeline = redisClient.pipeline()
    leaderboard.forEach((userStats) => {
      // Create a sortable score: higher is better
      // Since max solved is small (e.g. 10), we can use: solvedCount * 1,000,000,000 - penalty * 1,000 - lastAcceptedTime / 1,000,000,000
      const score = (userStats.solvedCount * 1000000000) - (userStats.penalty * 1000) - (userStats.lastAcceptedTime / 1000000000)
      pipeline.zadd(zsetKey, score, userStats.user.id)
      pipeline.hset(hashKey, userStats.user.id, JSON.stringify(userStats))
    })
    pipeline.set(metaKey, JSON.stringify({ problems: result.problems, stats: result.stats }))
    await pipeline.exec()

    const total = leaderboard.length
    const paginatedLeaderboard = leaderboard.slice(skip, skip + limit)

    return NextResponse.json({
      data: {
        leaderboard: paginatedLeaderboard,
        problems: result.problems,
        stats: result.stats
      },
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1
      }
    })
  } catch (error) {
    console.error('Failed to fetch contest leaderboard:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}
