import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  teamId: z.string(),
  activity: z.string().min(1),
  toolUsed: z.string().min(1),
  purpose: z.string().optional(),
  promptSummary: z.string().optional(),
  outputGenerated: z.string().optional(),
  humanValidation: z.string().optional(),
  finalImplementation: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const log = await prisma.aIBuildLog.create({ data: data.data })
  return NextResponse.json(log, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')
  if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

  const logs = await prisma.aIBuildLog.findMany({
    where: { teamId },
    orderBy: { loggedAt: 'desc' },
  })
  return NextResponse.json(logs)
}
