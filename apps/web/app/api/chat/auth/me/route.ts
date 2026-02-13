import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyChatAuth, unauthorizedResponse } from '@/lib/chat/auth'

export async function GET(request: NextRequest) {
  const auth = await verifyChatAuth(request)
  
  if (!auth.valid) {
    return unauthorizedResponse(auth.error)
  }

  const user = await db.chatUser.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      username: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) {
    return unauthorizedResponse('User not found')
  }

  return NextResponse.json({ user: { id: user.id, username: user.username, role: user.role } })
}
