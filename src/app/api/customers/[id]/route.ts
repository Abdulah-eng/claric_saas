import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateCustomerSchema } from '@/lib/validations/crm'
import { getCustomerById } from '@/lib/queries/crm'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const customer = await getCustomerById(tenantId, id)
    if (!customer) return apiNotFound('Customer')
    return apiSuccess(customer)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getCustomerById(tenantId, id)
    if (!existing) return apiNotFound('Customer')

    const body = await req.json()
    const data = updateCustomerSchema.parse(body)

    const customer = await prisma.customer.update({
      where: { id },
      data,
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        customerId: id,
        action: 'UPDATE',
        entity: 'Customer',
        entityId: id,
        oldValues: existing as any,
        newValues: customer as any,
      },
    })

    return apiSuccess(customer)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getCustomerById(tenantId, id)
    if (!existing) return apiNotFound('Customer')

    // Soft delete
    await prisma.customer.update({ where: { id }, data: { isActive: false } })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        customerId: id,
        action: 'DELETE',
        entity: 'Customer',
        entityId: id,
      },
    })

    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
