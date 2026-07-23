import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateOrderSchema } from '@/lib/validations/orders'
import { getOrderById } from '@/lib/queries/orders'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const order = await getOrderById(tenantId, id)
    if (!order) return apiNotFound('Order')
    return apiSuccess(order)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getOrderById(tenantId, id)
    if (!existing) return apiNotFound('Order')

    const body = await req.json()
    const data = updateOrderSchema.parse(body)

    const updateData: any = {}
    if (data.status) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes

    if (data.status === 'SHIPPED') updateData.shippedAt = new Date()
    if (data.status === 'DELIVERED') updateData.deliveredAt = new Date()
    if (data.status === 'CANCELLED') updateData.cancelledAt = new Date()

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { customer: { select: { companyName: true } } },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        customerId: order.customerId,
        action: 'UPDATE',
        entity: 'Order',
        entityId: id,
        newValues: updateData,
      },
    })

    return apiSuccess(order)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getOrderById(tenantId, id)
    if (!existing) return apiNotFound('Order')

    await prisma.order.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId, userId: user.id, action: 'DELETE', entity: 'Order', entityId: id },
    })

    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
