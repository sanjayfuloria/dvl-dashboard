import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { roleRedirect } from '@/lib/utils'

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  redirect(roleRedirect(session.user.role))
}
