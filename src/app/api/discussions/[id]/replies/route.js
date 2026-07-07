import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function GET(request, { params }) {
  try {
    const { id: parentId } = await params
    
    const cookieStore = await cookies()
    const token = cookieStore.get('token')
    let userId = null
    if (token) {
      const decoded = verifyToken(token.value)
      if (decoded) userId = decoded.userId
    }

    // Fetch all replies for this discussion thread
    const replies = await prisma.discussion.findMany({
      where: {
        parentId
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        ...(userId && {
          upvotesList: {
            where: { userId },
            select: { userId: true }
          }
        })
      }
    })

    const mappedReplies = replies.map(r => {
      const hasUpvoted = userId ? (r.upvotesList?.length > 0) : false
      const { upvotesList, ...rest } = r
      return { ...rest, hasUpvoted }
    })

    return NextResponse.json({ replies: mappedReplies })
  } catch (error) {
    console.error('Failed to fetch replies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    )
  }
}

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token.value)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { replySchema } = await import('@/lib/validators')
    const validatedData = replySchema.parse(body)

    const { content } = validatedData
    const { id: parentId } = await params

    // Verify parent exists
    const parentDiscussion = await prisma.discussion.findUnique({
      where: { id: parentId }
    })

    if (!parentDiscussion) {
      return NextResponse.json({ error: 'Parent discussion not found' }, { status: 404 })
    }

    const reply = await prisma.discussion.create({
      data: {
        content: content.trim(),
        problemId: parentDiscussion.problemId,
        userId: decoded.userId,
        parentId
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      }
    })

    // Notify the parent author if it's someone else replying
    if (parentDiscussion.userId !== decoded.userId) {
      try {
        const { NotificationService } = await import('@/services/notification.service.js')
        
        // Find problem slug to link to the discussion
        const problem = await prisma.problem.findUnique({
          where: { id: parentDiscussion.problemId }
        })

        await NotificationService.addNotification(
          parentDiscussion.userId,
          'New Reply',
          `${reply.user.username} replied to your discussion.`,
          'info',
          problem ? `/problems/${problem.slug}?tab=discussions` : null
        )
      } catch (e) {
        console.error('Failed to send reply notification:', e)
      }
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Failed to create reply:', error)
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    )
  }
}
