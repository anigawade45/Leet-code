import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Get today's date at midnight UTC
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Try to find an existing challenge for today
    let challenge = await prisma.dailyChallenge.findUnique({
      where: { date: today },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            problemNumber: true,
            _count: { select: { submissions: true } },
            submissions: {
              where: { status: 'ACCEPTED' },
              select: { id: true }
            }
          }
        }
      }
    })

    if (!challenge) {
      // Pick a random problem if none exists
      // In PostgreSQL, we can use a raw query or just fetch all IDs and pick one randomly
      const problems = await prisma.problem.findMany({ select: { id: true } })
      
      if (problems.length > 0) {
        const randomProblem = problems[Math.floor(Math.random() * problems.length)]
        
        challenge = await prisma.dailyChallenge.create({
          data: {
            date: today,
            problemId: randomProblem.id
          },
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                problemNumber: true,
                _count: { select: { submissions: true } },
                submissions: {
                  where: { status: 'ACCEPTED' },
                  select: { id: true }
                }
              }
            }
          }
        })
      }
    }

    if (!challenge) {
      return NextResponse.json({ error: 'No problems available' }, { status: 404 })
    }

    // Format the problem data similarly to how ProblemTable expects it
    const problem = challenge.problem
    const totalSubmissions = problem._count.submissions
    const acceptedSubmissions = problem.submissions.length
    const acceptanceRate = totalSubmissions > 0 
      ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1) 
      : '0.0'

    return NextResponse.json({
      dailyChallenge: {
        id: challenge.id,
        date: challenge.date,
        problem: {
          id: problem.id,
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          problemNumber: problem.problemNumber,
          acceptanceRate: parseFloat(acceptanceRate)
        }
      }
    })

  } catch (error) {
    console.error('Failed to fetch daily challenge:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
