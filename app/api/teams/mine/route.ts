import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// Returns ALL of the student's teams (one per DVL course they're enrolled
// in), not just the first. Pass ?course=MDT to also get `team` set to that
// specific one; otherwise `team` defaults to the first membership, kept for
// callers that haven't been updated to the multi-team shape yet.
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session?.id) return NextResponse.json(null, { status: 401 })

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.id },
    include: {
      teamMembers: {
        include: {
          team: {
            include: {
              members: { include: { student: { include: { user: true } } } },
              facultyGuide: { include: { user: true } },
              mentor: { include: { user: true } },
            },
          },
        },
      },
    },
  })

  const teams = (student?.teamMembers ?? []).map((tm) => tm.team)
  const requestedCourse = req.nextUrl.searchParams.get('course')
  const team = (requestedCourse ? teams.find((t) => t.course === requestedCourse) : null) ?? teams[0] ?? null

  return NextResponse.json({ team, teams })
}
