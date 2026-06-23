import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const { demoDayId, name, email, organisation, designation, round } = await req.json()
  const jury = await prisma.demoDayJury.create({ data:{ demoDayId, name, email, organisation, designation, round } })
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://www.sanjayfuloria.tech/dvl'
  return NextResponse.json({ ...jury, scoringUrl: base + '/jury/' + jury.token })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error:'Forbidden' }, { status:403 })
  const { id } = await req.json()
  await prisma.demoDayJury.delete({ where:{ id } })
  return NextResponse.json({ ok:true })
}
