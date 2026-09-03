import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const PHASES = ['IDEATION', 'PROTOTYPE', 'MVP'] as const

// Fields a student team member may edit about their own venture.
const studentEditSchema = z.object({
  problemStatement: z.string().optional(),
  targetUsers: z.string().optional(),
  businessOpportunity: z.string().optional(),
  aiComponents: z.string().optional(),
  technologyStack: z.string().optional(),
})

// Fields admin/faculty may edit, including advancing the team's phase.
const staffEditSchema = studentEditSchema.extend({
  ventureName: z.string().optional(),
  sector: z.string().optional(),
  currentPhase: z.enum(PHASES).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { teamId } = await params

  const body = await req.json()

  if (session.role === 'ADMIN' || session.role === 'FACULTY') {
    const data = staffEditSchema.safeParse(body)
    if (!data.success) return NextResponse.json({ error: data.error.flatten() }, { status: 400 })
    const updated = await prisma.team.update({ where: { id: teamId }, data: data.data })
    return NextResponse.json(updated)
  }

  if (session.role === 'STUDENT') {
    // Students may only edit their own team's venture profile fields.
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, student: { userId: session.id } },
    })
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const data = studentEditSchema.safeParse(body)
    if (!data.success) return NextResponse.json({ error: data.error.flatten() }, { status: 400 })
    const updated = await prisma.team.update({ where: { id: teamId }, data: data.data })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { teamId } = await params
  await prisma.team.delete({ where: { id: teamId } })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { student: { include: { user: true } } } },
      milestones: true, deliverables: true, evaluations: true,
      facultyGuide: { include: { user: true } },
      mentor: { include: { user: true } },
    }
  })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(team)
}
