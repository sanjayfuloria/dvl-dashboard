import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendMail({
  to, name, subject, html, cc = 'sanjay.fuloria@ibsindia.org'
}: {
  to: string
  name: string
  subject: string
  html: string
  cc?: string
}) {
  try {
    const info = await transporter.sendMail({
      from: `"Prof. Sanjay Fuloria — DVL IFHE" <${process.env.SMTP_USER}>`,
      to,
      cc,
      subject,
      html,
    })
    return { ok: true, messageId: info.messageId }
  } catch(e: any) {
    return { ok: false, error: e.message }
  }
}
