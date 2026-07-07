import { AdminProblemTable } from '@/components/admin/AdminProblemTable'
import { ProblemService } from '@/services/problem.service'

export default async function AdminProblemsPage() {
  const [problems, stats] = await Promise.all([
    ProblemService.getAllProblemsAdmin(),
    ProblemService.getStats()
  ])
  
  const serializedProblems = JSON.parse(JSON.stringify(problems))
  const serializedStats = JSON.parse(JSON.stringify(stats))
  
  return <AdminProblemTable initialData={serializedProblems} stats={serializedStats} />
}
