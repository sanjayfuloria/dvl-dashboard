import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const user = await getSession()
  if (!user) redirect('https://www.sanjayfuloria.tech/dvl/login')

  const redirects: Record<string, string> = {
    ADMIN: '/dvl/admin/dashboard',
    FACULTY: '/dvl/faculty/dashboard',
    MENTOR: '/dvl/mentor/dashboard',
    STUDENT: '/dvl/dashboard',
  }
  redirect('https://www.sanjayfuloria.tech' + (redirects[user.role] ?? '/dvl/dashboard'))
}
