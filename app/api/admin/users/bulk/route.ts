import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import { getBaseUrl } from '@/lib/site-url'

const resend = new Resend(process.env.RESEND_API_KEY)

const roleLabels: Record<string, string> = {
  STUDENT: 'Student', FACULTY: 'Faculty', MENTOR: 'Industry Mentor', ADMIN: 'Administrator',
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const sendEmails = formData.get('sendEmails') === 'true'

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  const text = await file.text()
  const rows = parseCSV(text)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV is empty or invalid' }, { status: 400 })
  }

  const results = {
    created: [] as { name: string; email: string; role: string; password: string }[],
    skipped: [] as { email: string; reason: string }[],
    errors: [] as { email: string; reason: string }[],
  }

  for (const row of rows) {
    const email = row.email?.toLowerCase().trim()
    const name = row.name?.trim()
    const rawRole = row.role?.trim().toUpperCase()
    const role = ['STUDENT', 'FACULTY', 'MENTOR', 'ADMIN'].includes(rawRole) ? rawRole : 'STUDENT'
    const password = row.password?.trim() || generatePassword()

    if (!email || !email.includes('@')) {
      results.skipped.push({ email: email || '(blank)', reason: 'Invalid or missing email' })
      continue
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        results.skipped.push({ email, reason: 'User already exists' })
        continue
      }

      const user = await prisma.user.create({
        data: { email, name: name || null, role: role as any, emailVerified: new Date() },
      })

      // Create role profile
      if (role === 'STUDENT') await prisma.studentProfile.create({ data: { userId: user.id } })
      else if (role === 'FACULTY') await prisma.facultyProfile.create({ data: { userId: user.id } })
      else if (role === 'MENTOR') await prisma.mentorProfile.create({ data: { userId: user.id } })

      // Set password
      const hash = await bcrypt.hash(password, 12)
      await prisma.userPassword.create({ data: { userId: user.id, hash } })

      results.created.push({ name: name || email, email, role, password })

      // Send welcome email
      if (sendEmails) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'DVL Dashboard <noreply@sanjayfuloria.tech>',
          to: email,
          subject: 'Welcome to DVL Dashboard — Your login details',
          html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;">
            <p style="margin:0;color:#7c6af7;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">IFHE Hyderabad</p>
            <h1 style="margin:8px 0 0;color:#fff;font-size:24px;font-weight:700;">Digital Venture Lab</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 8px;color:#1a1a2e;">Welcome${name ? `, ${name}` : ''}!</h2>
            <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
              You have been added to the DVL Dashboard as <strong>${roleLabels[role]}</strong>.
            </p>
            <div style="background:#f5f4f0;border-radius:12px;padding:24px;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Login URL</p>
              <p style="margin:0 0 16px;"><a href="${getBaseUrl()}/login" style="color:#7c6af7;">${getBaseUrl()}/login</a></p>
              <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Email</p>
              <p style="margin:0 0 16px;font-size:14px;font-family:monospace;">${email}</p>
              <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Password</p>
              <p style="margin:0;font-size:18px;font-family:monospace;font-weight:700;color:#7c6af7;letter-spacing:2px;">${password}</p>
            </div>
            <a href="${getBaseUrl()}/login"
               style="display:inline-block;background:#7c6af7;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
              Sign in to DVL Dashboard →
            </a>
            <div style="margin-top:20px;padding:16px;background:#f0eeff;border-radius:8px;border-left:4px solid #7c6af7;">
              <p style="margin:0;font-size:13px;color:#5340c7;">
                <strong>Important:</strong> Please change your password after your first login via the Change Password option in the sidebar.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:12px;">Sent by DVL Dashboard administrator · IFHE Hyderabad</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        }).catch(() => {})
      }
    } catch (err: any) {
      results.errors.push({ email, reason: err.message })
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      total: rows.length,
      created: results.created.length,
      skipped: results.skipped.length,
      errors: results.errors.length,
    },
    created: results.created,
    skipped: results.skipped,
    errors: results.errors,
  })
}
