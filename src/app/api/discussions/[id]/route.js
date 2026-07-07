import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'

export async function PATCH(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token.value)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const { title, content } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    if (discussion.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedDiscussion = await prisma.discussion.update({
      where: { id },
      data: {
        title: title !== undefined ? (title ? title.trim() : null) : discussion.title,
        content: content.trim()
      }
    })

    return NextResponse.json({ discussion: updatedDiscussion })
  } catch (error) {
    console.error('Failed to update discussion:', error)
    return NextResponse.json(
      { error: 'Failed to update discussion' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token.value)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    const discussion = await prisma.discussion.findUnique({
      where: { id }
    })

    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 })
    }

    if (discussion.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.discussion.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete discussion:', error)
    return NextResponse.json(
      { error: 'Failed to delete discussion' },
      { status: 500 }
    )
  }
}
