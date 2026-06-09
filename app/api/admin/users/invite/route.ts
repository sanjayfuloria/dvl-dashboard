import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const schema = z.object({
  email: z.string().email(),
  role: z.enum(['STUDENT', 'FACULTY', 'MENTOR', 'ADMIN']),
  name: z.string().optional(),
  sendWelcomeEmail: z.boolean().optional(),
  password: z.string().optional(),
})

const roleLabels: Record<string, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  MENTOR: 'Industry Mentor',
  ADMIN: 'Administrator',
}

const roleColors: Record<string, string> = {
  STUDENT: '#0d9488',
  FACULTY: '#7c6af7',
  MENTOR: '#d97706',
  ADMIN: '#ef4444',
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const data = schema.safeParse(body)
  if (!data.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email: data.data.email } })
  if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 })

  const user = await prisma.user.create({
    data: {
      email: data.data.email,
      name: data.data.name,
      role: data.data.role,
      emailVerified: new Date(),
    },
  })

  // Create role profile
  if (data.data.role === 'STUDENT') {
    await prisma.studentProfile.create({ data: { userId: user.id } })
  } else if (data.data.role === 'FACULTY') {
    await prisma.facultyProfile.create({ data: { userId: user.id } })
  } else if (data.data.role === 'MENTOR') {
    await prisma.mentorProfile.create({ data: { userId: user.id } })
  }

  // Send welcome email with password
  if (data.data.sendWelcomeEmail && data.data.password) {
    const roleColor = roleColors[data.data.role] ?? '#7c6af7'
    const roleLabel = roleLabels[data.data.role]

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'DVL Dashboard <noreply@sanjayfuloria.tech>',
      to: data.data.email,
      subject: `Welcome to DVL Dashboard — Your login details`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;">
            <p style="margin:0;color:#7c6af7;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">IFHE Hyderabad</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;">Digital Venture Lab</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">Welcome${data.data.name ? `, ${data.data.name}` : ''}!</h2>
            <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
              You have been added to the DVL Dashboard as 
              <strong style="color:${roleColor};">${roleLabel}</strong>.
              Use the details below to sign in.
            </p>

            <!-- Credentials box -->
            <div style="background:#f5f4f0;border-radius:12px;padding:24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Login URL</p>
              <p style="margin:0 0 16px;font-size:14px;">
                <a href="https://www.sanjayfuloria.tech/dvl/login" style="color:#7c6af7;">
                  https://www.sanjayfuloria.tech/dvl/login
                </a>
              </p>

              <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Email</p>
              <p style="margin:0 0 16px;font-size:14px;font-family:monospace;color:#1a1a2e;">${data.data.email}</p>

              <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Password</p>
              <p style="margin:0;font-size:18px;font-family:monospace;font-weight:700;color:#7c6af7;letter-spacing:2px;">${data.data.password}</p>
            </div>

            <!-- CTA -->
            <a href="https://www.sanjayfuloria.tech/dvl/login" 
               style="display:inline-block;background:#7c6af7;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
              Sign in to DVL Dashboard →
            </a>

            <!-- Change password note -->
            <div style="margin-top:24px;padding:16px;background:#f0eeff;border-radius:8px;border-left:4px solid #7c6af7;">
              <p style="margin:0;font-size:13px;color:#5340c7;">
                <strong>Important:</strong> Please change your password after your first login. 
                Go to <strong>Change Password</strong> in the sidebar menu.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:12px;">
              This email was sent by the DVL Dashboard administrator at IFHE Hyderabad. 
              If you have any questions, contact your faculty guide.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    }).catch((err) => console.error('Welcome email failed:', err))
  }

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
}
