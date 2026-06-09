import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import EmailProvider from 'next-auth/providers/nodemailer'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 465,
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.EMAIL_FROM ?? 'DVL Dashboard <noreply@dvl.ifhe.edu.in>',
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const { error } = await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'DVL Dashboard <noreply@dvl.ifhe.edu.in>',
          to: email,
          subject: 'Sign in to DVL Dashboard',
          html: magicLinkEmail(url, email),
        })
        if (error) {
          throw new Error(`Failed to send email: ${error.message}`)
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = (user as any).role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // After sign-in, redirect based on role (handled client-side via /api/auth/callback)
      if (url.startsWith(baseUrl)) return url
      if (url.startsWith('/')) return `${baseUrl}${url}`
      return baseUrl
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/verify',
    error: '/login',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user }) {
      // Log sign-in activity
      if (user.id) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: 'SIGN_IN',
          },
        }).catch(() => {}) // non-blocking
      }
    },
  },
})

function magicLinkEmail(url: string, email: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign in to DVL Dashboard</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:40px 20px;">
    <tr>
      <td align="center">
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
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:20px;font-weight:600;">Your sign-in link</h2>
              <p style="margin:0 0 24px;color:#666;font-size:15px;line-height:1.6;">
                Click the button below to sign in to the DVL Dashboard. This link expires in 24 hours and can only be used once.
              </p>
              <a href="${url}" style="display:inline-block;background:#7c6af7;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                Sign in to DVL Dashboard
              </a>
              <p style="margin:24px 0 0;color:#999;font-size:13px;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="${url}" style="color:#7c6af7;word-break:break-all;">${url}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9f9;padding:20px 40px;border-top:1px solid #eee;">
              <p style="margin:0;color:#aaa;font-size:12px;">
                This email was sent to ${email}. If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
