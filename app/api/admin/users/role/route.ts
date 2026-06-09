import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  userId: z.string(),
  role: z.enum(['STUDENT', 'FACULTY', 'MENTOR', 'ADMIN']),
})

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: data.data.userId },
    data: { role: data.data.role },
  })

  // Create role profile if it doesn't exist
  if (data.data.role === 'FACULTY') {
    await prisma.facultyProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
  } else if (data.data.role === 'MENTOR') {
    await prisma.mentorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
  } else if (data.data.role === 'STUDENT') {
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })
  }

  return NextResponse.json({ ok: true })
}
