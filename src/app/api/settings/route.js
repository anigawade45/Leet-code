import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'
import { hashPassword, comparePassword } from '@/lib/auth'
import { getRedisConnection } from '@/lib/redis'

// Helper to authenticate user
async function authenticateUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const payload = verifyToken(token)
  if (!payload) return null
  return prisma.user.findUnique({ where: { id: payload.userId } })
}

export async function PATCH(request) {
  try {
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const body = await request.json()
    const { action } = body

    if (action === 'update_username') {
      const { newUsername } = body
      if (!newUsername || newUsername.length < 3 || newUsername.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
        return errorResponse('Invalid username format', 'VALIDATION_ERROR', 400)
      }

      // Check 90-day cooldown
      if (user.usernameUpdatedAt) {
        const lastUpdated = new Date(user.usernameUpdatedAt).getTime()
        const now = Date.now()
        const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24)
        if (daysSinceUpdate < 90) {
          return errorResponse('You can only change your username once every 90 days.', 'COOLDOWN_ERROR', 400)
        }
      }

      const existingUser = await prisma.user.findUnique({ where: { username: newUsername } })
      if (existingUser && existingUser.id !== user.id) {
        return errorResponse('Username is already taken', 'VALIDATION_ERROR', 400)
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          username: newUsername,
          usernameUpdatedAt: new Date()
        }
      })

      // Invalidate cache
      const redisClient = await getRedisConnection()
      await redisClient.del(`user:${user.username}`)
      await redisClient.del(`user:${newUsername}`)

      return NextResponse.json({ success: true, message: 'Username updated successfully' })
    }

    if (action === 'update_password') {
      const { currentPassword, newPassword } = body
      
      if (!newPassword || newPassword.length < 8) {
        return errorResponse('Password must be at least 8 characters long', 'VALIDATION_ERROR', 400)
      }

      // Fetch the stored hash — authenticateUser() intentionally omits password
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true }
      })

      const isPasswordValid = await comparePassword(currentPassword, userWithPassword.password)
      if (!isPasswordValid) {
        return errorResponse('Incorrect current password', 'VALIDATION_ERROR', 400)
      }

      const newHashedPassword = await hashPassword(newPassword)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHashedPassword }
      })

      return NextResponse.json({ success: true, message: 'Password updated successfully' })
    }

    if (action === 'update_privacy') {
      const { hideFollowingList, hideFollowerList } = body
      
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          hideFollowingList: Boolean(hideFollowingList),
          hideFollowerList: Boolean(hideFollowerList)
        }
      })

      const redisClient = await getRedisConnection()
      await redisClient.del(`user:${user.username}`)

      return NextResponse.json({ success: true, message: 'Privacy settings updated successfully' })
    }

    return errorResponse('Invalid action', 'VALIDATION_ERROR', 400)

  } catch (error) {
    console.error('Settings PATCH error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}

export async function DELETE(request) {
  try {
    const user = await authenticateUser()
    if (!user) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Delete user (Prisma cascade should handle related records if configured, otherwise we might need a transaction)
    // For now, we will attempt to delete the user.
    await prisma.user.delete({
      where: { id: user.id }
    })

    // Invalidate cache — use userId, not email (email is PII)
    const redisClient = await getRedisConnection()
    await redisClient.del(`user:${user.username}`)
    await redisClient.del(`user:${user.id}`)

    // Clear auth cookie
    const cookieStore = await cookies()
    cookieStore.delete('token')

    return NextResponse.json({ success: true, message: 'Account deleted successfully' })

  } catch (error) {
    console.error('Settings DELETE error:', error)
    return errorResponse('Internal server error', 'SERVER_ERROR', 500)
  }
}
