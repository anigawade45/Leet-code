import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const result = await prisma.user.updateMany({
      data: { isVerified: true }
    })
    return NextResponse.json({ success: true, message: `Verified ${result.count} existing users` })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
