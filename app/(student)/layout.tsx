import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'STUDENT' && session.user.role !== 'ADMIN') redirect('/login')

  return (
    <div>
      <Sidebar
        role="STUDENT"
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
