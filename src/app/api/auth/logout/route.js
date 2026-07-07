import { NextResponse } from 'next/server'
import { errorResponse } from '@/lib/api-response'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
    response.cookies.delete('token')
    return response
  } catch (error) {
    return errorResponse('Logout failed', 'INTERNAL_SERVER_ERROR', 500)
  }
}
