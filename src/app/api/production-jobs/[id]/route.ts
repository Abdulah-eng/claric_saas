import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateProductionJobSchema } from '@/lib/validations/production'
import { getProductionJobById } from '@/lib/queries/production'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const job = await getProductionJobById(tenantId, id)
    if (!job) return apiNotFound('Production Job')
    return apiSuccess(job)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getProductionJobById(tenantId, id)
    if (!existing) return apiNotFound('Production Job')

    const body = await req.json()
    const data = updateProductionJobSchema.parse(body)

    const updateData: any = {}
    if (data.stage) updateData.stage = data.stage
    if (data.status) updateData.status = data.status
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId
    if (data.progress !== undefined) updateData.progress = data.progress
    if (data.notes !== undefined) updateData.notes = data.notes

    if (data.status === 'IN_PROGRESS' && existing.status !== 'IN_PROGRESS' && !existing.actualStart) {
      updateData.actualStart = new Date()
    }
    if (data.status === 'DONE' && existing.status !== 'DONE') {
      updateData.actualEnd = new Date()
      updateData.progress = 100
    }

    const job = await prisma.productionJob.update({
      where: { id },
      data: updateData,
    })

    // Update order status if job is DONE
    if (updateData.status === 'DONE') {
      await prisma.order.update({
        where: { id: existing.orderId },
        data: { status: 'QUALITY_CHECK' }
      })
    } else if (updateData.status === 'IN_PROGRESS' && existing.order.status === 'CONFIRMED') {
      await prisma.order.update({
        where: { id: existing.orderId },
        data: { status: 'IN_PRODUCTION' }
      })
    }

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'UPDATE',
        entity: 'ProductionJob',
        entityId: id,
        newValues: updateData,
      },
    })

    return apiSuccess(job)
  } catch (e) {
    return apiServerError(e)
  }
}
