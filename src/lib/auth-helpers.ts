import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { headers } from 'next/headers'

export type SessionUser = {
  id: string
  email: string
  name: string | null
  role: UserRole
  tenantId: string | null
  isSuperAdmin: boolean
}

/**
 * Get the current authenticated user from headers (set by middleware).
 * Use in API Route Handlers.
 */
export async function getCurrentUserFromHeaders(): Promise<SessionUser | null> {
  const hdrs = await headers()
  const userId = hdrs.get('x-user-id')
  const tenantId = hdrs.get('x-tenant-id')
  const role = hdrs.get('x-user-role')

  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      tenantId: true,
      isSuperAdmin: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) return null

  return {
    id: user.id,
    email: user.email,
    name:
      user.name ??
      (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null),
    role: user.role,
    tenantId: user.tenantId,
    isSuperAdmin: user.isSuperAdmin,
  }
}


/**
 * Get the current authenticated session in Server Components.
 */
export async function getServerSession() {
  return auth()
}

/**
 * Assert that the user is authenticated and return them.
 * Throws if not authenticated.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUserFromHeaders()
  if (!user) {
    throw new Error('UNAUTHORIZED')
  }
  return user
}

/**
 * Assert that the user has one of the allowed roles.
 */
export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await requireAuth()
  if (!user.isSuperAdmin && !roles.includes(user.role)) {
    throw new Error('FORBIDDEN')
  }
  return user
}

/**
 * Assert that the user belongs to a tenant and return the tenant ID.
 */
export async function requireTenant(): Promise<{ user: SessionUser; tenantId: string }> {
  const user = await requireAuth()
  if (!user.tenantId) {
    throw new Error('NO_TENANT')
  }
  return { user, tenantId: user.tenantId }
}

/**
 * Role helpers
 */
export const Roles = {
  isSuperAdmin: (user: SessionUser) => user.isSuperAdmin,
  isCompanyAdmin: (user: SessionUser) =>
    user.isSuperAdmin || user.role === UserRole.COMPANY_ADMIN,
  isSales: (user: SessionUser) =>
    user.isSuperAdmin ||
    ([UserRole.COMPANY_ADMIN, UserRole.SALES_REP] as UserRole[]).includes(user.role),
  isProduction: (user: SessionUser) =>
    user.isSuperAdmin ||
    (
      [UserRole.COMPANY_ADMIN, UserRole.PRODUCTION_MANAGER, UserRole.DESIGNER] as UserRole[]
    ).includes(user.role),
  isFinance: (user: SessionUser) =>
    user.isSuperAdmin ||
    ([UserRole.COMPANY_ADMIN, UserRole.FINANCE_STAFF] as UserRole[]).includes(user.role),
  isCustomer: (user: SessionUser) => user.role === UserRole.CUSTOMER,
}

