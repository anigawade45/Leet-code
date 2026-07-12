import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

/**
 * Admin-only maintenance endpoint.
 * Marks all existing users as verified (one-time migration helper).
 * 
 * SECURITY: Requires a valid ADMIN-role JWT. Never expose this to public traffic.
 */
export async function GET() {
  try {
    // Require authenticated ADMIN role
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Forbidden', 'FORBIDDEN', 403)
    }

    const result = await prisma.user.updateMany({
      data: { isVerified: true }
    })
    return NextResponse.json({ success: true, message: `Verified ${result.count} existing users` })
  } catch (error) {
    console.error('Admin cleanup error:', error)
    return errorResponse('Cleanup operation failed', 'INTERNAL_SERVER_ERROR', 500)
  }
}
