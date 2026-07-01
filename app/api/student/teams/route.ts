import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { createTeamDriveFolder } from '@/lib/google-drive'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'STUDENT')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const scope = req.nextUrl.searchParams.get('scope') ?? 'section'
  const courseFilter = req.nextUrl.searchParams.get('course') ?? null

  const sp = await prisma.studentProfile.findUnique({
    where: { userId: session.id },
    include: { teamMembers: { include: { team: { include: { members: true } } } } }
  })
  if (!sp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const primarySlot = { section: sp.section ?? '', course: sp.dvlCourse ?? '' }
  const secondarySlots: { section: string; course: string }[] =
    Array.isArray(sp.secondarySections) ? (sp.secondarySections as any[]) : []

  const allSlots = [primarySlot, ...secondarySlots].filter(s => s.course)
  const uniqueSlots = allSlots.filter((s, i, arr) =>
    arr.findIndex(x => x.course === s.course && x.section === s.section) === i
  )

  // My teams keyed by course
  const myTeams: Record<string, any> = {}
  for (const tm of sp.teamMembers) {
    const t = tm.team
    myTeams[t.course] = {
      id: t.id, name: t.name,
      isIndividual: tm.role === 'Individual',
      course: t.course, memberCount: t.members.length,
      teamMemberId: tm.id, role: tm.role,
      driveFolderId: t.driveFolderId,
    }
  }

  const allTeams = await prisma.team.findMany({
    where: {
      NOT: { members: { some: { role: 'Individual' } } },
      ...(courseFilter ? { course: courseFilter as any } : {}),
    },
    include: { members: { include: { student: { include: { user: { select: { name: true } } } } } } },
    orderBy: { createdAt: 'desc' }
  })

  const openTeams = allTeams.filter(t => {
    if (t.members.length >= 5) return false
    if (t.members.find(m => m.studentProfileId === sp.id)) return false
    if (scope === 'section') {
      const slot = uniqueSlots.find(s => s.course === t.course)
      return !!slot
    }
    return true
  })

  return NextResponse.json({
    myTeams,
    slots: uniqueSlots,
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

  const { action, teamId, teamName, course } = await req.json()

  const sp = await prisma.studentProfile.findUnique({
    where: { userId: session.id },
    include: { teamMembers: { include: { team: { include: { members: true } } } } }
  })
  if (!sp) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const targetCourse = course ?? sp.dvlCourse ?? 'MDT'
  const currentTeam = sp.teamMembers.find(tm => tm.team.course === targetCourse)

  if (action === 'leave') {
    if (!currentTeam) return NextResponse.json({ error: 'Not in a team for this course' }, { status: 400 })
    const team = currentTeam.team
    const memberCount = team.members.length
    if (currentTeam.role !== 'Individual' && currentTeam.role === 'Team Lead' && memberCount > 1)
      return NextResponse.json({ error: 'You are the Team Lead. Ask an admin to reassign before leaving.' }, { status: 400 })
    await prisma.teamMember.delete({ where: { id: currentTeam.id } })
    const remaining = await prisma.teamMember.count({ where: { teamId: team.id } })
    if (remaining === 0) await prisma.team.delete({ where: { id: team.id } }).catch(() => {})
    return NextResponse.json({ ok: true })
  }

  if (currentTeam && action !== 'leave')
    return NextResponse.json({ error: `You already have a team for ${targetCourse}. Leave it first.` }, { status: 400 })

  if (action === 'individual') {
    if (!teamName?.trim()) return NextResponse.json({ error: 'Project name required' }, { status: 400 })
    const exists = await prisma.team.findFirst({ where: { name: teamName.trim() } })
    if (exists) return NextResponse.json({ error: 'That name is already taken. Please choose another.' }, { status: 400 })
    const t = await prisma.team.create({
      data: {
        name: teamName.trim(),
        course: targetCourse as any,
        members: { create: { studentProfileId: sp.id, role: 'Individual' } }
      }
    })
    return NextResponse.json({ ok: true, team: t })
  }

  if (action === 'join') {
    if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })
    const t = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } })
    if (!t) return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    // Check if team has an Individual member (1-person project)
    const isIndTeam = t.members.some((m: any) => m.role === 'Individual')
    if (isIndTeam) return NextResponse.json({ error: 'Cannot join an individual project' }, { status: 400 })
    if (t.members.length >= 5) return NextResponse.json({ error: 'Team is full (max 5 members)' }, { status: 400 })
    await prisma.teamMember.create({ data: { teamId, studentProfileId: sp.id, role: 'Member' } })
    return NextResponse.json({ ok: true })
  }

  if (action === 'create') {
    if (!teamName?.trim()) return NextResponse.json({ error: 'Team name required' }, { status: 400 })
    const exists = await prisma.team.findFirst({ where: { name: teamName.trim() } })
    if (exists) return NextResponse.json({ error: 'Team name already taken. Please choose another.' }, { status: 400 })
    let driveFolderId: string | null = null
    if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID)
      driveFolderId = await createTeamDriveFolder(teamName.trim(), teamName.trim())
    const t = await prisma.team.create({
      data: {
        name: teamName.trim(), course: targetCourse as any,
        driveFolderId,
        members: { create: { studentProfileId: sp.id, role: 'Team Lead' } }
      }
    })
    return NextResponse.json({ ok: true, team: t })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
