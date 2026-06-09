import * as jose from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const COOKIE = 'dvl_session'

function getSecret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET!)
}

export async function createSession(userId: string) {
  const token = await new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  })
  return token
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jose.jwtVerify(token, getSecret())
    const userId = payload.userId as string
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return user
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE)
}
