import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import * as jose from 'jose'

const BASE = 'https://www.sanjayfuloria.tech'

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET!)
}

export async function POST(req: NextRequest) {
  try {
    let email = ''
    let password = ''

    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = await req.json()
      email = body.email
      password = body.password
    } else {
      const body = await req.formData()
      email = body.get('email') as string
      password = body.get('password') as string
    }

    if (!email || !password) {
      return NextResponse.redirect(`${BASE}/dvl/login?error=missing`, { status: 302 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { password: true },
    })

    if (!user || !user.password) {
      return NextResponse.redirect(`${BASE}/dvl/login?error=invalid`, { status: 302 })
    }

    const valid = await bcrypt.compare(password, user.password.hash)
    if (!valid) {
      return NextResponse.redirect(`${BASE}/dvl/login?error=invalid`, { status: 302 })
    }

    const token = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(getSecret())

    const redirects: Record<string, string> = {
      ADMIN: `${BASE}/dvl/admin/dashboard`,
      FACULTY: `${BASE}/dvl/faculty/dashboard`,
      MENTOR: `${BASE}/dvl/mentor/dashboard`,
      STUDENT: `${BASE}/dvl/dashboard`,
    }

    const destination = redirects[user.role] ?? `${BASE}/dvl/dashboard`
    const response = NextResponse.redirect(destination, { status: 302 })
    response.cookies.set('dvl_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.redirect(`${BASE}/dvl/login?error=server`, { status: 302 })
  }
}
