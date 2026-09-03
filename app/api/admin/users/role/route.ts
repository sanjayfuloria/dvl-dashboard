import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { z } from 'zod'
import { getBaseUrl } from '@/lib/site-url'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  userId: z.string(),
  role: z.enum(['STUDENT', 'FACULTY', 'MENTOR', 'ADMIN']),
  notify: z.boolean().optional(),
})

const roleLabels: Record<string, string> = {
  STUDENT: 'Student', FACULTY: 'Faculty', MENTOR: 'Industry Mentor', ADMIN: 'Administrator',
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const user = await prisma.user.update({
    where: { id: data.data.userId },
    data: { role: data.data.role },
  })

  // Create role profile if needed
  if (data.data.role === 'FACULTY') {
    await prisma.facultyProfile.upsert({
      where: { userId: user.id }, update: {}, create: { userId: user.id },
    })
  } else if (data.data.role === 'MENTOR') {
    await prisma.mentorProfile.upsert({
      where: { userId: user.id }, update: {}, create: { userId: user.id },
    })
  } else if (data.data.role === 'STUDENT') {
    await prisma.studentProfile.upsert({
      where: { userId: user.id }, update: {}, create: { userId: user.id },
    })
  }

  // Send notification email
  if (data.data.notify && user.email) {
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'DVL Dashboard <noreply@sanjayfuloria.tech>',
      to: user.email,
      subject: `Your DVL Dashboard role has been updated`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;">
          <div style="background:#1a1a2e;padding:24px;border-radius:12px;margin-bottom:24px;">
            <h1 style="color:white;margin:0;font-size:20px;">Digital Venture Lab</h1>
            <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:13px;">IFHE Hyderabad</p>
          </div>
          <h2 style="color:#1a1a2e;">Role updated</h2>
          <p style="color:#555;">
            Hi ${user.name ?? user.email},<br/><br/>
            Your role on the DVL Dashboard has been updated to 
            <strong>${roleLabels[data.data.role]}</strong>.
          </p>
          ${data.data.role === 'ADMIN' ? `
          <div style="background:#f0eeff;border-radius:12px;padding:20px;margin:24px 0;border-left:4px solid #7c6af7;">
            <p style="margin:0;color:#5340c7;font-size:14px;">
              <strong>You are now an Administrator.</strong> You have full access to manage users, 
              teams, evaluations, and programme settings.
            </p>
          </div>
          ` : ''}
          <a href="${getBaseUrl()}/login"
             style="display:inline-block;background:#7c6af7;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">
            Sign in to DVL Dashboard
          </a>
        </div>
      `,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
