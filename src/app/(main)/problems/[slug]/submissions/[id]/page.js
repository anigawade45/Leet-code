import { Suspense } from 'react'
import { ProblemDetail } from '@/components/problem/ProblemDetail'
import { ProblemService } from '@/services/problem.service'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function generateMetadata({ params }) {
  try {
    const { id } = await params
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { problem: true }
    })
    if (!submission) return { title: 'Submission Detail - LeetCode Clone' }
    return {
      title: `Submission for ${submission.problem.title} - LeetCode Clone`,
      description: `View submission details, runtime statistics (${submission.runtime} ms), and code.`,
    }
  } catch (e) {
    return {
      title: 'Submission Detail - LeetCode Clone'
    }
  }
}

export default async function SubmissionPage({ params }) {
  const { slug, id } = await params
  const problem = await ProblemService.getProblemBySlug(slug)
  const serializedProblem = JSON.parse(JSON.stringify(problem))

  const submissionDetail = await prisma.submission.findUnique({
    where: { id },
    include: {
      problem: {
        select: {
          title: true,
          slug: true,
          problemNumber: true,
          id: true
        }
      }
    }
  })
  const serializedDetail = JSON.parse(JSON.stringify(submissionDetail))

  // Prefetch user submissions list
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  let userSubmissions = []
  
  if (token) {
    const payload = verifyToken(token)
    if (payload && problem) {
      userSubmissions = await prisma.submission.findMany({
        where: {
          userId: payload.userId,
          problemId: problem.id
        },
        orderBy: { createdAt: 'desc' }
      })
    }
  }

  const serializedSubmissions = JSON.parse(JSON.stringify(userSubmissions))

  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
        <div className="w-12 h-12 border-4 border-[#2d2d2d] border-t-[#2a9d8f] rounded-full animate-spin"></div>
      </div>
    }>
      <ProblemDetail
        initialProblem={serializedProblem}
        initialSubmissions={serializedSubmissions}
        initialSubmissionDetail={serializedDetail}
      />
    </Suspense>
  )
}
