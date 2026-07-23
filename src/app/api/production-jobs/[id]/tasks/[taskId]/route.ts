import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateProductionTaskSchema } from '@/lib/validations/production'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string; taskId: string }> }

export async function PUT(req: Request, { params }: Params) {
  try {
    await requireTenant()
    const { taskId } = await params
    const body = await req.json()
    const data = updateProductionTaskSchema.parse(body)

    const updateData: any = {}
    if (data.status) updateData.status = data.status
    if (data.actualHours !== undefined) updateData.actualHours = data.actualHours

    if (data.status === 'DONE') {
      updateData.completedAt = new Date()
    }

    const task = await prisma.productionTask.update({
      where: { id: taskId },
      data: updateData,
    })

    return apiSuccess(task)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await requireTenant()
    const { taskId } = await params
    await prisma.productionTask.delete({ where: { id: taskId } })
    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
