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

// Turns "Pixel Minds", "Business Model Canvas" into a filesystem/Drive-safe
// slug, e.g. "PIXEL-MINDS". Used to build a consistent Drive filename.
function slugify(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Builds the standardized filename every deliverable is stored under in
// Drive, e.g. "PIXEL-MINDS_BUSINESS-MODEL-CANVAS_2026-08-31.pdf".
// Keeps the original file's extension; a date suffix means re-uploads
// don't silently overwrite/shadow the previous submission in Drive.
function buildStandardFileName(teamLabel: string, deliverableType: string, originalName: string): string {
  const extMatch = originalName.match(/\.[^.]+$/)
  const ext = extMatch ? extMatch[0].toLowerCase() : ''
  const datePart = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `${slugify(teamLabel)}_${slugify(deliverableType)}_${datePart}${ext}`
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
  const standardFileName = buildStandardFileName(team.ventureName ?? team.name, fileType ?? 'Other', file.name)

  // Upload to Drive if team has a folder
  if (team.driveFolderId) {
    const subfolderName = FOLDER_MAP[fileType] ?? 'Deliverables'
    const subfolderId = await getOrCreateSubfolder(team.driveFolderId, subfolderName)
    const targetFolderId = subfolderId ?? team.driveFolderId

    const driveResult = await uploadFileToDrive(
      targetFolderId,
      standardFileName,
      buffer,
      file.type || 'application/octet-stream'
    )

    if (driveResult) {
      driveFileId = driveResult.id
      driveFileUrl = driveResult.webViewLink
    }
  }

  // Save to database under the standardized Drive filename, so the name
  // shown in-app always matches what's actually in the team's Drive folder.
  const workspaceFile = await prisma.workspaceFile.create({
    data: {
      teamId,
      name: standardFileName,
      type: fileType ?? 'Other',
      driveFileId,
      fileUrl: driveFileUrl,
    },
  })

  // Always create/update a Deliverable record for faculty review
  if (milestoneId) {
    // Linked to a specific milestone
    await prisma.deliverable.upsert({
      where: { id: milestoneId },
      update: {
        driveFileId,
        fileUrl: driveFileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        title: fileType ?? file.name,
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
  } else {
    // No milestone ID — create a new deliverable for review
    await prisma.deliverable.create({
      data: {
        teamId,
        title: fileType ?? file.name,
        type: fileType ?? 'Other',
        driveFileId,
        fileUrl: driveFileUrl,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      }
    })

    // Notify faculty guide
    const teamWithFaculty = await prisma.team.findUnique({
      where: { id: teamId },
      include: { facultyGuide: { include: { user: true } } }
    })
    if (teamWithFaculty?.facultyGuide?.user) {
      await prisma.notification.create({
        data: {
          userId:  teamWithFaculty.facultyGuide.user.id,
          title:   'New submission for review',
          message: `Team ${teamWithFaculty.ventureName ?? teamWithFaculty.name} submitted "${fileType ?? file.name}" for review.`,
          link:    `/faculty/teams/${teamId}`,
        }
      })
    }
  }

  return NextResponse.json({
    ok: true,
    file: workspaceFile,
    driveUrl: driveFileUrl,
  })
}
