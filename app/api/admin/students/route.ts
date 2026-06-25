import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const students = await prisma.studentProfile.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      teamMembers: {
        include: { team: { select: { id: true, name: true, course: true } } },
        take: 1,
      },
    },
    orderBy: { user: { name: 'asc' } },
  })

  return NextResponse.json(students.map(s => ({
    id: s.id,
    userId: s.userId,
    name: s.user.name,
    email: s.user.email,
    enrollNo: s.enrollNo,
    section: s.section,
    dvlCourse: s.dvlCourse,
    team: s.teamMembers[0]?.team ?? null,
    teamRole: s.teamMembers[0]?.role ?? null,
  })))
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { userId, section, dvlCourse, secondarySections } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const updated = await prisma.studentProfile.update({
    where: { userId },
    data: {
      ...(section !== undefined && { section }),
      ...(dvlCourse !== undefined && { dvlCourse }),
      ...(secondarySections !== undefined && { secondarySections }),
    }
  })
  return NextResponse.json({ ok: true, updated })
}
