import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mailer'
import { SignJWT } from 'jose'

const MJ_KEY     = process.env.MAILJET_API_KEY!
const MJ_SECRET  = process.env.MAILJET_SECRET_KEY!
const RESEND_KEY = process.env.RESEND_API_KEY!
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)
const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://sanjayfuloria.tech/dvl'

function buildHtml(name: string, resetUrl: string) {
  const firstName = name.split(' ')[0].charAt(0).toUpperCase() + name.split(' ')[0].slice(1).toLowerCase()
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:Arial,sans-serif;background:#f3f4f6;margin:0;padding:0}.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}.header{background:linear-gradient(135deg,#3b2ba0,#5B4BD4);padding:28px 36px 20px}.header p{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#c4b5fd;margin:0 0 6px}.header h1{font-size:20px;font-weight:800;color:#fff;margin:0}.body{padding:32px 36px}p{font-size:14px;line-height:1.8;color:#374151;margin:0 0 14px}.btn{display:inline-block;background:#5B4BD4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;margin:8px 0 20px}.note{background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;margin:16px 0;font-size:13px;color:#92400E}.footer{background:#1f2937;padding:20px 36px;text-align:center}.footer p{color:#9ca3af;font-size:12px;margin:3px 0}</style></head><body><div class="wrap"><div class="header"><p>IFHE &middot; Digital Venture Lab &middot; AY 2026-27</p><h1>Password Reset</h1></div><div class="body"><p>Dear ' + firstName + ',</p><p>We received a request to reset your DVL Dashboard password. Click the button below to set a new password:</p><a href="' + resetUrl + '" class="btn">Reset my password &rarr;</a><div class="note">This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email &mdash; your password will not change.</div><p style="font-size:12px;color:#9ca3af;word-break:break-all;">Or copy this link: ' + resetUrl + '</p></div><div class="footer"><p>DVL Dashboard &middot; IFHE Hyderabad &middot; AY 2026-27</p></div></div></body></html>'
}

async function sendResetEmail(to: string, name: string, resetUrl: string) {
  const html = buildHtml(name, resetUrl)

  // Primary: Google Workspace SMTP (unlimited, already used elsewhere in the app)
  const smtpResult = await sendMail({
    to,
    name,
    subject: 'DVL Dashboard - Password Reset',
    html,
  })
  if (smtpResult.ok) return { ok: true, provider: 'smtp' }

  // Fallback: Mailjet
  try {
    const auth = Buffer.from(MJ_KEY + ':' + MJ_SECRET).toString('base64')
    const mjRes = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ Messages: [{ From: { Email: 'noreply@sanjayfuloria.tech', Name: 'DVL Dashboard - IFHE' }, To: [{ Email: to, Name: name }], Subject: 'DVL Dashboard - Password Reset', HTMLPart: html }] }),
    })
    const mjData = await mjRes.json()
    if (mjData.Messages?.[0]?.Status === 'success') return { ok: true, provider: 'mailjet' }
  } catch (e) {}

  // Last resort: Resend
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'DVL Dashboard - IFHE <noreply@sanjayfuloria.tech>', to: [to], subject: 'DVL Dashboard - Password Reset', html }),
    })
    const data = await res.json()
    if (data.id) return { ok: true, provider: 'resend' }
  } catch (e) {}

  return { ok: false, provider: 'none' }
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  // Always return success to prevent email enumeration
  if (!user) return NextResponse.json({ ok: true })

  const token = await new SignJWT({ userId: user.id, purpose: 'password-reset' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .setIssuedAt()
    .sign(JWT_SECRET)

  const resetUrl = BASE_URL + '/reset-password?token=' + token
  const result = await sendResetEmail(user.email, user.name ?? user.email, resetUrl)
  console.log('Password reset email result for ' + user.email + ':', result)

  return NextResponse.json({ ok: true })
}
