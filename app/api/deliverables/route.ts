import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session || !['ADMIN', 'FACULTY'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const teamId = req.nextUrl.searchParams.get('teamId')
  const status = req.nextUrl.searchParams.get('status') // optional filter

  const deliverables = await prisma.deliverable.findMany({
    where: {
      ...(teamId ? { teamId } : {}),
      ...(status ? { status: status as any } : {}),
      // Faculty: only see teams assigned to them
      ...(session.role === 'FACULTY' ? {
        team: {
          facultyGuide: { userId: session.id }
        }
      } : {}),
    },
    include: {
      team: { select: { id: true, name: true, ventureName: true, course: true } },
      milestone: { select: { id: true, title: true, phase: true } },
    },
    orderBy: { submittedAt: 'desc' },
  })

  return NextResponse.json(deliverables)
}
