import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
        take: 1,
      },
    },
  })

  const team = student?.teamMembers?.[0]?.team ?? null
  return NextResponse.json(team)
}
