import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || !['ADMIN','FACULTY'].includes(session.role)) return NextResponse.json({ error:'Forbidden' }, { status:403 })
  return NextResponse.json(await prisma.team.findMany({
    where: { NOT:{ name:{ startsWith:'__INDIVIDUAL__' } } },
    include: {
      members: { include:{ student:{ include:{ user:{ select:{ name:true } } } } } },
      facultyGuide: { include:{ user:{ select:{ name:true } } } },
      shortlist: true,
    },
    orderBy: { createdAt:'desc' },
  }))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const { teamId, status, notes } = await req.json()
  const sl = await prisma.demoDayShortlist.upsert({
    where: { teamId },
    update: { status, notes, updatedAt: new Date() },
    create: { teamId, status, notes },
  })
  if (['SHORTLISTED','FINALIST'].includes(status)) {
    const team = await prisma.team.findUnique({ where:{ id:teamId }, include:{ members:{ include:{ student:{ include:{ user:true } } } } } })
    const msg = status === 'FINALIST'
      ? 'Congratulations! Your team has advanced to the Demo Day Finals!'
      : 'Congratulations! Your team has been shortlisted for Demo Day!'
    if (team) await Promise.all(team.members.map(m =>
      prisma.notification.create({ data:{ userId:m.student.user.id, title:'Demo Day Update', message:msg, link:'/milestones' } })
    ))
  }
  return NextResponse.json(sl)
}
