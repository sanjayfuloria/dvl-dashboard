import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { syncUploadToSheet, getSheetUrl } from '@/lib/google-sheets'

function parseTeamCode(code: string | null): { course: string; type: 'Team' | 'Individual'; section: string } | null {
  if (!code) return null
  const m = code.match(/^([A-Z]+)([TI])([A-Z])(\d+)$/)
  if (!m) return null
  return { course: m[1], type: m[2] === 'I' ? 'Individual' : 'Team', section: m[3] }
}

// One-time (or occasional) full sync: pushes every already-uploaded
// deliverable file into the master Sheet. New uploads sync live on their
// own — this route is only for backfilling what came before that, or for
// recovering after a Sheet was recreated.
export async function POST() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!getSheetUrl())
    return NextResponse.json({ error: 'GOOGLE_SHEETS_SPREADSHEET_ID is not configured' }, { status: 400 })

  const teams = await prisma.team.findMany({
    where: { code: { not: null } },
    include: { workspaceFiles: true },
  })

  let synced = 0
  let skipped = 0

  for (const team of teams) {
    const codeInfo = parseTeamCode(team.code)
    if (!codeInfo) { skipped += team.workspaceFiles.length; continue }

    for (const f of team.workspaceFiles) {
      await syncUploadToSheet({
        teamCode: team.code!,
        teamName: team.ventureName ?? team.name,
        course: codeInfo.course,
        section: codeInfo.section,
        type: codeInfo.type,
        deliverable: f.type,
        fileName: f.name,
        status: 'SUBMITTED',
        submittedAt: f.uploadedAt.toISOString(),
        driveLink: f.fileUrl ?? '',
      })
      synced++
    }
  }

  return NextResponse.json({ ok: true, synced, skipped, sheetUrl: getSheetUrl() })
}
