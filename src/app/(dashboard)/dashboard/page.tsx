import type { Metadata } from 'next'
import { auth } from '@/auth'
import { TenantDashboard } from './_components/tenant-dashboard'
import { SuperAdminDashboard } from './_components/superadmin-dashboard'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await auth()

  if (session?.user?.role === 'SUPER_ADMIN') {
    return <SuperAdminDashboard session={session} />
  }

  return <TenantDashboard session={session} />
}
