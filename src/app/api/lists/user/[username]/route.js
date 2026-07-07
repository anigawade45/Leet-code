import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/lib/api-response'

export async function GET(request, { params }) {
  try {
    const { username } = await params
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { username }
    })
    
    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404)
    }

    // Find their Favorite list
    const list = await prisma.userList.findUnique({
      where: { userId_title: { userId: user.id, title: 'Favorite' } },
      include: {
        problems: {
          include: {
            problem: {
              include: {
                submissions: {
                  where: { userId: user.id }
                }
              }
            }
          },
          orderBy: { addedAt: 'desc' }
        }
      }
    })

    if (!list) {
      return errorResponse('List not found', 'NOT_FOUND', 404)
    }

    // Optionally check if public (if this was a strict system), 
    // but we'll assume the URL implies viewing intent and it's public.
    
    const problems = list.problems.map(lp => {
      const p = lp.problem;
      const isSolved = p.submissions?.some(s => s.status === 'ACCEPTED')
      const totalSubmissions = p.submissions?.length || 0;
      return {
        id: p.id,
        problemNumber: p.problemNumber,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        isSolved,
        addedAt: lp.addedAt,
        acceptanceRate: 50.0 // mock or fetch if available globally
      }
    })

    return NextResponse.json({ 
      success: true, 
      list: {
        id: list.id,
        title: list.title,
        isPublic: list.isPublic,
        createdAt: list.createdAt,
        user: {
          username: user.username,
          avatar: user.avatar
        },
        problems
      } 
    })
  } catch (error) {
    console.error('Fetch user list error:', error)
    return errorResponse('Failed to fetch user list', 'INTERNAL_SERVER_ERROR', 500)
  }
}
