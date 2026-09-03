import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getBaseUrl } from '@/lib/site-url'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect(`${getBaseUrl()}/login`)
  if (user.role !== 'ADMIN') redirect(`${getBaseUrl()}/login`)

  return (
    <div>
      <Sidebar role="ADMIN" userName={user.name} userEmail={user.email} />
      <main className="main-content">{children}</main>
    </div>
  )
}
