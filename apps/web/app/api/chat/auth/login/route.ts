import { NextRequest, NextResponse } from 'next/server'
import argon2 from 'argon2'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = loginSchema.parse(body)

    // Find chat user
    const user = await db.chatUser.findUnique({
      where: { username },
    })

    if (!user) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, password)

    if (!isValid) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password' } },
        { status: 401 }
      )
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await db.chatSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
      token,
    })

    // Set cookie
    response.cookies.set('slimy_chat_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      )
    }

    console.error('[Chat Auth] Login error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Login failed' } },
      { status: 500 }
    )
  }
}
