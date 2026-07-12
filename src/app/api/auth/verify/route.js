import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { errorResponse } from '@/lib/api-response'

export async function POST(request) {
  try {
    // Rate limit: 10 attempts per hour per IP to prevent token brute-force
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(ip, 'verify-email', 10, 3600)

    if (!limitRes.success) {
      return errorResponse('Too many verification attempts, please try again later.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string' || token.length > 256) {
      return errorResponse('Verification token is required', 'BAD_REQUEST', 400)
    }

    await AuthService.verifyEmail(token)

    return NextResponse.json({ success: true, message: 'Email verified successfully!' })
  } catch (error) {
    // Return a generic message — do NOT expose whether the token was expired vs. invalid
    return errorResponse('Verification failed. The link may have expired or already been used.', 'BAD_REQUEST', 400)
  }
}
