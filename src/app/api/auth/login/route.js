import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { loginSchema } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { errorResponse } from '@/lib/api-response'
import { authCookieOptions } from '@/lib/jwt'

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(ip, 'login', 5, 60)

    if (!limitRes.success) {
      logger.warn({ ip, event: 'LOGIN_RATE_LIMIT' }, 'Login rate limit exceeded')
      return errorResponse('Too many login attempts, please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    const { user, token } = await AuthService.login(validatedData.identifier, validatedData.password)

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        streak: user.userStreak?.currentStreak || 0,
      },
    })

    response.cookies.set('token', token, authCookieOptions)

    logger.info({ userId: user.id, email: user.email, ip, event: 'USER_LOGIN_SUCCESS' }, 'User logged in successfully')
    return response
  } catch (error) {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    logger.warn({ ip, event: 'USER_LOGIN_FAILED', message: error.message }, 'Failed login attempt')

    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }

    return errorResponse(error.message || 'Login failed', 'BAD_REQUEST', 400)
  }
}
