import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createTeamDriveFolder } from '@/lib/google-drive'

const createSchema = z.object({
  name: z.string().min(1),
  ventureName: z.string().optional(),
  course: z.enum(['MPB', 'MDT']),
  sector: z.string().optional(),
  problemStatement: z.string().optional(),
  targetUsers: z.string().optional(),
  businessOpportunity: z.string().optional(),
  aiComponents: z.string().optional(),
  technologyStack: z.string().optional(),
  facultyGuideId: z.string().optional(),
  mentorId: z.string().optional(),
  memberUserIds: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'ADMIN' && session.user.role !== 'FACULTY') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const data = createSchema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: data.error.flatten() }, { status: 400 })

  const { memberUserIds, ...teamData } = data.data

  // Create Google Drive folder
  let driveFolderId: string | null = null
  if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    driveFolderId = await createTeamDriveFolder(teamData.name, teamData.ventureName ?? teamData.name)
  }

  const team = await prisma.team.create({
    data: {
      ...teamData,
      driveFolderId,
    },
  })

  // Add members
  if (memberUserIds?.length) {
    const profiles = await prisma.studentProfile.findMany({
      where: { userId: { in: memberUserIds } },
    })
    await prisma.teamMember.createMany({
      data: profiles.map((p) => ({ teamId: team.id, studentProfileId: p.id })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json(team, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const course = searchParams.get('course') as 'MPB' | 'MDT' | null
  const phase = searchParams.get('phase')

  const teams = await prisma.team.findMany({
    where: {
      ...(course ? { course } : {}),
      ...(phase ? { currentPhase: phase as any } : {}),
    },
    include: {
      members: { include: { student: { include: { user: true } } } },
      facultyGuide: { include: { user: true } },
      mentor: { include: { user: true } },
      milestones: true,
      deliverables: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(teams)
}
