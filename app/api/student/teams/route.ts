import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { createTeamDriveFolder } from '@/lib/google-drive'
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'STUDENT')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const sp = await prisma.studentProfile.findUnique({
    where: { userId: session.id },
    include: { teamMembers: { include: { team: true } } }
  })
  if (!sp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  const myTeam = sp.teamMembers[0]?.team ?? null
  const teams = await prisma.team.findMany({
    include: { members: { include: { student: { include: { user: { select: { name:true } } } } } } },
    orderBy: { createdAt: 'desc' }
  })
  const open = teams.filter(t => !t.name.startsWith('__INDIVIDUAL__') && t.members.length < 5)
  return NextResponse.json({
    myTeam: myTeam ? { id:myTeam.id, name:myTeam.name,
      isIndividual:myTeam.name.startsWith('__INDIVIDUAL__'),
      course:myTeam.course, memberCount:0 } : null,
    openTeams: open.map(t => ({ id:t.id, name:t.name, course:t.course,
      sector:t.sector, ventureName:t.ventureName, memberCount:t.members.length,
      members:t.members.map(m => m.student.user.name) })),
    studentSection: sp.section, studentDvlCourse: sp.dvlCourse,
  })
}
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'STUDENT')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { action, teamId, teamName } = await req.json()
  const sp = await prisma.studentProfile.findUnique({ where: { userId: session.id } })
  if (!sp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (action === 'leave') {
    await prisma.teamMember.deleteMany({ where: { studentProfileId: sp.id } })
    return NextResponse.json({ ok: true })
  }
  await prisma.teamMember.deleteMany({ where: { studentProfileId: sp.id } })
  if (action === 'individual') {
    const t = await prisma.team.create({ data: {
      name: `__INDIVIDUAL__${sp.id}`, course: (sp.dvlCourse ?? 'MDT') as any,
      members: { create: { studentProfileId: sp.id, role: 'Individual' } }
    }})
    return NextResponse.json({ ok: true, team: t })
  }
  if (action === 'join') {
    if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })
    const t = await prisma.team.findUnique({ where: { id:teamId }, include: { members: true } })
    if (!t) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (t.members.length >= 5) return NextResponse.json({ error: 'Team full' }, { status: 400 })
    await prisma.teamMember.create({ data: { teamId, studentProfileId: sp.id, role: 'Member' } })
    return NextResponse.json({ ok: true })
  }
  if (action === 'create') {
    if (!teamName?.trim()) return NextResponse.json({ error: 'Team name required' }, { status: 400 })
    const exists = await prisma.team.findFirst({ where: { name: teamName.trim() } })
    if (exists) return NextResponse.json({ error: 'Name already taken' }, { status: 400 })
    let driveFolderId: string | null = null
    if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      driveFolderId = await createTeamDriveFolder(teamName.trim(), teamName.trim())
    }
    const t = await prisma.team.create({ data: {
      name: teamName.trim(), course: (sp.dvlCourse ?? 'MDT') as any,
      driveFolderId,
      members: { create: { studentProfileId: sp.id, role: 'Team Lead' } }
    }})
    return NextResponse.json({ ok: true, team: t })
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
