import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const d = await prisma.demoDay.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      slots: {
        include: {
          team: { select: { id:true,name:true,ventureName:true,course:true,currentPhase:true,progressPct:true,problemStatement:true,targetUsers:true,aiComponents:true,technologyStack:true,members:{include:{student:{include:{user:{select:{name:true}}}}}},facultyGuide:{include:{user:{select:{name:true}}}} } },
          scores: { include: { jury: { select: { id:true,name:true,organisation:true } } } },
        },
        orderBy: [{ round:'asc' },{ order:'asc' }],
      },
      jury: { orderBy: { createdAt:'asc' } },
    },
  })
  return NextResponse.json(d)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const { title, date, venue } = await req.json()
  const d = await prisma.demoDay.create({ data: { title, date: new Date(date), venue } })
  return NextResponse.json(d)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const { id, ...data } = await req.json()
  if (data.date) data.date = new Date(data.date)
  return NextResponse.json(await prisma.demoDay.update({ where:{ id }, data }))
}
