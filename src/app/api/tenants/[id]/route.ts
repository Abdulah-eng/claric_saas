import { requireRole } from '@/lib/auth-helpers'
import { apiSuccess, apiError, apiServerError } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('SUPER_ADMIN')
    const { id } = await params
    const body = await req.json()
    
    // Only allow updating specific fields
    const { name, slug, plan, isActive } = body

    const data: any = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (plan !== undefined) data.plan = plan
    if (isActive !== undefined) data.isActive = isActive

    const tenant = await prisma.tenant.update({
      where: { id },
      data
    })

    return apiSuccess(tenant)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return apiError('Slug must be unique')
    }
    return apiServerError(error)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('SUPER_ADMIN')
    const { id } = await params

    // Attempt to delete. This will fail if there are related records without cascade delete.
    // In a real production system, you'd want soft-delete or explicit cascading here.
    await prisma.tenant.delete({
      where: { id }
    })

    return apiSuccess({ success: true })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return apiError('Cannot delete company because it has active data (users, orders, etc.) associated with it. Please suspend the company instead.')
    }
    return apiServerError(error)
  }
}
