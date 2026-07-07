import { ProblemDetail } from '@/components/problem/ProblemDetail'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ContestProblemPage({ params }) {
  const { id: contestId, problemSlug } = await params

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    include: {
      testCases: true,
      dailyChallenges: true
    }
  })

  if (!problem) {
    notFound()
  }

  // Also verify that the problem is part of the contest
  const contestProblem = await prisma.contestProblem.findFirst({
    where: { contestId, problemId: problem.id }
  })

  if (!contestProblem) {
    notFound()
  }

  // In a real scenario we might prefetch user submissions, but client-side can also fetch them
  return (
    <ProblemDetail 
      initialProblem={problem} 
      initialSubmissions={[]}
      contestId={contestId}
    />
  )
}
