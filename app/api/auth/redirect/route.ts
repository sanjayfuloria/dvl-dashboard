import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const user = await getSession()
  if (!user) {
    return NextResponse.redirect('https://www.sanjayfuloria.tech/dvl/login')
  }
  const redirects: Record<string, string> = {
    ADMIN: 'https://www.sanjayfuloria.tech/dvl/admin/dashboard',
    FACULTY: 'https://www.sanjayfuloria.tech/dvl/faculty/dashboard',
    MENTOR: 'https://www.sanjayfuloria.tech/dvl/mentor/dashboard',
    STUDENT: 'https://www.sanjayfuloria.tech/dvl/dashboard',
  }
  return NextResponse.redirect(redirects[user.role] ?? 'https://www.sanjayfuloria.tech/dvl/dashboard')
}
