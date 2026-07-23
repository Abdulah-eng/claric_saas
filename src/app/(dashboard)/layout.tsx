import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopBar } from '@/components/layout/topbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(210,40%,96%)] dark:bg-[hsl(222,47%,8%)]">
      {/* Sidebar */}
      <AppSidebar user={session.user} />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="mx-auto max-w-[1600px] animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
