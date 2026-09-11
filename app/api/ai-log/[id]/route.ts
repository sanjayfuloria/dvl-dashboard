import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  activity: z.string().min(1),
  toolUsed: z.string().min(1),
  purpose: z.string().optional(),
  promptSummary: z.string().optional(),
  outputGenerated: z.string().optional(),
  humanValidation: z.string().optional(),
  finalImplementation: z.string().optional(),
})

// Confirms the signed-in user belongs to the team that owns this log entry.
// Any member of that team may edit or delete its entries.
async function assertTeamMembership(userId: string, teamId: string) {
  const sp = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { teamMembers: { where: { teamId } } },
  })
  return !!sp && sp.teamMembers.length > 0
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.aIBuildLog.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const allowed = await assertTeamMembership(session.id, existing.teamId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const data = updateSchema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const [, updated] = await prisma.$transaction([
    prisma.aIBuildLogVersion.create({
      data: {
        aiBuildLogId: existing.id,
        activity: existing.activity,
        toolUsed: existing.toolUsed,
        purpose: existing.purpose,
        promptSummary: existing.promptSummary,
        outputGenerated: existing.outputGenerated,
        humanValidation: existing.humanValidation,
        finalImplementation: existing.finalImplementation,
        editedByName: existing.editedByName ?? existing.createdByName ?? null,
        editedAt: existing.editedAt ?? existing.loggedAt,
      },
    }),
    prisma.aIBuildLog.update({
      where: { id },
      data: {
        ...data.data,
        editedAt: new Date(),
        editedByName: session.name ?? null,
      },
    }),
  ])

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.aIBuildLog.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })

  const allowed = await assertTeamMembership(session.id, existing.teamId)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Soft delete: archive rather than remove, so faculty/admin can still
  // review the entry and its edit history.
  const archived = await prisma.aIBuildLog.update({
    where: { id },
    data: { archivedAt: new Date(), archivedByName: session.name ?? null },
  })
  return NextResponse.json(archived)
}
