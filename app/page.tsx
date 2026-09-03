import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getBaseUrl } from '@/lib/site-url'

export default async function RootPage() {
  const user = await getSession()
  if (!user) redirect(`${getBaseUrl()}/login`)

  const redirects: Record<string, string> = {
    ADMIN: '/admin/dashboard',
    FACULTY: '/faculty/dashboard',
    MENTOR: '/mentor/dashboard',
    STUDENT: '/dashboard',
  }
  redirect(getBaseUrl() + (redirects[user.role] ?? '/dashboard'))
}
