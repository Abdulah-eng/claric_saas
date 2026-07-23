import { requireTenant } from '@/lib/auth-helpers'
import { apiSuccess, apiServerError, apiNotFound } from '@/lib/api-response'
import { updateLeadSchema } from '@/lib/validations/crm'
import { getLeadById } from '@/lib/queries/crm'
import { prisma } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { tenantId } = await requireTenant()
    const { id } = await params
    const lead = await getLeadById(tenantId, id)
    if (!lead) return apiNotFound('Lead')
    return apiSuccess(lead)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getLeadById(tenantId, id)
    if (!existing) return apiNotFound('Lead')

    const body = await req.json()
    const data = updateLeadSchema.parse(body)

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        estimatedValue: data.estimatedValue !== undefined ? data.estimatedValue : undefined,
      },
      include: {
        assignedTo: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId: user.id,
        action: 'UPDATE',
        entity: 'Lead',
        entityId: id,
        oldValues: existing as any,
        newValues: lead as any,
      },
    })

    return apiSuccess(lead)
  } catch (e) {
    return apiServerError(e)
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { user, tenantId } = await requireTenant()
    const { id } = await params
    const existing = await getLeadById(tenantId, id)
    if (!existing) return apiNotFound('Lead')

    await prisma.lead.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { tenantId, userId: user.id, action: 'DELETE', entity: 'Lead', entityId: id },
    })

    return apiSuccess({ deleted: true })
  } catch (e) {
    return apiServerError(e)
  }
}
