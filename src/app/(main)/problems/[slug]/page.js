import { Suspense } from 'react'
import { ProblemDetail } from '@/components/problem/ProblemDetail'
import { ProblemService } from '@/services/problem.service'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params
    const problem = await ProblemService.getProblemBySlug(slug)
    return {
      title: `${problem.title} - LeetCode Clone`,
      description: problem.description ? problem.description.replace(/<[^>]*>/g, '').substring(0, 150) : "Solve coding problems!",
    }
  } catch (e) {
    return {
      title: "Problem Detail - LeetCode Clone"
    }
  }
}

export default async function ProblemPage({ params }) {
  const { slug } = await params
  const problem = await ProblemService.getProblemBySlug(slug)
  const serialized = JSON.parse(JSON.stringify(problem))

  // Prefetch submissions if authenticated
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
      <ProblemDetail initialProblem={serialized} initialSubmissions={serializedSubmissions} />
    </Suspense>
  )
}
