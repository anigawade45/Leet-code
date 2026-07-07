import { UserListSidebar } from '@/components/list/UserListSidebar'
import { UserListContent } from '@/components/list/UserListContent'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export async function generateMetadata({ params }) {
  const { username } = await params
  return {
    title: `${username}'s Favorite List - LeetCode`,
  }
}

export default async function ProblemListPage({ params }) {
  const { username: rawUsername } = await params
  const username = decodeURIComponent(rawUsername)

  const user = await prisma.user.findUnique({
    where: { username }
  })

  if (!user) {
    notFound()
  }

  let list = await prisma.userList.findUnique({
    where: { userId_title: { userId: user.id, title: 'Favorite' } },
    include: {
      problems: {
        include: {
          problem: {
            include: {
              _count: { select: { submissions: true } },
              submissions: {
                select: { status: true, userId: true }
              }
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
    // If they haven't favorited anything yet, mock an empty favorite list
    listData = {
      id: 'default-favorite',
      title: 'Favorite',
      username: user.username,
      problems: [],
      progress: {
        total: 0,
        solved: 0,
        easy: { solved: 0, total: 0 },
        medium: { solved: 0, total: 0 },
        hard: { solved: 0, total: 0 }
      }
    }
  } else {
    // Calculate stats
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
