import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { createTeamDriveFolder } from '@/lib/google-drive'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'STUDENT')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const scope = req.nextUrl.searchParams.get('scope') ?? 'section'

  const sp = await prisma.studentProfile.findUnique({
    where: { userId: session.id },
    include: { teamMembers: { include: { team: { include: { members: true } } } } }
  })
  if (!sp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const myTeamMember = sp.teamMembers[0] ?? null
  const myTeam = myTeamMember?.team ?? null
  const isIndividual = myTeam?.name.startsWith('__INDIVIDUAL__') ?? false

  const allTeams = await prisma.team.findMany({
    where: { NOT: { name: { startsWith: '__INDIVIDUAL__' } } },
    include: { members: { include: { student: { include: { user: { select: { name: true } } } } } } },
    orderBy: { createdAt: 'desc' }
  })

  // Filter by scope
  const scopeFiltered = scope === 'section'
    ? allTeams.filter(t => t.course === sp.dvlCourse || t.course === (sp.section?.split('-')[0]))
    : allTeams

  // Open = not full (< 5 members), and student not already in it
  const openTeams = scopeFiltered.filter(t =>
    t.members.length < 5 && !t.members.find(m => m.studentProfileId === sp.id)
  )

  return NextResponse.json({
    myTeam: myTeam ? {
      id: myTeam.id,
      name: myTeam.name,
      isIndividual,
      course: myTeam.course,
      memberCount: myTeam.members.length,
    } : null,
    openTeams: openTeams.map(t => ({
      id: t.id, name: t.name, course: t.course,
      sector: t.sector, ventureName: t.ventureName,
      memberCount: t.members.length,
      members: t.members.map(m => m.student.user.name),
    })),
    studentSection: sp.section,
    studentDvlCourse: sp.dvlCourse,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'STUDENT')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { action, teamId, teamName } = await req.json()

  const sp = await prisma.studentProfile.findUnique({
    where: { userId: session.id },
    include: { teamMembers: true }
  })
  if (!sp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Leave current team
  if (action === 'leave') {
    // If Team Lead and team has other members, block leave
    const membership = sp.teamMembers[0]
    if (membership) {
      const team = await prisma.team.findUnique({
        where: { id: membership.teamId },
        include: { members: true }
      })
      if (team && !team.name.startsWith('__INDIVIDUAL__') && membership.role === 'Team Lead' && team.members.length > 1) {
        return NextResponse.json({ error: 'You are the Team Lead. Transfer leadership or ask an admin to reassign before leaving.' }, { status: 400 })
      }
      await prisma.teamMember.deleteMany({ where: { studentProfileId: sp.id } })
      // If individual team or team is now empty, delete the team
      if (team && (team.name.startsWith('__INDIVIDUAL__') || team.members.length <= 1)) {
        await prisma.team.delete({ where: { id: team.id } }).catch(() => {})
      }
    }
    return NextResponse.json({ ok: true })
  }

  // Check not already in a team
  const alreadyInTeam = sp.teamMembers.length > 0
  if (alreadyInTeam && action !== 'leave') {
    return NextResponse.json({ error: 'You are already in a team. Leave your current team first.' }, { status: 400 })
  }

  if (action === 'individual') {
    const t = await prisma.team.create({
      data: {
        name: '__INDIVIDUAL__' + sp.id,
        course: (sp.dvlCourse ?? 'MDT') as any,
        members: { create: { studentProfileId: sp.id, role: 'Individual' } }
      }
    })
    return NextResponse.json({ ok: true, team: t })
  }

  if (action === 'join') {
    if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })
    const t = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } })
    if (!t) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    if (t.name.startsWith('__INDIVIDUAL__'))
      return NextResponse.json({ error: 'Cannot join an individual project' }, { status: 400 })
    if (t.members.length >= 5)
      return NextResponse.json({ error: 'This team is full (max 5 members)' }, { status: 400 })
    await prisma.teamMember.create({ data: { teamId, studentProfileId: sp.id, role: 'Member' } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'create') {
    if (!teamName?.trim()) return NextResponse.json({ error: 'Team name required' }, { status: 400 })
    const exists = await prisma.team.findFirst({ where: { name: teamName.trim() } })
    if (exists) return NextResponse.json({ error: 'That team name is already taken. Please choose another.' }, { status: 400 })
    let driveFolderId: string | null = null
    if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      driveFolderId = await createTeamDriveFolder(teamName.trim(), teamName.trim())
    }
    const t = await prisma.team.create({
      data: {
        name: teamName.trim(),
        course: (sp.dvlCourse ?? 'MDT') as any,
        driveFolderId,
        members: { create: { studentProfileId: sp.id, role: 'Team Lead' } }
      }
    })
    return NextResponse.json({ ok: true, team: t })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
