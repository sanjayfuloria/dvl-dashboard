import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, password } = await req.json()
  if (!userId || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const hash = await bcrypt.hash(password, 12)

  await prisma.userPassword.upsert({
    where: { userId },
    update: { hash },
    create: { userId, hash },
  })

  return NextResponse.json({ ok: true })
}
