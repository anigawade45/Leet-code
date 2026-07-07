import { NextResponse } from 'next/server'
import { AuthService } from '@/services/auth.service'
import { cookies } from 'next/headers'
import { errorResponse } from '@/lib/api-response'

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    
    if (!token) {
      return errorResponse('Not authenticated', 'UNAUTHORIZED', 401)
    }
    
    const user = await AuthService.verifyToken(token)
    
    if (!user) {
      return errorResponse('Invalid token', 'UNAUTHORIZED', 401)
    }

    let activeStreak = 0;
    let hasSolvedToday = false;
    if (user.userStreak) {
      const now = new Date();
      const lastSolved = new Date(user.userStreak.lastSolved);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastSolved >= yesterday) {
        activeStreak = user.userStreak.currentStreak;
      }
      if (lastSolved >= today) {
        hasSolvedToday = true;
      }
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        streak: activeStreak,
        hasSolvedToday,
      },
    })
  } catch (error) {
    return errorResponse('Failed to get user', 'INTERNAL_SERVER_ERROR', 500)
  }
}
