import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { SubmissionService } from '@/services/submission.service'
import SubmissionsListClient from './SubmissionsListClient'

export const metadata = {
  title: 'Submission History - LeetCode Clone',
  description: 'View your coding submission history and runtime execution statistics.',
}

export default async function SubmissionsPage({ searchParams }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) {
    return <SubmissionsListClient initialSubmissions={[]} initialPagination={{ page: 1, limit: 20, totalPages: 1 }} />
  }

  const payload = verifyToken(token)
  if (!payload) {
    return <SubmissionsListClient initialSubmissions={[]} initialPagination={{ page: 1, limit: 20, totalPages: 1 }} />
  }

  const { page = 1, limit = 20 } = await searchParams || {}
  const parsedPage = parseInt(page, 10) || 1
  const parsedLimit = parseInt(limit, 10) || 20

  const result = await SubmissionService.getUserSubmissions(payload.userId, parsedPage, parsedLimit)

  // Prisma DateTime and other fields need to be JSON-serializable for client components
  const serialized = JSON.parse(JSON.stringify(result.data))
  const pagination = JSON.parse(JSON.stringify(result.pagination))

  return <SubmissionsListClient initialSubmissions={serialized} initialPagination={pagination} />
}
