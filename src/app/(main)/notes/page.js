import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NotesClient } from './NotesClient'

export const metadata = {
  title: 'My Notes - LeetCode',
  description: 'Manage your problem notes',
}

export default async function NotesPage({ searchParams }) {
  const sp = await searchParams
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    redirect('/login')
  }

  const payload = verifyToken(token)
  if (!payload) {
    redirect('/login')
  }

  const page = parseInt(sp?.page) || 1
  const limit = 10
  const skip = (page - 1) * limit

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where: { userId: payload.userId },
      include: {
        problem: {
          select: {
            problemNumber: true,
            title: true,
            slug: true,
            difficulty: true,
            description: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.note.count({ where: { userId: payload.userId } })
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <NotesClient initialNotes={notes} totalPages={totalPages} currentPage={page} />
    </div>
  )
}
