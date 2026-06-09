import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/verify', '/api/auth']

const roleRoutes: Record<string, string[]> = {
  STUDENT: ['/dashboard', '/venture', '/milestones', '/ai-log', '/resources', '/portfolio', '/reflections'],
  FACULTY: ['/faculty'],
  MENTOR: ['/mentor'],
  ADMIN: ['/admin'],
}

export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Require authentication
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user?.role as string

  // Admin can access everything
  if (role === 'ADMIN') return NextResponse.next()

  // Check role-based access
  for (const [allowedRole, routes] of Object.entries(roleRoutes)) {
    if (routes.some((r) => pathname.startsWith(r))) {
      if (role !== allowedRole) {
        // Redirect to their own dashboard
        const home = getHomeForRole(role)
        return NextResponse.redirect(new URL(home, req.url))
      }
    }
  }

  return NextResponse.next()
})

function getHomeForRole(role: string): string {
  const homes: Record<string, string> = {
    STUDENT: '/dashboard',
    FACULTY: '/faculty/dashboard',
    MENTOR: '/mentor/dashboard',
    ADMIN: '/admin/dashboard',
  }
  return homes[role] ?? '/login'
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
