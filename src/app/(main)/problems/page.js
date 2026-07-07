import { ProblemTable } from '@/components/problem/ProblemTable'
import { ProblemService } from '@/services/problem.service'

export const metadata = {
  title: 'Problems - LeetCode Clone',
  description: 'Browse and filter coding problems by difficulty, tags, and more.',
}

import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export default async function ProblemsPage() {
  const [problemResult, tags] = await Promise.all([
    ProblemService.getAllProblems({ page: 1, limit: 50 }),
    ProblemService.getAllTags(),
  ])

  let currentUserId = null
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (token) {
      const decoded = await verifyToken(token)
      currentUserId = decoded.userId
    }
  } catch (e) {
    // ignore
  }

  const mappedProblems = problemResult.data.map(p => {
    const isSolved = currentUserId 
      ? p.submissions?.some(s => s.userId === currentUserId && s.status === 'ACCEPTED') || false
      : false
    return { ...p, isSolved }
  })

  const serializedProblems = JSON.parse(JSON.stringify(mappedProblems))
  const serializedPagination = JSON.parse(JSON.stringify(problemResult.pagination))
  const serializedTags = JSON.parse(JSON.stringify(tags))
  return <ProblemTable initialProblems={serializedProblems} initialPagination={serializedPagination} initialTags={serializedTags} />
}
