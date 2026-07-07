import { UserListSidebar } from '@/components/list/UserListSidebar'
import { UserListContent } from '@/components/list/UserListContent'
import { ProblemService } from '@/services/problem.service'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ProblemListClient } from './ProblemListClient'

export async function generateMetadata({ params }) {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  
  // Quick check to see if it's a user
  const user = await prisma.user.findUnique({ where: { username: decodedTag } })
  if (user) {
    return { title: `${user.username}'s Favorite List - LeetCode` }
  }
  
  return {
    title: 'Problem List - LeetCode Clone',
    description: 'View problems for a specific topic.',
  }
}

export default async function ProblemListPage({ params }) {
  const { tag: rawTag } = await params
  const tag = decodeURIComponent(rawTag)

  // 1. Try to fetch User (User Favorite List route)
  const user = await prisma.user.findUnique({
    where: { username: tag }
  })

  if (user) {
    // === USER LIST LOGIC ===
    let list = await prisma.userList.findUnique({
      where: { userId_title: { userId: user.id, title: 'Favorite' } },
      include: {
        problems: {
          include: {
            problem: {
              include: {
                _count: { select: { submissions: true } },
                submissions: { select: { status: true, userId: true } }
              }
            }
          },
          orderBy: { addedAt: 'desc' }
        }
      }
    })

    let problems = []
    let listData = null

    if (!list) {
      listData = {
        id: 'default-favorite',
        title: 'Favorite',
        username: user.username,
        problems: [],
        progress: { total: 0, solved: 0, easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } }
      }
    } else {
      let solvedCount = 0
      let easyTotal = 0, medTotal = 0, hardTotal = 0
      let easySolved = 0, medSolved = 0, hardSolved = 0

      problems = list.problems.map(lp => {
        const p = lp.problem;
        const isSolved = p.submissions?.some(s => s.userId === user.id && s.status === 'ACCEPTED')
        
        if (isSolved) solvedCount++
        if (p.difficulty === 'EASY') {
          easyTotal++
          if (isSolved) easySolved++
        } else if (p.difficulty === 'MEDIUM') {
          medTotal++
          if (isSolved) medSolved++
        } else if (p.difficulty === 'HARD') {
          hardTotal++
          if (isSolved) hardSolved++
        }

        let acceptanceRate = 0
        if (p.submissions && p._count?.submissions > 0) {
          const total = p._count.submissions
          const accepted = p.submissions.filter(s => s.status === 'ACCEPTED').length
          acceptanceRate = (accepted / total) * 100
        }

        return {
          id: p.id,
          problemNumber: p.problemNumber,
          title: p.title,
          slug: p.slug,
          difficulty: p.difficulty,
          isSolved,
          addedAt: lp.addedAt,
          acceptanceRate
        }
      })

      const progress = {
        total: problems.length,
        solved: solvedCount,
        easy: { solved: easySolved, total: easyTotal },
        medium: { solved: medSolved, total: medTotal },
        hard: { solved: hardSolved, total: hardTotal }
      }

      listData = {
        id: list.id,
        title: list.title,
        username: user.username,
        problems,
        progress
      }
    }

    return (
      <div className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-8 flex gap-8 items-start">
        <UserListSidebar list={listData} />
        <UserListContent list={listData} />
      </div>
    )
  }

  // 2. Try to fetch Tag (Tag Problem List route)
  const tagName = tag.replace(/-/g, ' ')
  const dbTag = await prisma.tag.findFirst({
    where: { name: { equals: tagName, mode: 'insensitive' } }
  })
  
  if (dbTag) {
    // === TAG PROBLEM LIST LOGIC ===
    const problemResult = await ProblemService.getAllProblems({ tagIds: [dbTag.id], limit: 1000 })
    
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

    const total = mappedProblems.length
    const solved = mappedProblems.filter(p => p.isSolved).length
    
    const stats = {
      total,
      solved,
      easy: { total: mappedProblems.filter(p => p.difficulty === 'EASY').length, solved: mappedProblems.filter(p => p.difficulty === 'EASY' && p.isSolved).length },
      med: { total: mappedProblems.filter(p => p.difficulty === 'MEDIUM').length, solved: mappedProblems.filter(p => p.difficulty === 'MEDIUM' && p.isSolved).length },
      hard: { total: mappedProblems.filter(p => p.difficulty === 'HARD').length, solved: mappedProblems.filter(p => p.difficulty === 'HARD' && p.isSolved).length }
    }

    const serializedProblems = JSON.parse(JSON.stringify(mappedProblems))
    const serializedTag = JSON.parse(JSON.stringify(dbTag))

    return (
      <ProblemListClient 
        tag={serializedTag} 
        problems={serializedProblems}
        stats={stats}
      />
    )
  }

  // 3. Neither User nor Tag found
  return notFound()
}
