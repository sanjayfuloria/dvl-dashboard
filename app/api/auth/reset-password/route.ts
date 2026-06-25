import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.purpose !== 'password-reset') throw new Error('Invalid token purpose')

    const hash = await bcrypt.hash(password, 10)
    await prisma.userPassword.upsert({
      where: { userId: payload.userId as string },
      update: { hash },
      create: { userId: payload.userId as string, hash },
    })
    return NextResponse.json({ ok: true })
  } catch(e: any) {
    return NextResponse.json({ error: 'Invalid or expired link. Please request a new one.' }, { status: 400 })
  }
}
