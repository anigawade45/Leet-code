import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    const contest = await prisma.contest.findUnique({
      where: { id }
    })

    if (!contest) {
      return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    }

    if (!contest.enableDiscussion) {
      return NextResponse.json({ error: 'Discussions are disabled for this contest' }, { status: 403 })
    }

    const discussions = await prisma.contestDiscussion.findMany({
      where: { 
        contestId: id,
        parentId: null 
      },
      include: {
        user: { select: { username: true, avatar: true } },
        replies: {
          include: {
            user: { select: { username: true, avatar: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ discussions })
  } catch (error) {
    console.error('Failed to fetch contest discussions:', error)
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token.value)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const contest = await prisma.contest.findUnique({ where: { id } })
    if (!contest) return NextResponse.json({ error: 'Contest not found' }, { status: 404 })
    if (!contest.enableDiscussion) return NextResponse.json({ error: 'Discussions disabled' }, { status: 403 })

    const { content, parentId } = await request.json()
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const discussion = await prisma.contestDiscussion.create({
      data: {
        contestId: id,
        userId: decoded.userId,
        content: content.trim(),
        parentId: parentId || null
      },
      include: {
        user: { select: { username: true, avatar: true } }
      }
    })

    return NextResponse.json({ discussion }, { status: 201 })
  } catch (error) {
    console.error('Failed to create contest discussion:', error)
    return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 })
  }
}
