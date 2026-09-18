import { prisma } from './prisma'

// MDT runs a single section; MPB runs two (A and B). A team's section is
// taken from its members' StudentProfile.section — teams are single-section
// by policy, so any member's section is authoritative.
function sectionLetter(course: string, section?: string | null): string {
  if (course === 'MDT') return 'A'
  const letter = (section || 'A').trim().toUpperCase().slice(0, 1)
  return letter || 'A'
}

// Builds a code like MPBTA1 (MPB, Team, Section A, #1) or MPBIA1 (MPB,
// Individual, Section A, #1). Numbering restarts at 1 for each distinct
// course + type + section combination.
export async function generateTeamCode(
  course: string,
  section: string | null | undefined,
  isIndividual: boolean
): Promise<string> {
  const sec = sectionLetter(course, section)
  const type = isIndividual ? 'I' : 'T'
  const prefix = `${course}${type}${sec}`

  const existing = await prisma.team.findMany({
    where: { code: { startsWith: prefix } },
    select: { code: true },
  })

  let max = 0
  for (const t of existing) {
    const suffix = t.code?.slice(prefix.length) ?? ''
    const n = parseInt(suffix, 10)
    if (!isNaN(n) && n > max) max = n
  }

  return `${prefix}${max + 1}`
}
