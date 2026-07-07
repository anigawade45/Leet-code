import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { problems: true }
        }
      }
    })

    const formattedCompanies = companies.map(c => ({
      id: c.id,
      name: c.name,
      count: c._count?.problems || 0
    })).sort((a, b) => b.count - a.count)

    return NextResponse.json({ success: true, companies: formattedCompanies })
  } catch (error) {
    console.error('Failed to fetch companies:', error)
    return errorResponse('Failed to fetch companies', 'INTERNAL_SERVER_ERROR', 500)
  }
}
