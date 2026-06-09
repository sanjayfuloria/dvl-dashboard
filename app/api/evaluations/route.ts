import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  teamId: z.string(),
  phase: z.enum(['IDEATION', 'PROTOTYPE', 'MVP', 'COMPLETED']),
  evaluatorType: z.enum(['FACULTY', 'MENTOR', 'JURY']),
  facultyId: z.string().optional(),
  mentorId: z.string().optional(),
  feedback: z.string().optional(),
  // Phase 1
  problemRelevance:    z.number().min(1).max(10).optional(),
  validationQuality:   z.number().min(1).max(10).optional(),
  businessOpportunity: z.number().min(1).max(10).optional(),
  clarityOfThinking:   z.number().min(1).max(10).optional(),
  // Phase 2
  prototypeQuality:    z.number().min(1).max(10).optional(),
  userCentricDesign:   z.number().min(1).max(10).optional(),
  feasibility:         z.number().min(1).max(10).optional(),
  aiIntegration:       z.number().min(1).max(10).optional(),
  // Phase 3
  mvpQuality:           z.number().min(1).max(10).optional(),
  productFunctionality: z.number().min(1).max(10).optional(),
  innovation:           z.number().min(1).max(10).optional(),
  adoptionLogic:        z.number().min(1).max(10).optional(),
  scalability:          z.number().min(1).max(10).optional(),
  // Demo Day
  problemSignificance:  z.number().min(1).max(10).optional(),
  productQuality:       z.number().min(1).max(10).optional(),
  aiUtilisation:        z.number().min(1).max(10).optional(),
  businessPotential:    z.number().min(1).max(10).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: data.error.flatten() }, { status: 400 })

  // Compute total score
  const numericFields = [
    'problemRelevance', 'validationQuality', 'businessOpportunity', 'clarityOfThinking',
    'prototypeQuality', 'userCentricDesign', 'feasibility', 'aiIntegration',
    'mvpQuality', 'productFunctionality', 'innovation', 'adoptionLogic', 'scalability',
    'problemSignificance', 'productQuality', 'aiUtilisation', 'businessPotential',
  ] as const

  const scores = numericFields.map(f => data.data[f]).filter((v): v is number => typeof v === 'number')
  const totalScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null

  const evaluation = await prisma.evaluation.create({
    data: { ...data.data, totalScore },
  })

  return NextResponse.json(evaluation, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')

  const evaluations = await prisma.evaluation.findMany({
    where: teamId ? { teamId } : {},
    include: {
      faculty: { include: { user: true } },
      mentor: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(evaluations)
}
