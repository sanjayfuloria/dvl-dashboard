import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'MENTOR' && session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div>
      <Sidebar role="MENTOR" userName={session.user.name} userEmail={session.user.email} />
      <main className="main-content">{children}</main>
    </div>
  )
}
