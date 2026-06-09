import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { roleRedirect } from '@/lib/utils'

export async function GET() {
  const session = await auth()
  if (!session?.user?.role) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!))
  }
  const destination = roleRedirect(session.user.role)
  return NextResponse.redirect(new URL(destination, process.env.NEXTAUTH_URL!))
}
