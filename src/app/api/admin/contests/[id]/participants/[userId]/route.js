import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { errorResponse } from '@/lib/api-response'

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')
  if (!token) return null

  const payload = verifyToken(token.value)
  if (!payload) return null

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.role !== 'ADMIN') return null
    return user
  } catch (e) {
    return null
  }
}

export async function DELETE(request, { params }) {
  const admin = await checkAdmin()
  if (!admin) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

  const { id, userId } = await params

  try {
    await prisma.contestParticipant.delete({
      where: {
        contestId_userId: {
          contestId: id,
          userId: userId
        }
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse('Failed to remove participant', 'INTERNAL_SERVER_ERROR', 500)
  }
}
