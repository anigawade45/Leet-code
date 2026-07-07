import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
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
      where: { id }
    })

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    const now = new Date()
    
    // Only allow access to problems if the contest has started
    if (now < contest.startTime) {
      // If it's the author, allow access
      if (contest.createdBy !== userId) {
        return NextResponse.json({ error: 'Contest has not started yet' }, { status: 403 })
      }
    }

    // Check if user is registered if the contest is active
    if (now >= contest.startTime && now <= contest.endTime) {
      if (!userId) {
        return NextResponse.json({ error: 'Must be logged in and registered to view live problems' }, { status: 403 })
      }
      const participant = await prisma.contestParticipant.findUnique({
        where: { contestId_userId: { contestId: id, userId } }
      })
      if (!participant && contest.createdBy !== userId) {
        return NextResponse.json({ error: 'Must register to view live problems' }, { status: 403 })
      }
    }

    // Get the problems mapped for the contest
    const contestProblems = await prisma.contestProblem.findMany({
      where: { contestId: id },
      orderBy: { order: 'asc' },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true
          }
        }
      }
    })

    // If the user is logged in, we should also fetch their contest submissions to mark as solved/attempted
    let userSubmissions = []
    if (userId) {
      userSubmissions = await prisma.contestSubmission.findMany({
        where: {
          contestId: id,
          userId
        },
        select: {
          problemId: true,
          status: true
        }
      })
    }

    const mappedProblems = contestProblems.map((cp, idx) => {
      const problemSubmissions = userSubmissions.filter(s => s.problemId === cp.problemId)
      const isSolved = problemSubmissions.some(s => s.status === 'ACCEPTED')
      const isAttempted = problemSubmissions.length > 0 && !isSolved

      return {
        ...cp.problem,
        order: cp.order,
        displayLetter: String.fromCharCode(65 + idx), // A, B, C, D...
        isSolved,
        isAttempted
      }
    })

    return NextResponse.json({ problems: mappedProblems })
  } catch (error) {
    console.error('Failed to fetch contest problems:', error)
    return NextResponse.json({ error: 'Failed to fetch contest problems' }, { status: 500 })
  }
}
