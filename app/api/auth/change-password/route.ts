import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const user = await getSession()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  const userWithPwd = await prisma.user.findUnique({
    where: { id: user.id },
    include: { password: true },
  })

  if (!userWithPwd?.password) {
    return NextResponse.json({ error: 'No password set' }, { status: 400 })
  }

  const valid = await bcrypt.compare(currentPassword, userWithPwd.password.hash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.userPassword.update({
    where: { userId: user.id },
    data: { hash },
  })

  return NextResponse.json({ ok: true })
}
