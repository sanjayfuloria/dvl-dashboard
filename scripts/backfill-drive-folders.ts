// One-off backfill: creates a Google Drive folder for any team that
// doesn't have one yet (driveFolderId is null), using the same function
// normal team creation uses.
//
// Run: npx tsx scripts/backfill-drive-folders.ts

import { prisma } from '../lib/prisma'
import { createTeamDriveFolder } from '../lib/google-drive'

async function main() {
  const teams = await prisma.team.findMany({
    where: { driveFolderId: null },
  })

  console.log(`Found ${teams.length} team(s) without a Drive folder.`)

  for (const team of teams) {
    const folderId = await createTeamDriveFolder(team.name, team.ventureName ?? team.name, team.course)
    if (folderId) {
      await prisma.team.update({ where: { id: team.id }, data: { driveFolderId: folderId } })
      console.log(`${team.name} (${team.code ?? team.course}) -> folder ${folderId}`)
    } else {
      console.log(`${team.name} (${team.code ?? team.course}) -> FAILED, check logs`)
    }
  }

  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
