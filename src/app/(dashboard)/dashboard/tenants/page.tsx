import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { TenantsList } from './_components/tenants-list'

export const metadata: Metadata = { title: 'Companies (Tenants)' }

export default async function TenantsPage() {
  await requireRole('SUPER_ADMIN')
  
  const tenants = await prisma.tenant.findMany({
    include: {
      users: {
        where: { role: 'COMPANY_ADMIN' },
        select: { id: true, name: true, email: true }
      },
      _count: {
        select: { users: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Format data for the client component
  const formattedTenants = tenants.map(t => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    plan: t.plan,
    isActive: t.isActive,
    userCount: t._count.users,
    createdAt: t.createdAt.toISOString(),
    admin: t.users[0] || null
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
          Companies
        </h1>
        <p className="mt-1 text-sm text-[hsl(215,16%,47%)]">
          Manage platform tenants and their administrative accounts.
        </p>
      </div>

      <TenantsList initialData={formattedTenants} />
    </div>
  )
}
