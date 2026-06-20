import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
export async function GET() {
  const session = await getSession()
  if (!session || !['ADMIN','FACULTY'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const students = await prisma.studentProfile.findMany({
    select: {
      id: true, userId: true, enrollNo: true, section: true, dvlCourse: true,
      user: { select: { id:true, name:true, email:true } },
      teamMembers: { include: { team: { select: { id:true, name:true, course:true } } } }
    },
    orderBy: { user: { name: 'asc' } }
  })
  return NextResponse.json(students.map(s => ({
    id: s.id, userId: s.userId, name: s.user.name, email: s.user.email,
    enrollNo: s.enrollNo, section: s.section, dvlCourse: s.dvlCourse,
    team: s.teamMembers[0]?.team ?? null, teamRole: s.teamMembers[0]?.role ?? null,
  })))
}
