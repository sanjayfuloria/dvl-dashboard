import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { uploadFileToDrive, getOrCreateSubfolder } from '@/lib/google-drive'

const FOLDER_MAP: Record<string, string> = {
  'Problem Brief': 'Deliverables',
  'Business Model Canvas': 'Deliverables',
  'Customer Discovery Report': 'Deliverables',
  'Opportunity Assessment': 'Deliverables',
  'Functional Prototype': 'Prototypes',
  'Product Specification': 'Deliverables',
  'User Feedback Summary': 'Deliverables',
  'MVP Demonstration': 'Deliverables',
  'Pitch Deck': 'Presentations',
  'Final Report': 'Deliverables',
  'Growth Roadmap': 'Deliverables',
  'Meeting Notes': 'Meeting Notes',
  'Research': 'Research',
  'Wireframes': 'Prototypes',
  'Other': 'Deliverables',
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const teamId = formData.get('teamId') as string
  const fileType = formData.get('type') as string
  const milestoneId = formData.get('milestoneId') as string | null

  if (!file || !teamId) return NextResponse.json({ error: 'Missing file or teamId' }, { status: 400 })

  // Get team and its Drive folder
  const team = await prisma.team.findUnique({ where: { id: teamId } })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let driveFileId: string | null = null
  let driveFileUrl: string | null = null

  // Upload to Drive if team has a folder
  if (team.driveFolderId) {
    const subfolderName = FOLDER_MAP[fileType] ?? 'Deliverables'
    const subfolderId = await getOrCreateSubfolder(team.driveFolderId, subfolderName)
    const targetFolderId = subfolderId ?? team.driveFolderId

    const driveResult = await uploadFileToDrive(
      targetFolderId,
      file.name,
      buffer,
      file.type || 'application/octet-stream'
    )

    if (driveResult) {
      driveFileId = driveResult.id
      driveFileUrl = driveResult.webViewLink
    }
  }

  // Save to database
  const workspaceFile = await prisma.workspaceFile.create({
    data: {
      teamId,
      name: file.name,
      type: fileType ?? 'Other',
      driveFileId,
      fileUrl: driveFileUrl,
    },
  })

  // If linked to a milestone deliverable, update it
  if (milestoneId) {
    await prisma.deliverable.upsert({
      where: { id: milestoneId },
      update: {
        driveFileId,
        fileUrl: driveFileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      create: {
        teamId,
        title: fileType ?? file.name,
        type: fileType ?? 'Other',
        driveFileId,
        fileUrl: driveFileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    })
  }

  return NextResponse.json({
    ok: true,
    file: workspaceFile,
    driveUrl: driveFileUrl,
  })
}
