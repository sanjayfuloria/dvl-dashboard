import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['ADMIN','FACULTY'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // NOTE: the admin UI posts `studentId` (StudentProfile.id) — this used to
  // be destructured as `studentProfileId`, which never matched, so every
  // assign/reassign from the admin panel silently 400'd as "Missing fields".
  const { studentId: studentProfileId, teamId, teamRole } = await req.json()
  if (!studentProfileId || !teamId)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // A student can be on one team per course at once (e.g. MDT-A and
  // MPB-B simultaneously). Only replace the existing membership for THIS
  // course — deleting every membership regardless of course would silently
  // kick the student off their other course's team.
  await prisma.teamMember.deleteMany({
    where: { studentProfileId, team: { course: team.course } },
  })
  const member = await prisma.teamMember.create({
    data: { teamId, studentProfileId, role: teamRole ?? 'Member' }
  })
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId }, include: { user: true }
  })
  if (profile) await prisma.notification.create({ data: {
    userId: profile.userId, title: 'Team Assignment',
    message: `You have been assigned to team "${team.name}" (${team.course}) by your instructor.`,
    link: '/team',
  }})
  return NextResponse.json({ ok: true, member })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || !['ADMIN','FACULTY'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // teamId scopes the removal to one specific team membership, so removing
  // a student from their MDT team doesn't also remove their MPB team.
  const { studentId: studentProfileId, teamId } = await req.json()
  if (!studentProfileId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await prisma.teamMember.deleteMany({
    where: teamId ? { studentProfileId, teamId } : { studentProfileId },
  })
  return NextResponse.json({ ok: true })
}
