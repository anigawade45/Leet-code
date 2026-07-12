import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { loginSchema } from '@/lib/validators'
import { logger } from '@/lib/logger'
import { errorResponse } from '@/lib/api-response'
import { authCookieOptions } from '@/lib/jwt'
import { rateLimit, handleAuthBackoff, resetAuthBackoff } from '@/utils/rate-limit'

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
  let bodyIdentifier = ''

  try {
    // 1. IP-based general rate limit (Auth tier: stricter)
    const limitRes = await rateLimit(ip, 'login', 'auth')
    if (!limitRes.success) {
      logger.warn({ ip, event: 'LOGIN_RATE_LIMIT' }, 'Login rate limit exceeded')
      return errorResponse('Too many login attempts, please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const body = await request.json()
    const validatedData = loginSchema.parse(body)
    bodyIdentifier = validatedData.identifier

    // 2. Account-based backoff check (checks if this specific username/email is on backoff cooldown)
    const backoffCheck = await handleAuthBackoff(bodyIdentifier, 'login')
    if (backoffCheck.blocked) {
      logger.warn({ identifier: bodyIdentifier, ip, event: 'LOGIN_ACCOUNT_BACKOFF' }, 'Login blocked due to exponential backoff')
      return errorResponse(`Too many failed attempts. Please try again in ${backoffCheck.remainingCooldown} seconds.`, 'RATE_LIMIT_EXCEEDED', 429)
    }

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

    // Successful login: Reset failures count for both the IP and Account ID
    await resetAuthBackoff(bodyIdentifier, 'login')
    await resetAuthBackoff(ip, 'login')

    logger.info({ userId: user.id, ip, event: 'USER_LOGIN_SUCCESS' }, 'User logged in successfully')
    return response
  } catch (error) {
    logger.warn({ ip, event: 'USER_LOGIN_FAILED' }, 'Failed login attempt')

    // Increment failures on login failures to trigger exponential backoff cooldowns
    if (bodyIdentifier) {
      await handleAuthBackoff(bodyIdentifier, 'login', true)
    }
    await handleAuthBackoff(ip, 'login', true)

    if (error.name === 'ZodError') {
      return errorResponse('Invalid input format', 'VALIDATION_ERROR', 400)
    }

    return errorResponse(error.message || 'Login failed', 'BAD_REQUEST', 400)
  }
}
