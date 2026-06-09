import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  ventureName: z.string().optional(),
  sector: z.string().optional(),
  problemStatement: z.string().optional(),
  targetUsers: z.string().optional(),
  businessOpportunity: z.string().optional(),
  aiComponents: z.string().optional(),
  technologyStack: z.string().optional(),
  progressPct: z.number().min(0).max(100).optional(),
  health: z.enum(['ON_TRACK', 'AT_RISK', 'DELAYED']).optional(),
  currentPhase: z.enum(['IDEATION', 'PROTOTYPE', 'MVP', 'COMPLETED']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { teamId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const team = await prisma.team.update({
    where: { id: params.teamId },
    data: data.data,
    include: {
      members: { include: { student: { include: { user: true } } } },
      facultyGuide: { include: { user: true } },
      mentor: { include: { user: true } },
    },
  })

  return NextResponse.json(team)
}

export async function GET(_req: NextRequest, { params }: { params: { teamId: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const team = await prisma.team.findUnique({
    where: { id: params.teamId },
    include: {
      members: { include: { student: { include: { user: true } } } },
      milestones: true,
      deliverables: true,
      evaluations: true,
      aiLogs: true,
      reflections: { include: { comments: true } },
      mentorSessions: true,
      facultyGuide: { include: { user: true } },
      mentor: { include: { user: true } },
    },
  })

  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(team)
}
