// One-off backfill: assigns a code to every existing team that doesn't
// have one yet, in creation order (oldest first) so numbering matches the
// rough order teams were formed in.
//
// Run once after the migration: npx tsx scripts/backfill-team-codes.ts

import { prisma } from '../lib/prisma'
import { generateTeamCode } from '../lib/team-code'

async function main() {
  const teams = await prisma.team.findMany({
    where: { code: null },
    orderBy: { createdAt: 'asc' },
    include: { members: { include: { student: true } } },
  })

  console.log(`Found ${teams.length} team(s) without a code.`)

  for (const team of teams) {
    const isIndividual = team.members.some(m => m.role === 'Individual')
    const section = team.members[0]?.student?.section ?? null
    const code = await generateTeamCode(team.course, section, isIndividual)
    await prisma.team.update({ where: { id: team.id }, data: { code } })
    console.log(`${team.name} (${team.course}) -> ${code}`)
  }

  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
