import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, props: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await props.params
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Team name required' }, { status: 400 })

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true }
  })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Students can only rename if they are Team Lead or Individual
  if (session.role === 'STUDENT') {
    const sp = await prisma.studentProfile.findUnique({ where: { userId: session.id } })
    const membership = team.members.find(m => m.studentProfileId === sp?.id)
    if (!membership || membership.role === 'Member') {
      return NextResponse.json({ error: 'Only the Team Lead can rename the team' }, { status: 403 })
    }
  }

  // Check name not already taken
  const exists = await prisma.team.findFirst({
    where: { name: name.trim(), NOT: { id: teamId } }
  })
  if (exists) return NextResponse.json({ error: 'That name is already taken. Please choose another.' }, { status: 400 })

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: { name: name.trim() }
  })

  return NextResponse.json({ ok: true, team: updated })
}
