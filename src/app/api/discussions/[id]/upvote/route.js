import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function PATCH(request, { params }) {
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

    const { id } = await params
    const userId = decoded.userId

    // Check if the user already upvoted this discussion
    const existingUpvote = await prisma.discussionUpvote.findUnique({
      where: {
        userId_discussionId: {
          userId,
          discussionId: id
        }
      }
    })

    let updatedDiscussion
    let hasUpvoted = false

    if (existingUpvote) {
      // User has already upvoted, so we remove the upvote (toggle off)
      await prisma.discussionUpvote.delete({
        where: {
          userId_discussionId: {
            userId,
            discussionId: id
          }
        }
      })

      updatedDiscussion = await prisma.discussion.update({
        where: { id },
        data: {
          upvotes: { decrement: 1 }
        }
      })
      hasUpvoted = false
    } else {
      // User hasn't upvoted yet, so we create the upvote (toggle on)
      await prisma.discussionUpvote.create({
        data: {
          userId,
          discussionId: id
        }
      })

      updatedDiscussion = await prisma.discussion.update({
        where: { id },
        data: {
          upvotes: { increment: 1 }
        }
      })
      hasUpvoted = true
    }

    return NextResponse.json({ discussion: updatedDiscussion, hasUpvoted })
  } catch (error) {
    console.error('Failed to upvote discussion:', error)
    return NextResponse.json(
      { error: 'Failed to upvote discussion' },
      { status: 500 }
    )
  }
}
