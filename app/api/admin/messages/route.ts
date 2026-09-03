import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mailer'
import { getBaseUrl } from '@/lib/site-url'

const CC_EMAIL = 'sanjay.fuloria@ibsindia.org'

function buildHtml(name: string, subject: string, body: string) {
  const firstName = name.split(' ')[0].charAt(0).toUpperCase() + name.split(' ')[0].slice(1).toLowerCase()
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:0}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}.header{background:linear-gradient(135deg,#3b2ba0,#5B4BD4);padding:28px 36px 20px}.header p{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b5fd;margin:0 0 6px}.header h1{font-size:20px;font-weight:800;color:#fff;margin:0}.body{padding:32px 36px}p{font-size:14px;line-height:1.8;color:#374151;margin:0 0 14px}.footer{background:#1f2937;padding:20px 36px;text-align:center}.footer p{color:#9ca3af;font-size:12px;margin:3px 0}</style></head><body><div class="wrap"><div class="header"><p>IFHE · Digital Venture Lab · AY 2026-27</p><h1>${subject}</h1></div><div class="body"><p>Dear ${firstName},</p><p>${body.replace(/\n/g,'<br/>')}</p><p>Best wishes,<br/><strong>Prof. Sanjay Fuloria</strong><br/>Director, CDOE · IFHE Hyderabad</p></div><div class="footer"><p>DVL Dashboard · IFHE Hyderabad · AY 2026-27</p><p>${getBaseUrl()}</p></div></div></body></html>`
}

async function sendViaMailjet(to: string, name: string, subject: string, html: string) {
  try {
    const auth = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString('base64')
    const res = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Messages: [{
          From: { Email: 'noreply@sanjayfuloria.tech', Name: 'DVL Dashboard — IFHE' },
          To: [{ Email: to, Name: name }],
          Cc: [{ Email: CC_EMAIL, Name: 'Prof. Sanjay Fuloria' }],
          Subject: subject,
          HTMLPart: html,
        }]
      }),
    })
    const data = await res.json()
    if (data.Messages?.[0]?.Status === 'success') return { ok: true }
    return { ok: false, error: JSON.stringify(data.Messages?.[0] ?? data) }
  } catch(e: any) {
    return { ok: false, error: e.message }
  }
}

async function sendOne(to: string, name: string, subject: string, html: string) {
  // 1. Google SMTP
  const smtp = await sendMail({ to, name, subject, html, cc: CC_EMAIL })
  if (smtp.ok) return { ok: true, provider: 'smtp' }
  // 2. Mailjet
  const mj = await sendViaMailjet(to, name, subject, html)
  if (mj.ok) return { ok: true, provider: 'mailjet' }
  // 3. Resend
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'DVL Dashboard — IFHE <noreply@sanjayfuloria.tech>', to: [to], cc: [CC_EMAIL], subject, html }),
    })
    const data = await res.json()
    if (data.id) return { ok: true, provider: 'resend' }
  } catch(e) {}
  return { ok: false, error: `SMTP: ${(smtp as any).error}` }
}

// Background send — fires and forgets, logs to console
async function sendAllBackground(recipients: {email:string;name:string}[], subject: string, body: string) {
  let sent = 0, failed = 0
  for (const r of recipients) {
    const html = buildHtml(r.name, subject, body)
    const result = await sendOne(r.email, r.name, subject, html)
    if (result.ok) { sent++; console.log(`[MSG] ✓ ${r.name} (${result.provider})`) }
    else { failed++; console.log(`[MSG] ✗ ${r.name}: ${(result as any).error}`) }
  }
  console.log(`[MSG] Done — ${sent} sent, ${failed} failed of ${recipients.length}`)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { mode, userId, section, subject, body } = await req.json()
  if (!subject?.trim() || !body?.trim())
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })

  let recipients: { email: string; name: string }[] = []

  if (mode === 'individual') {
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    recipients = [{ email: user.email, name: user.name ?? user.email }]
    // Individual — send synchronously so we get real result
    const html = buildHtml(recipients[0].name, subject, body)
    const result = await sendOne(recipients[0].email, recipients[0].name, subject, html)
    if (result.ok) return NextResponse.json({ ok: true, sent: 1, failed: 0, total: 1, errors: [], provider: (result as any).provider })
    return NextResponse.json({ ok: false, sent: 0, failed: 1, total: 1, errors: [`${recipients[0].email}: ${(result as any).error}`] })
  }

  if (mode === 'broadcast') {
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        NOT: { email: { contains: 'teststudent' } },
        ...(section ? { studentProfile: { section } } : {}),
      },
      select: { email: true, name: true },
    })
    recipients = students.map(s => ({ email: s.email, name: s.name ?? s.email }))
  } else if (mode === 'faculty') {
    const staff = await prisma.user.findMany({
      where: { role: { not: 'STUDENT' }, NOT: { email: { contains: 'teststudent' } } },
      select: { email: true, name: true },
    })
    recipients = staff.map(s => ({ email: s.email, name: s.name ?? s.email }))
  } else {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  if (!recipients.length)
    return NextResponse.json({ error: 'No recipients found' }, { status: 400 })

  // Fire background send and return immediately
  sendAllBackground(recipients, subject, body)

  return NextResponse.json({
    ok: true,
    sent: recipients.length,
    failed: 0,
    total: recipients.length,
    errors: [],
    provider: 'smtp',
    note: `Sending to ${recipients.length} students in background. Check PM2 logs for progress.`
  })
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    where: { NOT: { email: { contains: 'teststudent' } } },
    include: { studentProfile: { select: { section: true, dvlCourse: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(users.map(s => ({
    id: s.id, name: s.name, email: s.email,
    section: s.studentProfile?.section ?? s.role,
    course: s.studentProfile?.dvlCourse,
    role: s.role,
  })))
}
