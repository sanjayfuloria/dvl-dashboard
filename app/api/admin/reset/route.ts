import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { scope } = await req.json()
  // scope: 'teams' | 'demoday' | 'all'

  if (scope === 'teams' || scope === 'all') {
    // Delete in dependency order
    await prisma.demoDayScore.deleteMany({})
    await prisma.demoDaySlot.deleteMany({})
    await prisma.demoDayShortlist.deleteMany({})
    await prisma.aIBuildLog.deleteMany({})
    await prisma.reflection.deleteMany({})
    await prisma.mentorSession.deleteMany({})
    await prisma.evaluation.deleteMany({})
    await prisma.deliverable.deleteMany({})
    await prisma.milestone.deleteMany({})
    await prisma.workspaceFile.deleteMany({})
    await prisma.teamMember.deleteMany({})
    await prisma.team.deleteMany({})
  }

  if (scope === 'demoday' || scope === 'all') {
    await prisma.demoDayScore.deleteMany({})
    await prisma.demoDaySlot.deleteMany({})
    await prisma.demoDayJury.deleteMany({})
    await prisma.demoDayShortlist.deleteMany({})
    await prisma.demoDay.deleteMany({})
  }

  return NextResponse.json({ ok: true, scope })
}
