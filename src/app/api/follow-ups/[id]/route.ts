import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiError, apiServerError, apiNotFound } from '@/lib/api-response'
import { prisma } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    
    const existing = await prisma.followUp.findFirst({ where: { id, tenantId } })
    if (!existing) return apiNotFound('Follow-up')

    const body = await req.json()
    const dataToUpdate: any = {}
    
    if (body.title !== undefined) dataToUpdate.title = body.title
    if (body.notes !== undefined) dataToUpdate.notes = body.notes
    if (body.dueDate !== undefined) dataToUpdate.dueDate = new Date(body.dueDate)
    if (body.isDone !== undefined) {
      dataToUpdate.isDone = body.isDone
      dataToUpdate.completedAt = body.isDone ? new Date() : null
    }

    const updated = await prisma.followUp.update({
      where: { id },
      data: dataToUpdate,
    })

    return apiSuccess(updated)
  } catch (error) {
    return apiServerError(error)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    
    const existing = await prisma.followUp.findFirst({ where: { id, tenantId } })
    if (!existing) return apiNotFound('Follow-up')

    await prisma.followUp.delete({ where: { id } })
    return apiSuccess({ deleted: true })
  } catch (error) {
    return apiServerError(error)
  }
}
