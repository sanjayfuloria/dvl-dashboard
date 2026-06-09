import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession()
  if (!user) redirect('https://www.sanjayfuloria.tech/dvl/login')
  if (user.role !== 'ADMIN') redirect('https://www.sanjayfuloria.tech/dvl/login')

  return (
    <div>
      <Sidebar role="ADMIN" userName={user.name} userEmail={user.email} />
      <main className="main-content">{children}</main>
    </div>
  )
}
