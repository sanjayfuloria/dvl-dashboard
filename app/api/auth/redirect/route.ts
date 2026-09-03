import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getBaseUrl } from '@/lib/site-url'

export async function GET() {
  const user = await getSession()
  const BASE = getBaseUrl()
  if (!user) {
    return NextResponse.redirect(`${BASE}/login`)
  }
  const redirects: Record<string, string> = {
    ADMIN: `${BASE}/admin/dashboard`,
    FACULTY: `${BASE}/faculty/dashboard`,
    MENTOR: `${BASE}/mentor/dashboard`,
    STUDENT: `${BASE}/dashboard`,
  }
  return NextResponse.redirect(redirects[user.role] ?? `${BASE}/dashboard`)
}
