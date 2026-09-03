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
      // No `take: 1` — a student can hold a team membership per DVL course
      // (e.g. one MDT team and one MPB team at once), so return all of them.
      teamMembers: {
        include: { team: { select: { id: true, name: true, course: true } } },
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
    teams: s.teamMembers.map(tm => ({
      teamMemberId: tm.id,
      role: tm.role,
      id: tm.team.id,
      name: tm.team.name,
      course: tm.team.course,
    })),
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
