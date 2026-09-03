import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  // Must match the domain the cookie was set with at login (see
  // app/api/login/route.ts) — a delete() without it only clears a
  // host-only cookie, not this domain-scoped one, so the browser would
  // keep sending a "logged out" session right back to the server.
  response.cookies.set('dvl_session', '', { domain: '.sanjayfuloria.tech', path: '/', maxAge: 0 })
  return response
}
