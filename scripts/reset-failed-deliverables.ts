// One-off cleanup: before today's fix, every upload attempt was recorded
// as a successful SUBMITTED deliverable even when the file never reached
// Google Drive. This left students seeing a false "submitted" status with
// no working file behind it. This script finds every deliverable that was
// never actually saved to Drive (no driveFileId) and resets it back to
// PENDING, clearing the timestamp/link/feedback, so the Milestones page
// correctly shows it as still needing an upload — and clears out the
// matching phantom WorkspaceFile rows, which never pointed at a real file.
//
// Run: npx tsx scripts/reset-failed-deliverables.ts

import { prisma } from '../lib/prisma'

async function main() {
  const deliverables = await prisma.deliverable.findMany({
    where: { driveFileId: null, status: { not: 'PENDING' } },
  })
  console.log(`Found ${deliverables.length} deliverable(s) marked submitted but never actually saved.`)

  for (const d of deliverables) {
    await prisma.deliverable.update({
      where: { id: d.id },
      data: { status: 'PENDING', submittedAt: null, fileUrl: null, feedback: null },
    })
    console.log(`Reset: ${d.title} (team ${d.teamId})`)
  }

  const phantomFiles = await prisma.workspaceFile.deleteMany({
    where: { driveFileId: null },
  })
  console.log(`Removed ${phantomFiles.count} phantom workspace file record(s) with no real file behind them.`)

  console.log('Done. Students will now see these deliverables as not-yet-submitted and can re-upload.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
