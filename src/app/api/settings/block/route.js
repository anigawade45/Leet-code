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
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const blocks = await prisma.blockedUser.findMany({
      where: { blockerId: user.id },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    const blockedUsers = blocks.map(b => b.blocked)

    return NextResponse.json({ success: true, blockedUsers })
  } catch (error) {
    console.error('Get blocked users error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}

export async function POST(request) {
  try {
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const { username } = await request.json()

    if (!username) {
      return errorResponse('Username is required', 'VALIDATION_ERROR', 400)
    }

    if (username === user.username) {
      return errorResponse('You cannot block yourself', 'VALIDATION_ERROR', 400)
    }

    const targetUser = await prisma.user.findUnique({ where: { username } })
    if (!targetUser) {
      return errorResponse('User not found', 'NOT_FOUND', 404)
    }

    // Unfollow each other automatically if needed, skipping for now
    
    await prisma.blockedUser.create({
      data: {
        blockerId: user.id,
        blockedId: targetUser.id
      }
    })

    return NextResponse.json({ success: true, message: 'User blocked successfully' })
  } catch (error) {
    if (error.code === 'P2002') {
      return errorResponse('User is already blocked', 'VALIDATION_ERROR', 400)
    }
    console.error('Block user error:', error)
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

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId: user.id,
        blockedId: targetUserId
      }
    })

    return NextResponse.json({ success: true, message: 'User unblocked successfully' })
  } catch (error) {
    console.error('Unblock user error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}
