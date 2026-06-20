import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['ADMIN','FACULTY'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { studentProfileId, teamId, teamRole } = await req.json()
  if (!studentProfileId || !teamId)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await prisma.teamMember.deleteMany({ where: { studentProfileId } })
  const member = await prisma.teamMember.create({
    data: { teamId, studentProfileId, role: teamRole ?? 'Member' }
  })
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId }, include: { user: true }
  })
  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (profile && team) await prisma.notification.create({ data: {
    userId: profile.userId, title: 'Team Assignment',
    message: `You have been assigned to team "${team.name}" by your instructor.`,
    link: '/team',
  }})
  return NextResponse.json({ ok: true, member })
}
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || !['ADMIN','FACULTY'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { studentProfileId } = await req.json()
  await prisma.teamMember.deleteMany({ where: { studentProfileId } })
  return NextResponse.json({ ok: true })
}
