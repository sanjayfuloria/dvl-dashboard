// Students can be members of more than one Team at once — one per DVL course
// they're enrolled in (e.g. an MDT-A team and a separate MPB-B team). Pages
// that show "my team" must not just grab the first membership, or the
// second course's work becomes invisible. This helper centralizes the
// "which team is active on this page" decision so every page picks the
// same way: honor an explicit ?course= if it matches one of the student's
// teams, otherwise fall back to the first membership.

export type CourseLabel = string // 'MDT' | 'MPB' | 'B2B' etc — kept loose to match the Course enum's string values

export interface TeamMembershipLike {
  team: { course: CourseLabel }
}

export function courseSlots<T extends TeamMembershipLike>(memberships: T[]): CourseLabel[] {
  const seen = new Set<CourseLabel>()
  const ordered: CourseLabel[] = []
  for (const m of memberships) {
    if (!seen.has(m.team.course)) {
      seen.add(m.team.course)
      ordered.push(m.team.course)
    }
  }
  return ordered
}

export function pickActiveMembership<T extends TeamMembershipLike>(
  memberships: T[],
  requestedCourse?: string | null
): T | null {
  if (memberships.length === 0) return null
  if (requestedCourse) {
    const match = memberships.find((m) => m.team.course === requestedCourse)
    if (match) return match
  }
  return memberships[0]
}
