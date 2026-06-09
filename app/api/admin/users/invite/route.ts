import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['STUDENT', 'FACULTY', 'MENTOR', 'ADMIN']),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email: data.data.email } })
  if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 })

  const user = await prisma.user.create({
    data: {
      email: data.data.email,
      name: data.data.name,
      role: data.data.role,
    },
  })

  // Auto-create role profile
  if (data.data.role === 'STUDENT') {
    await prisma.studentProfile.create({ data: { userId: user.id } })
  } else if (data.data.role === 'FACULTY') {
    await prisma.facultyProfile.create({ data: { userId: user.id } })
  } else if (data.data.role === 'MENTOR') {
    await prisma.mentorProfile.create({ data: { userId: user.id } })
  }

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
}
