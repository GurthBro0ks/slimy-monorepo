import { NextRequest, NextResponse } from 'next/server'
import argon2 from 'argon2'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8),
  inviteCode: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, inviteCode } = registerSchema.parse(body)

    let role = 'user' // Default role

    // Check if it's an admin invite code first
    const adminInvite = await db.adminInvite.findUnique({
      where: { code: inviteCode },
    })

    if (adminInvite) {
      // Validate admin invite
      if (adminInvite.expiresAt && adminInvite.expiresAt < new Date()) {
        return NextResponse.json(
          { error: { code: 'INVALID_INVITE', message: 'Admin invite has expired' } },
          { status: 400 }
        )
      }

      if (adminInvite.usedAt) {
        return NextResponse.json(
          { error: { code: 'INVALID_INVITE', message: 'Admin invite has already been used' } },
          { status: 400 }
        )
      }

      role = 'admin'
    } else {
      // Check if it's a regular user invite code
      const code = await db.chatRegistrationCode.findUnique({
        where: { code: inviteCode },
      })

      if (!code || (code.expiresAt && code.expiresAt < new Date()) || code.uses >= code.maxUses) {
        return NextResponse.json(
          { error: { code: 'INVALID_INVITE', message: 'Invalid or expired invite code' } },
          { status: 400 }
        )
      }
    }

    // Check if username taken
    const existingUser = await db.chatUser.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: { code: 'USERNAME_TAKEN', message: 'Username is already taken' } },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await argon2.hash(password)

    // Create user and update invite in a transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.chatUser.create({
        data: {
          username,
          passwordHash,
          role,
        },
      })

      // Mark admin invite as used
      if (role === 'admin' && adminInvite) {
        await tx.adminInvite.update({
          where: { id: adminInvite.id },
          data: {
            usedBy: newUser.id,
            usedAt: new Date(),
          },
        })
      }

      // Mark regular invite as used
      if (role === 'user') {
        const code = await tx.chatRegistrationCode.findUnique({
          where: { code: inviteCode },
        })
        if (code) {
          await tx.chatRegistrationCode.update({
            where: { id: code.id },
            data: {
              uses: { increment: 1 },
              usedBy: newUser.id,
              usedAt: new Date(),
            },
          })
        }
      }

      return newUser
    })

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
        role: user.role,
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

    console.error('[Chat Auth] Register error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } },
      { status: 500 }
    )
  }
}
