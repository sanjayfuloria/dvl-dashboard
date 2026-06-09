import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  type: z.enum(['READING','CASE','FRAMEWORK','TEMPLATE','TOOLKIT','PROMPT_LIBRARY','AI_GUIDE','PRODUCT_GUIDE']),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
  driveFileId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  course: z.enum(['MPB','MDT']).optional(),
  industry: z.string().optional(),
  technology: z.string().optional(),
  framework: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'FACULTY') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const resource = await prisma.resource.create({
    data: { ...data.data, createdById: session.user.id },
  })
  return NextResponse.json(resource, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resources = await prisma.resource.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(resources)
}
