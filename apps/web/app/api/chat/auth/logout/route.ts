import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie')
  let token: string | undefined

  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [n, v] = c.trim().split('=')
      acc[n] = v
      return acc
    }, {} as Record<string, string>)
    token = cookies['slimy_chat_token']
  }

  if (token) {
    await db.chatSession.deleteMany({
      where: { token },
    })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('slimy_chat_token')
  
  return response
}
