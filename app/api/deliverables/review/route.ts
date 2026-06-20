import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !['ADMIN', 'FACULTY'].includes(session.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { deliverableId, action, feedback } = await req.json()
  // action: 'approve' | 'reject' | 'request_revision'

  if (!deliverableId || !action)
    return NextResponse.json({ error: 'deliverableId and action required' }, { status: 400 })

  const statusMap: Record<string, string> = {
    approve:          'APPROVED',
    reject:           'PENDING',
    request_revision: 'IN_PROGRESS',
  }
  const newStatus = statusMap[action]
  if (!newStatus)
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const deliverable = await prisma.deliverable.update({
    where: { id: deliverableId },
    data: {
      status:    newStatus as any,
      feedback:  feedback ?? null,
      ...(action === 'approve' ? { submittedAt: new Date() } : {}),
    },
    include: { team: { include: { members: { include: { student: { include: { user: true } } } } } } },
  })

  // Notify all team members
  const label = action === 'approve' ? 'approved' : action === 'request_revision' ? 'returned for revision' : 'rejected'
  const notifTitle = `Deliverable ${label}: ${deliverable.title}`
  const notifMsg   = feedback
    ? `Your submission "${deliverable.title}" was ${label}. Faculty feedback: ${feedback}`
    : `Your submission "${deliverable.title}" was ${label}.`

  await Promise.all(
    deliverable.team.members.map(m =>
      prisma.notification.create({
        data: {
          userId:  m.student.user.id,
          title:   notifTitle,
          message: notifMsg,
          link:    '/milestones',
        }
      })
    )
  )

  return NextResponse.json({ ok: true, deliverable })
}
