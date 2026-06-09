import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 })

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
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
