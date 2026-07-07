import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { errorResponse } from '@/lib/api-response'

export async function POST(request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return errorResponse('Verification token is required', 'BAD_REQUEST', 400)
    }

    await AuthService.verifyEmail(token)

    return NextResponse.json({ success: true, message: 'Email verified successfully!' })
  } catch (error) {
    return errorResponse(error.message || 'Verification failed', 'BAD_REQUEST', 400)
  }
}
