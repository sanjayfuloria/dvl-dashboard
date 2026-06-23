import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const { demoDayId, teamId, round, slotTime, room, order } = await req.json()
  return NextResponse.json(await prisma.demoDaySlot.upsert({
    where: { demoDayId_teamId_round:{ demoDayId, teamId, round } },
    update: { slotTime, room, order: order??0 },
    create: { demoDayId, teamId, round, slotTime, room, order: order??0 },
  }))
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const { id } = await req.json()
  await prisma.demoDaySlot.delete({ where:{ id } })
  return NextResponse.json({ ok:true })
}
