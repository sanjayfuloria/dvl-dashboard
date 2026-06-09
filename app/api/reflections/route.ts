import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  teamId: z.string(),
  month: z.string().min(1),
  whatAchieved: z.string().optional(),
  assumptionsValidated: z.string().optional(),
  assumptionsFailed: z.string().optional(),
  userLearnings: z.string().optional(),
  mentorRecommendations: z.string().optional(),
  aiContributions: z.string().optional(),
  nextSteps: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const reflection = await prisma.reflection.create({ data: data.data })
  return NextResponse.json(reflection, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')

  const reflections = await prisma.reflection.findMany({
    where: teamId ? { teamId } : {},
    include: {
      comments: {
        include: {
          faculty: { include: { user: true } },
          mentor: { include: { user: true } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  })

  return NextResponse.json(reflections)
}
