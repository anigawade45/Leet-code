import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { registerSchema } from '@/lib/validators'
import { errorResponse } from '@/lib/api-response'
import { authCookieOptions } from '@/lib/jwt'

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(ip, 'register', 5, 60)

    if (!limitRes.success) {
      return errorResponse('Too many registration attempts, please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    const { confirmPassword, ...dataForService } = validatedData

    const { user, message } = await AuthService.register(dataForService)

    const response = NextResponse.json({
      success: true,
      message,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        streak: user.userStreak?.currentStreak || 0,
      },
    })

    return response
  } catch (error) {
    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }
    return errorResponse(error.message || 'Registration failed', 'BAD_REQUEST', 400)
  }
}
