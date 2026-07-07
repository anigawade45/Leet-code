import { NextResponse } from 'next/server'
import { ProblemService } from '@/services/problem.service'
import { errorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const tags = await ProblemService.getAllTags()
    return NextResponse.json({ success: true, tags })
  } catch (error) {
    console.error('Get tags error:', error)
    return errorResponse('Failed to get tags', 'INTERNAL_SERVER_ERROR', 500)
  }
}
