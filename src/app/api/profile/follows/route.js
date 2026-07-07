import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

async function authenticateUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = verifyToken(token)
  if (!payload) return null
  return prisma.user.findUnique({ where: { id: payload.userId } })
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const type = searchParams.get('type') || 'followers' // 'followers' or 'following'

    if (!username) {
      return errorResponse('Username is required', 'VALIDATION_ERROR', 400)
    }

    const targetUser = await prisma.user.findUnique({ where: { username } })
    if (!targetUser) {
      return errorResponse('User not found', 'NOT_FOUND', 404)
    }

    let users = []

    if (type === 'followers') {
      if (targetUser.hideFollowerList) {
        // optionally check if requester is the user themselves
        const currentUser = await authenticateUser()
        if (!currentUser || currentUser.id !== targetUser.id) {
          return errorResponse('Follower list is hidden by the user', 'FORBIDDEN', 403)
        }
      }
      
      const follows = await prisma.follows.findMany({
        where: { followingId: targetUser.id },
        include: {
          follower: {
            select: { id: true, username: true, avatar: true }
          }
        }
      })
      users = follows.map(f => f.follower)
    } else {
      if (targetUser.hideFollowingList) {
        const currentUser = await authenticateUser()
        if (!currentUser || currentUser.id !== targetUser.id) {
          return errorResponse('Following list is hidden by the user', 'FORBIDDEN', 403)
        }
      }

      const follows = await prisma.follows.findMany({
        where: { followerId: targetUser.id },
        include: {
          following: {
            select: { id: true, username: true, avatar: true }
          }
        }
      })
      users = follows.map(f => f.following)
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error('Get follows error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return errorResponse('Target user ID is required', 'VALIDATION_ERROR', 400)
    }

    if (targetUserId === user.id) {
      return errorResponse('You cannot follow yourself', 'VALIDATION_ERROR', 400)
    }

    await prisma.follows.create({
      data: {
        followerId: user.id,
        followingId: targetUserId
      }
    })

    return NextResponse.json({ success: true, message: 'User followed successfully' })
  } catch (error) {
    if (error.code === 'P2002') {
      return errorResponse('Already following this user', 'VALIDATION_ERROR', 400)
    }
    console.error('Follow user error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return errorResponse('Target user ID is required', 'VALIDATION_ERROR', 400)
    }

    await prisma.follows.deleteMany({
      where: {
        followerId: user.id,
        followingId: targetUserId
      }
    })

    return NextResponse.json({ success: true, message: 'User unfollowed successfully' })
  } catch (error) {
    console.error('Unfollow user error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}
