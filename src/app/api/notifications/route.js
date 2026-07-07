import { NextResponse } from 'next/server'
import { NotificationService } from '@/services/notification.service'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ success: true, notifications: [] })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ success: true, notifications: [] })

    const notifications = await NotificationService.getNotifications(payload.userId)
    return NextResponse.json({ success: true, notifications })
  } catch (error) {
    console.error('Get notifications error:', error)
    return errorResponse('Failed to fetch notifications', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    const payload = verifyToken(token)
    if (!payload) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)

    await NotificationService.clearNotifications(payload.userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear notifications error:', error)
    return errorResponse('Failed to clear notifications', 'INTERNAL_SERVER_ERROR', 500)
  }
}
