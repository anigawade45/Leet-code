import { ProblemService } from '@/services/problem.service'
import { ProblemForm } from '@/components/problem/ProblemForm'
import { verifyToken } from '@/lib/jwt'
import { UserRepository } from '@/repositories/user.repository'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminEditProblemPage({ searchParams: searchParamsPromise }) {
  const searchParams = await searchParamsPromise
  
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  let user = null
  
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      user = await UserRepository.findById(payload.userId)
    }
  }

  if (!user || user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Support both id and slug query parameters
  let problem = null;
  if (searchParams.id) {
    problem = await ProblemService.getProblemById(searchParams.id)
  } else if (searchParams.slug) {
    problem = await ProblemService.getProblemBySlug(searchParams.slug)
  }

  if (!problem) {
    return (
      <div className="flex-1 bg-background min-h-screen p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Problem Not Found</h1>
        <p className="text-muted-foreground">The problem you are trying to edit does not exist.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-background min-h-screen">
      <ProblemForm initialData={problem} />
    </div>
  )
}
