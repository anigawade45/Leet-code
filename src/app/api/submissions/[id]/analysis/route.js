import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { cookies } from 'next/headers'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { errorResponse } from '@/lib/api-response'

// Helper to verify user
async function getUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  return verifyToken(token)
}

export async function GET(request, { params }) {
  try {
    const { id: submissionId } = await params
    const decoded = await getUser()

    if (!decoded) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    const { rateLimit } = await import('@/utils/rate-limit')
    const limitRes = await rateLimit(decoded.userId, 'ai-analysis', 5, 60) // 5 requests per minute
    
    if (!limitRes.success) {
      return errorResponse('Too many analysis requests. Please wait a minute and try again.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    const analysis = await prisma.submissionAnalysis.findUnique({
      where: { submissionId }
    })

    if (!analysis) {
      return errorResponse('Analysis not found', 'NOT_FOUND', 404)
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error("Error fetching analysis:", error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', 500)
  }
}

export async function POST(request, { params }) {
  try {
    const { id: submissionId } = await params
    const decoded = await getUser()

    if (!decoded) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401)
    }

    // Ensure the submission exists and belongs to the user
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { problem: true }
    })

    if (!submission) {
      return errorResponse('Submission not found', 'NOT_FOUND', 404)
    }

    if (submission.userId !== decoded.userId) {
      return errorResponse('Forbidden', 'FORBIDDEN', 403)
    }

    if (submission.status !== 'ACCEPTED') {
      return errorResponse('Can only analyze accepted submissions', 'BAD_REQUEST', 400)
    }

    // Check if an analysis already exists
    const existing = await prisma.submissionAnalysis.findUnique({
      where: { submissionId }
    })

    if (existing) {
      return NextResponse.json({ success: true, analysis: existing })
    }

    // Enforce 1-per-day limit
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const dailyCount = await prisma.submissionAnalysis.count({
      where: {
        userId: decoded.userId,
        createdAt: {
          gte: startOfDay
        }
      }
    })

    if (dailyCount >= 1) {
      return errorResponse('Daily limit reached. You can only use AI analysis once per day.', 'RATE_LIMIT_EXCEEDED', 429)
    }

    if (!process.env.GEMINI_API_KEY) {
      return errorResponse('AI features are currently unavailable (Missing API Key)', 'SERVICE_UNAVAILABLE', 503)
    }

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const prompt = `
You are an expert software engineer and technical interviewer evaluating code on LeetCode.
You are evaluating an accepted submission for the problem "${submission.problem.title}".

CRITICAL INSTRUCTION: Keep all text EXTREMELY concise, matching LeetCode's short analysis format. 
- Use 1 short sentence max for fields like 'suggestions', 'keyIdea', 'consider', 'structure'. 
- For 'current' and 'suggested' approach names, use a short forward-slash-separated list of techniques (e.g., 'Binary Search / Two Pointers') instead of paragraphs. 
- NEVER write long paragraphs. Be brief and to the point.

Problem Description:
${submission.problem.description}

User's Code (Language: ${submission.language}):
${submission.code}

Please analyze this code and return a JSON object with EXACTLY this structure:
{
  "approach": {
    "current": "string (e.g., 'Hash Table / Array')",
    "suggested": "string (e.g., 'Binary Search / Divide and Conquer')",
    "keyIdea": "string (1 sentence max)",
    "consider": "string (1 sentence max)"
  },
  "efficiency": {
    "currentComplexity": "string (e.g., 'O(M+N)')",
    "suggestedComplexity": "string (e.g., 'O(log(M+N))')",
    "suggestions": "string (1 sentence max)"
  },
  "codeStyle": {
    "readability": "string (e.g., 'Excellent', 'Good', 'Needs Improvement')",
    "structure": "string (1 sentence max)",
    "suggestions": "string (1 sentence max)"
  }
}
Do not include any markdown blocks around the JSON. Output only the raw JSON text. Do not wrap in \`\`\`json.
`

    const result = await model.generateContent(prompt)
    let text = result.response.text()
    
    // Parse JSON
    let parsedResult
    try {
      text = text.replace(/```json/g, '').replace(/```/g, '').trim()
      parsedResult = JSON.parse(text)
    } catch (e) {
      console.error("Failed to parse Gemini response:", text)
      return errorResponse('AI generated invalid formatting', 'INTERNAL_SERVER_ERROR', 500)
    }

    // Save to DB
    const newAnalysis = await prisma.submissionAnalysis.create({
      data: {
        submissionId,
        userId: decoded.userId,
        approach: parsedResult.approach,
        efficiency: parsedResult.efficiency,
        codeStyle: parsedResult.codeStyle
      }
    })

    return NextResponse.json({ success: true, analysis: newAnalysis })
  } catch (error) {
    console.error("AI Analysis error:", error)
    return errorResponse('Internal server error', 'INTERNAL_SERVER_ERROR', 500)
  }
}
