import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiError, apiServerError, apiForbidden } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, tenantId } = await requireTenant()
    if (user.role !== 'COMPANY_ADMIN' && !user.isSuperAdmin) return apiForbidden()
    const { id } = await params
    const body = await req.json()

    const store = await prisma.companyStore.findFirst({ where: { id, tenantId } })
    if (!store) return apiError('Store not found', 404)

    const updated = await prisma.companyStore.update({ where: { id }, data: body })
    return apiSuccess(updated)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, tenantId } = await requireTenant()
    if (user.role !== 'COMPANY_ADMIN' && !user.isSuperAdmin) return apiForbidden()
    const { id } = await params

    const store = await prisma.companyStore.findFirst({ where: { id, tenantId } })
    if (!store) return apiError('Store not found', 404)

    await prisma.companyStore.delete({ where: { id } })
    return apiSuccess({ success: true })
  } catch (e) {
    return apiServerError(e)
  }
}
