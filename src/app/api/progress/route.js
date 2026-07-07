import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return errorResponse('Invalid token', 'UNAUTHORIZED', 401)
    }
    const userId = decoded.userId

    // 1. Fetch total problems available by difficulty
    const totalProblemsGrouped = await prisma.problem.groupBy({
      by: ['difficulty'],
      _count: true
    })
    
    const totalProblems = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
      total: 0
    }
    totalProblemsGrouped.forEach(group => {
      totalProblems[group.difficulty] = group._count
      totalProblems.total += group._count
    })

    // 2. Fetch user's solved problems
    // We only count problems where the user has at least one ACCEPTED submission
    const solvedSubmissions = await prisma.submission.findMany({
      where: {
        userId,
        status: 'ACCEPTED'
      },
      select: {
        problemId: true,
        problem: {
          select: {
            difficulty: true
          }
        }
      },
      distinct: ['problemId'] // Only count each problem once
    })

    const solvedProblems = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
      total: solvedSubmissions.length
    }
    
    solvedSubmissions.forEach(sub => {
      solvedProblems[sub.problem.difficulty]++
    })

    // 3. Submissions and Acceptance Rate
    const totalSubmissions = await prisma.submission.count({
      where: { userId }
    })
    
    const acceptedSubmissionsCount = await prisma.submission.count({
      where: { userId, status: 'ACCEPTED' }
    })

    const acceptanceRate = totalSubmissions === 0 
      ? 0 
      : ((acceptedSubmissionsCount / totalSubmissions) * 100).toFixed(1)

    // 4. Practice History
    // Fetch all submissions to group them by problem and get the latest
    const allUserSubmissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        problem: {
          select: {
            problemNumber: true,
            title: true,
            difficulty: true,
            slug: true,
            tags: {
              select: {
                tag: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    })

    const historyMap = new Map()
    allUserSubmissions.forEach(sub => {
      const subInfo = {
        id: sub.id,
        createdAt: sub.createdAt,
        status: sub.status,
        language: sub.language || 'javascript',
        runtime: sub.runtime || 0,
        memory: sub.memory || 0
      }

      if (!historyMap.has(sub.problemId)) {
        historyMap.set(sub.problemId, {
          id: sub.id, // ID of the latest submission
          problem: sub.problem,
          lastResult: sub.status,
          createdAt: sub.createdAt,
          submissionsCount: 1,
          submissions: [subInfo]
        })
      } else {
        const existing = historyMap.get(sub.problemId)
        existing.submissionsCount++
        existing.submissions.push(subInfo)
      }
    })
    const recentSubmissions = Array.from(historyMap.values()).slice(0, 50)

    // 5. All Submissions for Chart
    const allSubmissionsForChart = allUserSubmissions.map(sub => ({
      createdAt: sub.createdAt,
      status: sub.status,
      problem: { difficulty: sub.problem.difficulty, id: sub.problemId }
    })).reverse()

    // 6. Skill Matrix Aggregation
    const allProblemsTags = await prisma.problem.findMany({
      select: {
        id: true,
        tags: { select: { tag: { select: { name: true } } } }
      }
    })
    
    const solvedProblemIds = new Set(solvedSubmissions.map(sub => sub.problemId))
    const skillMatrixMap = new Map()
    
    allProblemsTags.forEach(p => {
      const isSolved = solvedProblemIds.has(p.id)
      p.tags.forEach(t => {
        const tagName = t.tag.name
        if (!skillMatrixMap.has(tagName)) {
          skillMatrixMap.set(tagName, { name: tagName, total: 0, solved: 0 })
        }
        const stat = skillMatrixMap.get(tagName)
        stat.total++
        if (isSolved) stat.solved++
      })
    })
    const skillMatrix = Array.from(skillMatrixMap.values()).filter(t => t.total > 0)

    return NextResponse.json({
      success: true,
      totalProblems,
      solvedProblems,
      submissions: {
        total: totalSubmissions,
        acceptanceRate: parseFloat(acceptanceRate)
      },
      practiceHistory: recentSubmissions,
      allSubmissions: allSubmissionsForChart,
      skillMatrix
    })

  } catch (error) {
    console.error('Error fetching progress data:', error)
    return errorResponse('Failed to fetch progress data', 'INTERNAL_SERVER_ERROR', 500)
  }
}
