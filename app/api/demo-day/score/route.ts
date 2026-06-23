import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error:'Token required' }, { status:400 })
  const jury = await prisma.demoDayJury.findUnique({ where:{ token }, include:{ demoDay:true } })
  if (!jury) return NextResponse.json({ error:'Invalid token' }, { status:404 })
  const slots = await prisma.demoDaySlot.findMany({
    where: { demoDayId:jury.demoDayId, round:jury.round },
    include: {
      team: { select:{ id:true,name:true,ventureName:true,course:true,problemStatement:true,targetUsers:true,aiComponents:true,technologyStack:true,members:{include:{student:{include:{user:{select:{name:true}}}}}},facultyGuide:{include:{user:{select:{name:true}}}} } },
      scores: { where:{ juryId:jury.id } },
    },
    orderBy: { order:'asc' },
  })
  return NextResponse.json({ jury, slots, demoDay:jury.demoDay })
}

export async function POST(req: NextRequest) {
  const { token, slotId, problemSignificance, productQuality, aiUtilisation, businessPotential, feedback } = await req.json()
  const jury = await prisma.demoDayJury.findUnique({ where:{ token } })
  if (!jury) return NextResponse.json({ error:'Invalid token' }, { status:403 })
  const total = ((problemSignificance??0)+(productQuality??0)+(aiUtilisation??0)+(businessPotential??0))/4
  return NextResponse.json({ ok:true, score: await prisma.demoDayScore.upsert({
    where: { slotId_juryId:{ slotId, juryId:jury.id } },
    update: { problemSignificance,productQuality,aiUtilisation,businessPotential,totalScore:total,feedback },
    create: { slotId,juryId:jury.id,problemSignificance,productQuality,aiUtilisation,businessPotential,totalScore:total,feedback },
  })})
}
