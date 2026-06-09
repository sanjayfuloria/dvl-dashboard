import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'

const PUBLIC = ['/login', '/verify', '/api/login', '/api/logout', '/api/auth', '/api/magic', '/api/verify', '/change-password', '/api/auth/change-password', '/api/upload']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC.some((r) => pathname.startsWith(r))) return NextResponse.next()

  const token = req.cookies.get('dvl_session')?.value
  if (!token) {
    return NextResponse.redirect(new URL('https://www.sanjayfuloria.tech/dvl/login'))
  }

  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    await jose.jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('https://www.sanjayfuloria.tech/dvl/login'))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
