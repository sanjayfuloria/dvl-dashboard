import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const BREVO_KEY = process.env.BREVO_API_KEY!
const CC_EMAIL  = 'sanjay.fuloria@ibsindia.org'
const FROM      = { name: 'DVL Dashboard — IFHE', email: 'noreply@sanjayfuloria.tech' }

async function sendBrevo(to: {email:string;name:string}[], subject: string, html: string) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: FROM, to, cc: [{ email: CC_EMAIL, name: 'Prof. Sanjay Fuloria' }], subject, htmlContent: html }),
  })
  return res.json()
}

function buildHtml(name: string, subject: string, body: string) {
  const firstName = name.split(' ')[0].charAt(0).toUpperCase() + name.split(' ')[0].slice(1).toLowerCase()
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:0}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}.header{background:linear-gradient(135deg,#3b2ba0,#5B4BD4);padding:28px 36px 20px}.header p{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b5fd;margin:0 0 6px}.header h1{font-size:20px;font-weight:800;color:#fff;margin:0}.body{padding:32px 36px}p{font-size:14px;line-height:1.8;color:#374151;margin:0 0 14px}.footer{background:#1f2937;padding:20px 36px;text-align:center}.footer p{color:#9ca3af;font-size:12px;margin:3px 0}</style></head><body><div class="wrap"><div class="header"><p>IFHE · Digital Venture Lab · AY 2026-27</p><h1>${subject}</h1></div><div class="body"><p>Dear ${firstName},</p><p>${body.replace(/\n/g,'<br/>')}</p><p>Best wishes,<br/><strong>Prof. Sanjay Fuloria</strong><br/>Director, CDOE · IFHE Hyderabad</p></div><div class="footer"><p>DVL Dashboard · IFHE Hyderabad · AY 2026-27</p><p>https://www.sanjayfuloria.tech/dvl</p></div></div></body></html>`
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { mode, userId, section, subject, body } = await req.json()
  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  let recipients: { email: string; name: string }[] = []
  if (mode === 'individual') {
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    recipients = [{ email: user.email, name: user.name ?? user.email }]
  } else if (mode === 'broadcast') {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', studentProfile: section ? { section } : undefined, NOT: { email: { contains: 'teststudent' } } },
      select: { email: true, name: true },
    })
    recipients = students.map(s => ({ email: s.email, name: s.name ?? s.email }))
  } else return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  if (!recipients.length) return NextResponse.json({ error: 'No recipients found' }, { status: 400 })
  let sent = 0, failed = 0, errors: string[] = []
  for (const r of recipients) {
    try {
      const result = await sendBrevo([r], subject, buildHtml(r.name, subject, body))
      if (result.messageId) sent++
      else { failed++; errors.push(`${r.email}: ${result.message ?? JSON.stringify(result)}`) }
    } catch(e: any) { failed++; errors.push(`${r.email}: ${e.message}`) }
    await new Promise(res => setTimeout(res, 100))
  }
  return NextResponse.json({ ok: true, sent, failed, total: recipients.length, errors })
}

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', NOT: { email: { contains: 'teststudent' } } },
    include: { studentProfile: { select: { section: true, dvlCourse: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(students.map(s => ({ id: s.id, name: s.name, email: s.email, section: s.studentProfile?.section, course: s.studentProfile?.dvlCourse })))
}
